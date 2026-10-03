import assert from "node:assert/strict";
import test from "node:test";
import { defaultPreferences, runAgent, settleDueDemoEvents } from "../src/lib/agent";
import { summarize } from "../src/lib/analytics";

const now = new Date("2026-10-01T12:00:00.000Z");

test("personalized medium demo includes both domains and abstains despite band match", () => {
  const run = runAgent(defaultPreferences, now);
  const upcoming = run.evaluated.filter(({ event }) => event.metadata.historical !== true);
  const included = upcoming.filter(({ decision }) => decision.decision === "include");
  assert.ok(included.some(({ event }) => event.category === "sports"));
  assert.ok(included.some(({ event }) => event.category === "weather"));
  assert.ok(upcoming.some(({ candidate, decision }) => candidate.riskBand === "medium" &&
    decision.decision === "abstain" && /uncertainty/i.test(decision.reason)));
  assert.equal(run.activity.included, included.length);
  assert.equal(run.activity.bandMatched, run.activity.included + run.activity.abstained);
  assert.ok(run.positions.some((position) => position.status === "active"));
  assert.ok(run.availableCredits >= 0);
  assert.ok(run.positions.every((position) => position.virtualAllocation > 0));
  assert.equal(new Set(run.positions.map((position) => position.eventId)).size, run.positions.length);
});

test("review keeps policy decisions without creating virtual positions", () => {
  const run = runAgent({ ...defaultPreferences, mode: "review" }, now);
  assert.ok(run.evaluated.some(({ decision }) => decision.decision === "include"));
  assert.equal(run.positions.length, 0);
  assert.equal(run.availableCredits, defaultPreferences.initialBankroll);
});

test("interest/category filtering and selected high band retain only relevant outcomes", () => {
  const weather = runAgent({ ...defaultPreferences, categories: ["weather"], interests: ["Seattle"], riskProfile: "high" }, now);
  assert.ok(weather.evaluated.length > 0);
  assert.ok(weather.evaluated.every(({ event }) => event.category === "weather" && event.interests.includes("Seattle")));
  assert.ok(weather.evaluated.some(({ candidate, decision }) =>
    candidate.riskBand === "high" && candidate.probabilityGap !== undefined &&
    candidate.probabilityGap > 0 && decision.decision === "include"));
});

test("resolved demo forecasts precede events and contribute measured analytics", () => {
  const run = runAgent(defaultPreferences, now);
  const resolved = run.evaluated.filter(({ event }) => event.metadata.historical === true);
  assert.ok(resolved.length > 0);
  assert.ok(resolved.every(({ event, forecast }) => Date.parse(forecast.generatedAt) < Date.parse(event.startTime)));
  const summary = summarize(run);
  assert.ok(summary.allForecasts.count > 0);
  assert.ok(summary.includedForecasts.count > 0);
  assert.ok(summary.allForecasts.brierScore !== null);
  assert.ok(summary.includedForecasts.brierScore !== null);
});

test("due synthetic outcome settles the stored position without rewriting its forecast", () => {
  const run = runAgent(defaultPreferences, now);
  const before = run.positions.find((position) => position.eventId === "demo-nba-warriors-close");
  assert.ok(before);
  assert.equal(settleDueDemoEvents(run, new Date("2026-10-02T14:00:00.000Z")), run);
  const settled = settleDueDemoEvents(run, new Date("2026-10-02T16:00:00.000Z"));
  const after = settled.positions.find((position) => position.id === before.id);
  assert.ok(after);
  assert.equal(after.status, "resolved");
  assert.equal(after.result, "correct");
  assert.equal(after.probability, before.probability);
  assert.equal(after.policyVersion, before.policyVersion);
  assert.equal(run.positions.find((position) => position.id === before.id)?.status, "active");
  assert.equal(settleDueDemoEvents(settled, new Date("2026-10-02T17:00:00.000Z")), settled);
  assert.ok(settled.availableCredits > run.availableCredits);
});
