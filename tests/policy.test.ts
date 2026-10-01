import assert from "node:assert/strict";
import test from "node:test";
import type { Candidate, EvaluatedCandidate, ForecastEvent, ForecastResult, Position } from "@/lib/domain";
import { classifyProbabilityRisk, evaluateCandidate, generateCandidates, validateForecast } from "@/lib/policy";
import { allocationFraction, createPosition, resolvePositions } from "@/lib/simulation";

const event: ForecastEvent = {
  id: "match-1", category: "sports", title: "Example match", description: "Demo",
  startTime: "2026-10-02T12:00:00.000Z", resolutionTime: "2026-10-02T14:00:00.000Z",
  outcomes: ["home", "away"], interests: ["football"], metadata: {}, dataQuality: 0.95,
  dataCapturedAt: "2026-10-01T09:00:00.000Z", source: "DEMO DATA",
};
const forecast: ForecastResult = {
  eventId: event.id, outcomes: [{ outcome: "home", probability: 0.65 }, { outcome: "away", probability: 0.35 }],
  uncertainty: 0.1, factors: [], modelVersion: "demo-v1", generatedAt: "2026-10-01T10:00:00.000Z",
};
const candidate: Candidate = {
  id: "match-1:home", eventId: event.id, outcome: "home", probability: 0.65, uncertainty: 0.1,
  riskBand: "low", referenceProbability: 0.6, probabilityGap: 0.05, dataQuality: 0.95,
  dataCapturedAt: event.dataCapturedAt, calibrationError: 0.05,
};

 test("classifies all specified probability risk boundaries", () => {
  const cases = [
    [0, "very_high"], [1, "very_high"], [14, "very_high"], [14.5, "very_high"], [15, "high"],
    [39, "high"], [39.5, "high"], [40, "medium"], [59, "medium"], [59.5, "medium"], [60, "low"],
    [80, "low"], [81, "low"], [100, "low"],
  ] as const;
  for (const [percent, band] of cases) assert.equal(classifyProbabilityRisk(percent / 100), band);
  for (const value of [-0.01, 1.01, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => classifyProbabilityRisk(value), RangeError);
  }
});

test("validates outcome identity, probability bounds and sum tolerance", () => {
  assert.deepEqual(validateForecast(event, forecast), []);
  assert.ok(validateForecast(event, { ...forecast, outcomes: [
    { outcome: "home", probability: -0.1 }, { outcome: "away", probability: 1.1 },
  ] }).length > 0);
  assert.ok(validateForecast(event, { ...forecast, outcomes: [
    { outcome: "home", probability: 0.6 }, { outcome: "away", probability: 0.399 },
  ] }).some((message) => message.includes("sum")));
  assert.deepEqual(validateForecast(event, { ...forecast, outcomes: [
    { outcome: "home", probability: 0.6005 }, { outcome: "away", probability: 0.3995 },
  ] }), []);
  assert.ok(validateForecast(event, { ...forecast, outcomes: [
    { outcome: "home", probability: 0.5 }, { outcome: "home", probability: 0.5 },
  ] }).some((message) => message.includes("unique")));
  assert.ok(validateForecast(event, { ...forecast, outcomes: [
    { outcome: "home", probability: 0.5 }, { outcome: "draw", probability: 0.5 },
  ] }).some((message) => message.includes("match")));
  assert.ok(validateForecast(event, { ...forecast, uncertainty: 1.01 }).some((message) => message.includes("uncertainty")));
  assert.ok(validateForecast(event, { ...forecast, uncertainty: -0.01 }).some((message) => message.includes("uncertainty")));
  assert.ok(validateForecast(event, { ...forecast, generatedAt: event.startTime }).some((message) => message.includes("before")));
});

test("generates matching candidates and abstains on reference gaps and wrong risk bands", () => {
  const references = [{ eventId: event.id, outcome: "home", probability: 0.4, provider: "demo", capturedAt: forecast.generatedAt }];
  const generated = generateCandidates(event, forecast, references);
  assert.equal(generated.length, 2);
  assert.equal(generated[0].probabilityGap, 0.25);
  const signed = generateCandidates(event, forecast, [
    { eventId: event.id, outcome: "home", probability: 0.8, provider: "demo", capturedAt: forecast.generatedAt },
  ])[0];
  assert.ok(Math.abs((signed.probabilityGap ?? 0) - -0.15) < Number.EPSILON * 2);
  assert.match(evaluateCandidate(signed, "low", true, forecast.generatedAt).reason, /gap/);
  const gapDecision = evaluateCandidate(generated[0], "low", true, forecast.generatedAt);
  assert.equal(gapDecision.decision, "abstain");
  assert.match(gapDecision.reason, /gap/);
  const bandDecision = evaluateCandidate(candidate, "medium", true, forecast.generatedAt);
  assert.equal(bandDecision.decision, "abstain");
  assert.match(bandDecision.reason, /band/);
  const noReference: Candidate = { ...candidate, referenceProbability: undefined, probabilityGap: undefined };
  assert.equal(evaluateCandidate(noReference, "low", true, forecast.generatedAt).decision, "include");
  assert.equal(evaluateCandidate({ ...noReference, uncertainty: 0.21 }, "low", true, forecast.generatedAt).decision, "abstain");
});

