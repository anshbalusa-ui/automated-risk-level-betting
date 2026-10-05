import type { EvaluatedCandidate, Position, Resolution } from "@/lib/domain";

/** Converts a user-selected demo bankroll percentage into an allocation fraction. */
export function allocationFraction(allocationPercent: number): number {
  if (!Number.isFinite(allocationPercent) || allocationPercent <= 0 || allocationPercent > 100) {
    throw new RangeError("Allocation percent must be greater than 0 and at most 100.");
  }
  return allocationPercent / 100;
}

/** Creates an immutable-in-practice snapshot; all values are copied from the evaluated event. */
export function createPosition(
  entry: EvaluatedCandidate,
  balance: number,
  existing: Position[],
  now: string,
  allocationPercent: number,
): Position | null {
  if (entry.decision.decision !== "include" || !Number.isFinite(balance) || balance <= 0) return null;
  const nowMs = Date.parse(now);
  const startMs = Date.parse(entry.event.startTime);
  if (!Number.isFinite(nowMs) || !Number.isFinite(startMs) || nowMs >= startMs) return null;
  if (entry.candidate.eventId !== entry.event.id || !entry.event.outcomes.includes(entry.candidate.outcome)) return null;
  if (existing.some((position) => position.status === "active" && position.eventId === entry.event.id)) return null;
  const fraction = allocationFraction(allocationPercent);
  const allocation = balance * fraction;
  if (!Number.isFinite(allocation) || allocation <= 0 || allocation > balance) return null;
  const id = `${entry.candidate.id}:${encodeURIComponent(now)}`;
  return {
    id,
    candidateId: entry.candidate.id,
    eventId: entry.event.id,
    outcome: entry.candidate.outcome,
    riskProfile: entry.decision.profile,
    probability: entry.candidate.probability,
    uncertainty: entry.candidate.uncertainty,
    ...(entry.reference ? { referenceProbability: entry.reference.probability } :
      entry.candidate.referenceProbability !== undefined ? { referenceProbability: entry.candidate.referenceProbability } : {}),
    ...(entry.candidate.probabilityGap !== undefined ? { probabilityGap: entry.candidate.probabilityGap } : {}),
    virtualAllocation: allocation,
    createdAt: now,
    modelVersion: entry.forecast.modelVersion,
    policyVersion: entry.decision.policyVersion,
    status: "active",
  };
}

/**
 * Settles positions using virtual credits only. If a nonzero reference probability was
 * snapshotted, a correct result returns allocation/referenceProbability (including the
 * allocation); otherwise the forecast probability is the virtual accounting fallback.
 * This is not a claim about real market odds or real-world payoff.
 */
export function resolvePositions(
  positions: Position[],
  resolutions: Resolution[],
): Position[] {
  const resolutionByEvent = new Map(resolutions.map((resolution) => [resolution.eventId, resolution]));
  return positions.map((position) => {
    const resolution = resolutionByEvent.get(position.eventId);
    if (position.status !== "active" || !resolution) return { ...position };
    const correct = resolution.actualOutcome === position.outcome;
    const probability = position.referenceProbability !== undefined && position.referenceProbability > 0
      ? position.referenceProbability : position.probability;
    const creditReturn = correct && probability > 0 ? position.virtualAllocation / probability : 0;
    return {
      ...position,
      status: "resolved",
      result: correct ? "correct" : "incorrect",
      resolvedAt: resolution.resolvedAt,
      creditReturn,
    };
  });
}
