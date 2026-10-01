import assert from "node:assert/strict";
import test from "node:test";
import { getDemoSnapshot } from "@/lib/fixtures";
import { evaluateCandidate, generateCandidates } from "@/lib/policy";

const instant = (value: string) => Date.parse(value);

test("demo snapshot supplies upcoming binary scenarios across sports and weather", () => {
  const now = new Date("2041-06-12T09:30:00.000Z");
  const { events, forecasts, references, resolutions } = getDemoSnapshot(now);
  const upcoming = events.filter((event) => !event.metadata.historical);
  const categories = new Set(upcoming.map((event) => event.category));

  assert.deepEqual(categories, new Set(["sports", "weather"]));
  for (const category of categories) {
    assert.ok(upcoming.filter((event) => event.category === category).length >= 4);
  }
  for (const event of upcoming) {
    assert.equal(event.outcomes.length, 2);
    assert.ok(instant(event.dataCapturedAt) <= instant(event.startTime));
    assert.ok(instant(event.startTime) > now.getTime());
    assert.ok(instant(event.resolutionTime) > instant(event.startTime));
    assert.match(event.title, /DEMO DATA/);
    const forecast = forecasts.find((entry) => entry.eventId === event.id);
    assert.ok(forecast);
    assert.equal(forecast.outcomes.length, 2);
    assert.ok(Math.abs(forecast.outcomes.reduce((sum, outcome) => sum + outcome.probability, 0) - 1) < 1e-12);
    const eventReferences = references.filter((reference) => reference.eventId === event.id);
    assert.deepEqual(
      new Set(eventReferences.map((reference) => reference.outcome)),
      new Set(event.outcomes),
    );
    assert.ok(eventReferences.every((reference) =>
      reference.probability >= 0 && reference.probability <= 1 &&
      instant(reference.capturedAt) <= instant(event.startTime),
    ));
  }
  assert.equal(resolutions.length, events.filter((event) => event.metadata.historical).length);

  const defaultInterestEvents = upcoming.filter((event) =>
    event.interests.some((interest) => ["NBA", "Warriors", "San Francisco"].includes(interest)),
  );
  assert.deepEqual(new Set(defaultInterestEvents.map((event) => event.category)), new Set(["sports", "weather"]));
  assert.ok(defaultInterestEvents.some((event) => {
    const forecast = forecasts.find((entry) => entry.eventId === event.id);
    return forecast !== undefined && forecast.uncertainty >= 0.1 && forecast.uncertainty <= 0.2;
  }));
  assert.ok(defaultInterestEvents.some((event) => {
    const forecast = forecasts.find((entry) => entry.eventId === event.id);
    return forecast !== undefined &&
      forecast.uncertainty >= 0.3 &&
      forecast.outcomes.some(({ probability }) => probability >= 0.4 && probability <= 0.6);
  }));
  const defaultDecisions = defaultInterestEvents.flatMap((event) => {
    const forecast = forecasts.find((entry) => entry.eventId === event.id);
    if (!forecast) return [];
    return generateCandidates(event, forecast, references).map((candidate) => ({
      event,
      decision: evaluateCandidate(candidate, "medium", true, now.toISOString()),
    }));
  });
  assert.deepEqual(
    new Set(defaultDecisions.filter(({ decision }) => decision.decision === "include").map(({ event }) => event.category)),
    new Set(["sports", "weather"]),
  );
  assert.ok(defaultDecisions.some(({ decision }) =>
    decision.decision === "abstain" && decision.reason.includes("uncertainty"),
  ));
  assert.ok(upcoming.some((event) => {
    const forecast = forecasts.find((entry) => entry.eventId === event.id);
    return forecast !== undefined && forecast.uncertainty >= 0.3;
  }));
});

test("historical fixtures are resolved with immutable pre-event evidence", () => {
  const first = getDemoSnapshot(new Date("2041-06-12T09:30:00.000Z"));
  const later = getDemoSnapshot(new Date("2051-06-12T09:30:00.000Z"));
  const historical = first.events.filter((event) => event.metadata.historical);
  const laterHistorical = later.events.filter((event) => event.metadata.historical);

  assert.ok(historical.length >= 8);
  assert.deepEqual(historical, laterHistorical);
  for (const event of historical) {
    const resolution = first.resolutions.find((entry) => entry.eventId === event.id);
    const forecast = first.forecasts.find((entry) => entry.eventId === event.id);
    const eventReferences = first.references.filter((entry) => entry.eventId === event.id);
    assert.ok(resolution);
    assert.ok(forecast);
    assert.ok(eventReferences.length >= 2);
    assert.ok(event.outcomes.includes(resolution.actualOutcome));
    assert.ok(instant(event.dataCapturedAt) < instant(event.startTime));
    assert.ok(instant(forecast.generatedAt) < instant(event.startTime));
    assert.ok(instant(event.startTime) < instant(resolution.resolvedAt));
    assert.ok(eventReferences.every((reference) => instant(reference.capturedAt) < instant(event.startTime)));
    assert.ok(event.dataQuality > 0 && event.dataQuality <= 1);
  }
  assert.ok(new Set(historical.map((event) => event.category)).size > 1);
  assert.ok(new Set(first.forecasts.filter((forecast) => historical.some((event) => event.id === forecast.eventId)).map((forecast) => forecast.uncertainty)).size >= 3);
});

test("synthetic benchmarks provide positive reference gaps to high-band outcomes by category", () => {
  const { events, forecasts, references } = getDemoSnapshot(new Date("2041-06-12T09:30:00.000Z"));
  for (const category of ["sports", "weather"] as const) {
    const hasPositiveHighBandGap = events
      .filter((event) => event.category === category)
      .some((event) => {
        const forecast = forecasts.find((entry) => entry.eventId === event.id);
        if (!forecast) return false;
        return generateCandidates(event, forecast, references).some((candidate) =>
          candidate.riskBand === "high" &&
          candidate.referenceProbability !== undefined &&
          candidate.probabilityGap !== undefined &&
          candidate.probabilityGap > 0,
        );
      });
    assert.ok(hasPositiveHighBandGap, `Expected a positive-gap high-band ${category} fixture.`);
  }
});