test("applies stricter evidence thresholds to lower-risk profiles", () => {
  const medium = { ...candidate, probability: 0.54, referenceProbability: 0.4, riskBand: "medium" as const, uncertainty: 0.14, dataQuality: 0.75, probabilityGap: 0.14 };
  assert.equal(evaluateCandidate(medium, "medium", true, forecast.generatedAt).decision, "include");
  const mediumAtHighUncertainty = { ...medium, probability: 0.56, uncertainty: 0.45, probabilityGap: 0.16 };
  assert.equal(evaluateCandidate(mediumAtHighUncertainty, "medium", true, forecast.generatedAt).decision, "abstain");

  const high = { ...candidate, probability: 0.35, referenceProbability: 0.2, riskBand: "high" as const, uncertainty: 0.4, dataQuality: 0.7, probabilityGap: 0.15 };
  assert.equal(evaluateCandidate(high, "high", true, forecast.generatedAt).decision, "include");
  assert.equal(evaluateCandidate(high, "medium", true, forecast.generatedAt).decision, "abstain");
});

test("evidence gates reject stale, low-quality and poor-calibration candidates", () => {
  const stale = evaluateCandidate(candidate, "low", true, "2026-10-03T12:00:00.000Z");
  assert.equal(stale.decision, "abstain");
  assert.match(stale.reason, /stale/);
  const poorQuality = evaluateCandidate({ ...candidate, dataQuality: 0.79 }, "low", true, forecast.generatedAt);
  assert.match(poorQuality.reason, /quality/);
  const uncalibrated = evaluateCandidate({ ...candidate, calibrationError: 0.26 }, "low", true, forecast.generatedAt);
  assert.match(uncalibrated.reason, /Calibration/);
});

test("allocation fractions stay within profile bounds and scale at score boundaries", () => {
  assert.equal(allocationFraction("low", 0), 0.01);
  assert.equal(allocationFraction("low", 1), 0.03);
  assert.equal(allocationFraction("medium", 0), 0.03);
  assert.equal(allocationFraction("medium", 1), 0.05);
  assert.equal(allocationFraction("high", 0), 0.05);
  assert.equal(allocationFraction("high", 1), 0.1);
  assert.equal(allocationFraction("low", -2), 0.01);
  assert.equal(allocationFraction("high", 2), 0.1);
});

test("creates only pre-event snapshots and rejects duplicate or contradictory active positions", () => {
  const decision = evaluateCandidate(candidate, "low", true, forecast.generatedAt);
  assert.equal(decision.decision, "include");
  const entry: EvaluatedCandidate = { event, forecast, candidate, decision,
    reference: { eventId: event.id, outcome: "home", probability: 0.6, provider: "demo", capturedAt: forecast.generatedAt } };
  const position = createPosition(entry, 1000, [], "2026-10-01T10:00:00.000Z");
  assert.ok(position);
  assert.equal(position.createdAt, "2026-10-01T10:00:00.000Z");
  assert.equal(position.referenceProbability, 0.6);
  assert.equal(position.status, "active");
  assert.equal(createPosition(entry, 1000, [position], "2026-10-01T10:00:00.000Z"), null);
  const contradiction: Position = { ...position, id: "other", outcome: "away" };
  assert.equal(createPosition(entry, 1000, [contradiction], "2026-10-01T10:00:00.000Z"), null);
  assert.equal(createPosition(entry, 1000, [], event.startTime), null);
  assert.equal(createPosition(entry, 0, [], "2026-10-01T10:00:00.000Z"), null);
});

test("settles virtual credits deterministically and leaves unmatched positions unchanged", () => {
  const entry: EvaluatedCandidate = { event, forecast, candidate, decision: evaluateCandidate(candidate, "low", true, forecast.generatedAt) };
  const position = createPosition(entry, 1000, [], "2026-10-01T10:00:00.000Z");
  assert.ok(position);
  const settled = resolvePositions([position], [{ eventId: event.id, actualOutcome: "home", resolvedAt: event.resolutionTime }]);
  assert.equal(settled[0].result, "correct");
  assert.equal(settled[0].creditReturn, position.virtualAllocation / candidate.referenceProbability!);
  assert.equal(settled[0].status, "resolved");
  assert.equal(resolvePositions([position], [])[0].status, "active");
  const zeroReference = resolvePositions([{ ...position, referenceProbability: 0 }], [
    { eventId: event.id, actualOutcome: "home", resolvedAt: event.resolutionTime },
  ]);
  assert.equal(zeroReference[0].creditReturn, position.virtualAllocation / position.probability);
});
