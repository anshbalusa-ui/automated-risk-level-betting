import type {
  Candidate,
  ForecastEvent,
  ForecastResult,
  PolicyDecision,
  ReferenceProbability,
  RiskBand,
  RiskProfile,
} from "@/lib/domain";

const SUM_TOLERANCE = 0.001;
const MAX_DATA_AGE_MS = 24 * 60 * 60 * 1000;
const POLICY_VERSION = "demo-policy-v1";

const PROFILE_EVIDENCE: Record<RiskProfile, { minQuality: number; maxUncertainty: number }> = {
  low: { minQuality: 0.8, maxUncertainty: 0.2 },
  medium: { minQuality: 0.7, maxUncertainty: 0.35 },
  high: { minQuality: 0.65, maxUncertainty: 0.45 },
};

export function validateForecast(event: ForecastEvent, forecast: ForecastResult): string[] {
  const errors: string[] = [];
  if (forecast.eventId !== event.id) errors.push("Forecast event does not match the event.");
  if (!Array.isArray(forecast.outcomes) || forecast.outcomes.length === 0) {
    errors.push("Forecast must contain at least one outcome.");
  } else {
    const names = forecast.outcomes.map(({ outcome }) => outcome);
    if (new Set(names).size !== names.length) errors.push("Forecast outcomes must be unique.");
    if (names.length !== event.outcomes.length || event.outcomes.some((name) => !names.includes(name))) {
      errors.push("Forecast outcomes must match the event outcomes.");
    }
    if (forecast.outcomes.some(({ probability }) => !Number.isFinite(probability) || probability < 0 || probability > 1)) {
      errors.push("Forecast probabilities must be finite values from 0 to 1.");
    }
    if (forecast.outcomes.every(({ probability }) => Number.isFinite(probability))) {
      const total = forecast.outcomes.reduce((sum, { probability }) => sum + probability, 0);
      if (Math.abs(total - 1) > SUM_TOLERANCE) errors.push("Forecast probabilities must sum to 1 within 0.001.");
    }
  }
  if (!Number.isFinite(forecast.uncertainty) || forecast.uncertainty < 0 || forecast.uncertainty > 1) {
    errors.push("Forecast uncertainty must be from 0 to 1.");
  }
  const startsAt = Date.parse(event.startTime);
  const generatedAt = Date.parse(forecast.generatedAt);
  if (!Number.isFinite(startsAt) || !Number.isFinite(generatedAt) || generatedAt >= startsAt) {
    errors.push("Forecast must be captured before the event starts.");
  }
  return errors;
}

export function classifyProbabilityRisk(probability: number): RiskBand {
  if (!Number.isFinite(probability) || probability < 0 || probability > 1) {
    throw new RangeError("Probability must be a finite value from 0 to 1.");
  }
  if (probability < 0.15) return "very_high";
  if (probability < 0.4) return "high";
  if (probability < 0.6) return "medium";
  return "low";
}

export function generateCandidates(
  event: ForecastEvent,
  forecast: ForecastResult,
  references: ReferenceProbability[],
  calibrationError = 0.1,
): Candidate[] {

  if (validateForecast(event, forecast).length > 0) return [];
  const calibration = Number.isFinite(calibrationError) && calibrationError >= 0 ? calibrationError : 1;
  return forecast.outcomes.map(({ outcome, probability }) => {
    const reference = references.find((item) => item.eventId === event.id && item.outcome === outcome);
    return {
      id: `${event.id}:${encodeURIComponent(outcome)}`,
      eventId: event.id,
      outcome,
      probability,
      uncertainty: forecast.uncertainty,
      riskBand: classifyProbabilityRisk(probability),
      ...(reference ? {
        referenceProbability: reference.probability,
        probabilityGap: probability - reference.probability,
      } : {}),
      dataQuality: event.dataQuality,
      dataCapturedAt: event.dataCapturedAt,
      calibrationError: calibration,
    };
  });
}

export function evaluateCandidate(
  candidate: Candidate,
  profile: RiskProfile,
  interestsMatched: boolean,
  now: string,
): PolicyDecision {
  const reasons: string[] = [];
  const selectedBand = candidate.riskBand === profile;
  if (!selectedBand) reasons.push(`Risk band ${candidate.riskBand} does not match selected ${profile} band.`);
  if (!interestsMatched) reasons.push("Event does not match selected interests.");
  if (!Number.isFinite(candidate.dataQuality) || candidate.dataQuality < PROFILE_EVIDENCE[profile].minQuality || candidate.dataQuality > 1) {
    reasons.push(`Data quality is below the ${profile} profile threshold.`);
  }
  const nowMs = Date.parse(now);
  const captureMs = Date.parse(candidate.dataCapturedAt);
  if (!Number.isFinite(nowMs) || !Number.isFinite(captureMs) || captureMs > nowMs || nowMs - captureMs > MAX_DATA_AGE_MS) {
    reasons.push("Event data is stale or has an invalid capture time.");
  }
  if (!Number.isFinite(candidate.uncertainty) || candidate.uncertainty < 0 || candidate.uncertainty > 1 || candidate.uncertainty > PROFILE_EVIDENCE[profile].maxUncertainty) {
    reasons.push(`Forecast uncertainty exceeds the ${profile} profile threshold.`);
  }
  const hasReference = Number.isFinite(candidate.referenceProbability) && candidate.referenceProbability! >= 0 && candidate.referenceProbability! <= 1;
  if (candidate.referenceProbability !== undefined && (!Number.isFinite(candidate.referenceProbability) || candidate.referenceProbability < 0 || candidate.referenceProbability > 1)) {
    reasons.push("Reference probability is invalid.");
  }
  if (hasReference) {
    if (!Number.isFinite(candidate.probabilityGap) || candidate.probabilityGap! <= 0 || candidate.probabilityGap! > 0.2) reasons.push("Forecast-to-reference gap must be positive and no greater than 20 percentage points.");
  } else if (candidate.dataQuality < 0.8 || candidate.uncertainty > 0.2 || candidate.calibrationError > 0.1) {
    reasons.push("Missing reference requires stronger data quality, certainty, and calibration evidence.");
  }
  if (!Number.isFinite(candidate.calibrationError) || candidate.calibrationError < 0 || candidate.calibrationError > 0.25) {
    reasons.push("Calibration error exceeds the policy limit.");
  }
  const normalizedEvidence = (value: number) =>
    Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  const evidenceScore = Math.max(0, Math.min(1,
    normalizedEvidence(candidate.dataQuality) * 0.4 +
    normalizedEvidence(1 - candidate.uncertainty) * 0.3 +
    (hasReference ? 0.2 * normalizedEvidence(1 - (candidate.probabilityGap ?? 1)) : 0) +
    0.1 * normalizedEvidence(1 - candidate.calibrationError),
  ));
  return {
    candidateId: candidate.id,
    profile,
    decision: reasons.length === 0 ? "include" : "abstain",
    riskScore: Number((1 - evidenceScore).toFixed(4)),
    reason: reasons.length ? reasons.join(" ") : "Evidence and selected risk band satisfy demo policy.",
    policyVersion: POLICY_VERSION,
  };
}
