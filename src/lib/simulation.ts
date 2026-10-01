import type { EvaluatedCandidate, Position, Resolution, RiskProfile } from "@/lib/domain";

/** Maps evidence strength to bounded demo-only allocation fractions. */
export function allocationFraction(profile: RiskProfile, evidenceScore: number): number {
  if (!Number.isFinite(evidenceScore)) throw new RangeError("Evidence score must be finite.");
  const score = Math.max(0, Math.min(1, evidenceScore));
  switch (profile) {
    case "low": return 0.01 + score * 0.02;
    case "medium": return 0.03 + score * 0.02;
    case "high": return 0.05 + score * 0.05;
  }
}

/** Creates an immutable-in-practice snapshot; all values are copied from the evaluated event. */
export function createPosition(
  entry: EvaluatedCandidate,
  balance: number,
  existing: Position[],
  now: string,
): Position | null {
  if (entry.decision.decision !== "include" || !Number.isFinite(balance) || balance <= 0) return null;
  const nowMs = Date.parse(now);
  const startMs = Date.parse(entry.event.startTime);
  if (!Number.isFinite(nowMs) || !Number.isFinite(startMs) || nowMs >= startMs) return null;
  if (entry.candidate.eventId !== entry.event.id || !entry.event.outcomes.includes(entry.candidate.outcome)) return null;
  if (existing.some((position) => position.status === "active" && position.eventId === entry.event.id)) return null;
  const evidenceScore = Math.max(0, Math.min(1, 1 - entry.decision.riskScore));
  const fraction = allocationFraction(entry.decision.profile, evidenceScore);
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
 * stake); otherwise the forecast probability is the demo accounting fallback.
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
