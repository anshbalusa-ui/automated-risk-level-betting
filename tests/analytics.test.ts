import assert from "node:assert/strict";
import test from "node:test";
import type { AgentRun, EvaluatedCandidate } from "@/lib/domain";
import { brierScore, calibration, summarize } from "@/lib/analytics";

const approximately = (actual: number, expected: number) => {
  assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} differs from ${expected}`);
};

function candidate(
  id: string,
  category: "sports" | "weather",
  riskBand: "low" | "medium" | "high" | "very_high",
  outcome: string,
  probability: number,
  decision: "include" | "abstain",
): EvaluatedCandidate {
  return {
    event: {
      id: `event-${id}`,
      category,
      title: id,
      description: "demo",
      startTime: "2020-01-01T00:00:00.000Z",
      resolutionTime: "2020-01-02T00:00:00.000Z",
      outcomes: [outcome, "other"],
      interests: [],
      metadata: {},
      dataQuality: 1,
      dataCapturedAt: "2020-01-01T00:00:00.000Z",
      source: "fixture",
    },
    forecast: {
      eventId: `event-${id}`,
      outcomes: [{ outcome, probability }],
      uncertainty: 0,
      factors: [],
      modelVersion: "test",
      generatedAt: "2020-01-01T00:00:00.000Z",
    },
    candidate: {
      id,
      eventId: `event-${id}`,
      outcome,
      probability,
      uncertainty: 0,
      riskBand,
      dataQuality: 1,
      dataCapturedAt: "2020-01-01T00:00:00.000Z",
      calibrationError: 0,
    },
    decision: {
      candidateId: id,
      profile: "low",
      decision,
      riskScore: 0,
      reason: "test",
      policyVersion: "test",
    },
  };
}

function run(evaluated: EvaluatedCandidate[], resolvedIds: string[]): AgentRun {
  return {
    id: "test-run",
    generatedAt: "2020-01-03T00:00:00.000Z",
    preferences: {
      categories: ["sports", "weather"],
      interests: [],
      riskProfile: "low",
      mode: "review",
      initialBankroll: 100,
      allocationPercent: 5,
    },
    evaluated,
    positions: [],
    resolutions: resolvedIds.map((id) => ({
      eventId: `event-${id}`,
      actualOutcome: id === "miss" ? "other" : "win",
      resolvedAt: "2020-01-02T00:00:00.000Z",
    })),
    activity: { scanned: 9, relevant: 7, bandMatched: 4, included: 2, abstained: 2 },
    initialBankroll: 100,
    availableCredits: 100,
    sourceLabel: "DEMO DATA",
  };
}

test("Brier score is squared error for either binary outcome", () => {
  approximately(brierScore(0.8, true), 0.04);
  approximately(brierScore(0.8, false), 0.64);
});

test("calibration assigns exact boundaries to the bucket starting there", () => {
  const result = calibration(
    [0, 0.15, 0.4, 0.6, 0.8, 1].map((probability, index) => ({
      probability,
      occurred: index % 2 === 0,
    })),
  );
  assert.deepEqual(
    result.map(({ label, count }) => [label, count]),
    [
      ["0–15", 1],
      ["15–40", 1],
      ["40–60", 1],
      ["60–80", 1],
      ["80–100", 2],
    ],
  );
  assert.equal(result[1].observedFrequency, 0);
  assert.equal(result[4].observedFrequency, 0.5);
  assert.equal(result[2].observedFrequency, 1);
  assert.equal(result[3].observedFrequency, 0);
  approximately(result[0].predictedMean!, 0);
  approximately(result[4].predictedMean!, 0.9);
  approximately(result[3].predictedMean!, 0.6);
});

test("summary scores only resolved candidates and separates included accuracy", () => {
  const rows = [
    candidate("hit", "sports", "low", "win", 0.8, "include"),
    candidate("miss", "sports", "low", "win", 0.7, "include"),
    candidate("abstain", "weather", "high", "win", 0.2, "abstain"),
    candidate("pending", "weather", "high", "win", 0.99, "include"),
    candidate("low-abstain", "weather", "low", "win", 0.4, "abstain"),
    candidate("lowprob-hit", "weather", "low", "win", 0.2, "include"),
  ];
  const summary = summarize(run(rows, ["hit", "miss", "abstain", "lowprob-hit"]));

  assert.equal(summary.scanned, 9);
  assert.equal(summary.evaluated, 6);
  assert.equal(summary.included, 4);
  assert.equal(summary.resolved, 4);
  assert.equal(summary.allForecasts.count, 4);
  assert.equal(summary.allForecasts.accuracy, 0.25);
  approximately(summary.allForecasts.brierScore!, (0.04 + 0.49 + 0.64 + 0.64) / 4);
  assert.equal(summary.includedForecasts.count, 3);
  assert.equal(summary.includedForecasts.accuracy, 2 / 3);
  approximately(summary.includedForecasts.brierScore!, (0.04 + 0.49 + 0.64) / 3);
  assert.deepEqual(summary.abstention, {
    abstained: 1,
    denominator: 4,
    rate: 0.25,
  });

  assert.equal(summary.byRisk.low.evaluated, 4);
  assert.equal(summary.byRisk.low.resolved, 3);
  assert.equal(summary.byRisk.low.allForecasts.accuracy, 1 / 3);
  assert.equal(summary.byRisk.high.evaluated, 2);
  assert.equal(summary.byRisk.high.resolved, 1);
  assert.equal(summary.byRisk.high.includedForecasts.count, 0);
  assert.equal(summary.byRisk.high.includedForecasts.accuracy, null);
  assert.equal(summary.byCategory.sports.evaluated, 2);
  assert.equal(summary.byCategory.sports.resolved, 2);
  assert.equal(summary.byCategory.sports.allForecasts.count, 2);
  assert.equal(summary.byCategory.weather.evaluated, 4);
  assert.equal(summary.byCategory.weather.resolved, 2);
  assert.equal(summary.byCategory.weather.allForecasts.accuracy, 0);
});
