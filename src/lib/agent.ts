import type { AgentRun, Candidate, EvaluatedCandidate, ForecastEvent, Preferences, Position, ReferenceProbability } from "@/lib/domain";
import { getDemoSnapshot, getDueDemoResolutions } from "@/lib/fixtures";
import { evaluateCandidate, generateCandidates, validateForecast } from "@/lib/policy";
import { createPosition, resolvePositions } from "@/lib/simulation";

export const defaultPreferences: Preferences = {
  categories: ["sports", "weather"],
  interests: ["NBA", "Warriors", "San Francisco"],
  riskProfile: "medium",
  mode: "auto-simulate",
  initialBankroll: 500,
  allocationPercent: 5,
};

function matchesInterest(event: ForecastEvent, preferences: Preferences): boolean {
  if (!preferences.categories.includes(event.category)) return false;
  if (preferences.interests.length === 0) return true;
  return preferences.interests.some((interest) => event.interests.some((tag) =>
    tag.toLocaleLowerCase().includes(interest.trim().toLocaleLowerCase()) ||
    interest.trim().toLocaleLowerCase().includes(tag.toLocaleLowerCase()),
  ));
}

function validReferences(references: ReferenceProbability[], event: ForecastEvent, generatedAt: string) {
  return references.filter((reference) =>
    reference.eventId === event.id && event.outcomes.includes(reference.outcome) &&
    Number.isFinite(reference.probability) && reference.probability >= 0 && reference.probability <= 1 &&
    Number.isFinite(Date.parse(reference.capturedAt)) &&
    Date.parse(reference.capturedAt) <= Date.parse(generatedAt) &&
    Date.parse(reference.capturedAt) < Date.parse(event.startTime),
  );
}

function balanceAfter(positions: Position[], initial: number): number {
  return initial - positions.reduce((sum, position) => sum + position.virtualAllocation, 0) +
    positions.reduce((sum, position) => sum + (position.creditReturn ?? 0), 0);
}

/** Rebuilds a fresh, deterministic demo snapshot. UI persists it instead of recalculating history on refresh. */
export function runAgent(preferences: Preferences, now = new Date()): AgentRun {
  if (!Number.isFinite(preferences.initialBankroll) || preferences.initialBankroll <= 0) {
    throw new RangeError("Demo bankroll must be a positive finite amount.");
  }
  if (!Number.isFinite(preferences.allocationPercent) || preferences.allocationPercent <= 0 || preferences.allocationPercent > 100) {
    throw new RangeError("Allocation percent must be greater than 0 and at most 100.");
  }
  const snapshot = getDemoSnapshot(now);
  const forecasts = new Map(snapshot.forecasts.map((forecast) => [forecast.eventId, forecast]));
  const historical = snapshot.events.filter((event) => event.metadata.historical === true)
    .sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
  const upcoming = snapshot.events.filter((event) => event.metadata.historical !== true);
  const evaluated: EvaluatedCandidate[] = [];
  let positions: Position[] = [];
  const activity = { scanned: upcoming.length, relevant: 0, bandMatched: 0, included: 0, abstained: 0 };

  for (const event of [...historical, ...upcoming]) {
    const relevant = matchesInterest(event, preferences);
    const isUpcoming = event.metadata.historical !== true;
    if (isUpcoming && relevant) activity.relevant++;
    if (!relevant) continue;
    const forecast = forecasts.get(event.id);
    if (!forecast || validateForecast(event, forecast).length > 0) continue;
    const referenceRows = validReferences(snapshot.references, event, forecast.generatedAt);
    const candidates: Candidate[] = generateCandidates(event, forecast, referenceRows);
    for (const candidate of candidates) {
      const reference = referenceRows.find((item) => item.outcome === candidate.outcome);
      const decision = evaluateCandidate(candidate, preferences.riskProfile, relevant,
        isUpcoming ? now.toISOString() : forecast.generatedAt);
      const entry: EvaluatedCandidate = { event, forecast, candidate, decision, ...(reference ? { reference } : {}) };
      evaluated.push(entry);
      if (isUpcoming && candidate.riskBand === preferences.riskProfile) {
        activity.bandMatched++;
        if (decision.decision === "include") activity.included++;
        else activity.abstained++;
      }
      if (preferences.mode === "auto-simulate" && decision.decision === "include") {
        const allocatedAt = isUpcoming ? now.toISOString() : forecast.generatedAt;
        const position = createPosition(entry, balanceAfter(positions, preferences.initialBankroll), positions, allocatedAt, preferences.allocationPercent);
        if (position) positions.push(position);
      }
    }
    if (!isUpcoming && preferences.mode === "auto-simulate") {
      positions = resolvePositions(positions, snapshot.resolutions.filter((item) => item.eventId === event.id));
    }
  }

  const availableCredits = balanceAfter(positions, preferences.initialBankroll);
  return {
    id: `demo-run:${now.toISOString()}`,
    generatedAt: now.toISOString(),
    preferences: structuredClone(preferences),
    evaluated,
    positions,
    resolutions: snapshot.resolutions,
    activity,
    initialBankroll: preferences.initialBankroll,
    availableCredits,
    sourceLabel: "DEMO DATA",
  };
}

/** Adds only due synthetic outcomes to an existing snapshot; forecasts never change. */
export function settleDueDemoEvents(run: AgentRun, asOf = new Date()): AgentRun {
  const seen = new Set<string>();
  const events: ForecastEvent[] = [];
  for (const entry of run.evaluated) {
    if (!seen.has(entry.event.id)) {
      seen.add(entry.event.id);
      events.push(entry.event);
    }
  }
  const known = new Set(run.resolutions.map((resolution) => resolution.eventId));
  const newResolutions = getDueDemoResolutions(events, asOf)
    .filter((resolution) => !known.has(resolution.eventId));
  if (newResolutions.length === 0) return run;
  const positions = resolvePositions(run.positions, newResolutions);
  return {
    ...run,
    positions,
    resolutions: [...run.resolutions, ...newResolutions],
    availableCredits: balanceAfter(positions, run.initialBankroll),
  };
}
