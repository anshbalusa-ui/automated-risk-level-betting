import type { AgentRun, Preferences } from "@/lib/domain";

export interface DemoSnapshot {
  preferences: Preferences;
  run: AgentRun | null;
  handledCandidateIds?: string[];
}

const STORAGE_KEY = "forecast-studio-demo-v3";
const LEGACY_STORAGE_KEYS = ["forecast-studio-demo-v2"];

function isPreferences(value: unknown): value is Preferences {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Preferences>;
  return Array.isArray(item.categories) && item.categories.every((category) => category === "sports" || category === "weather") && Array.isArray(item.interests) && item.interests.every((interest) => typeof interest === "string") && ["low", "medium", "high"].includes(item.riskProfile as string) && ["review", "auto-simulate"].includes(item.mode as string) && typeof item.initialBankroll === "number" && Number.isFinite(item.initialBankroll) && item.initialBankroll > 0 && typeof item.allocationPercent === "number" && Number.isFinite(item.allocationPercent) && item.allocationPercent > 0 && item.allocationPercent <= 100;
}
function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}
function isEvaluatedCandidate(value: unknown): boolean {
  if (!isObject(value) || !isObject(value.event) || !isObject(value.candidate) || !isObject(value.decision) || !isObject(value.forecast)) return false;
  const { event, candidate, decision, forecast } = value;
  const factorsValid = Array.isArray(forecast.factors) && forecast.factors.every((factor) => isObject(factor) && typeof factor.name === "string" && typeof factor.description === "string" && ["positive", "negative", "neutral"].includes(factor.direction as string));
  const outcomesValid = Array.isArray(forecast.outcomes) && forecast.outcomes.every((outcome) => isObject(outcome) && typeof outcome.outcome === "string" && typeof outcome.probability === "number");
  return typeof event.id === "string" && (event.category === "sports" || event.category === "weather") && typeof event.title === "string" && typeof event.description === "string" && Array.isArray(event.interests) && event.interests.every((interest) => typeof interest === "string") && typeof event.startTime === "string" && typeof event.dataCapturedAt === "string" && typeof event.source === "string" && typeof candidate.id === "string" && typeof candidate.eventId === "string" && typeof candidate.outcome === "string" && typeof candidate.probability === "number" && typeof candidate.uncertainty === "number" && typeof candidate.dataQuality === "number" && ["low", "medium", "high", "very_high"].includes(candidate.riskBand as string) && (decision.decision === "include" || decision.decision === "abstain") && ["low", "medium", "high"].includes(decision.profile as string) && typeof decision.reason === "string" && typeof decision.riskScore === "number" && typeof forecast.eventId === "string" && typeof forecast.modelVersion === "string" && typeof forecast.uncertainty === "number" && factorsValid && outcomesValid;
}

function isPosition(value: unknown): boolean {
  if (!isObject(value)) return false;
  if (typeof value.id !== "string" || typeof value.candidateId !== "string" ||
    typeof value.eventId !== "string" || typeof value.outcome !== "string" ||
    !["low", "medium", "high"].includes(value.riskProfile as string) ||
    !["active", "resolved"].includes(value.status as string) ||
    !Number.isFinite(value.virtualAllocation) || (value.virtualAllocation as number) <= 0 ||
    !Number.isFinite(value.probability) || (value.probability as number) < 0 ||
    (value.probability as number) > 1) return false;
  if (value.status === "resolved") {
    return ["correct", "incorrect"].includes(value.result as string) &&
      typeof value.resolvedAt === "string" && Number.isFinite(value.creditReturn) &&
      (value.creditReturn as number) >= 0;
  }
  return value.result === undefined && value.creditReturn === undefined;
}

function isResolution(value: unknown): boolean {
  return isObject(value) && typeof value.eventId === "string" && typeof value.actualOutcome === "string" && typeof value.resolvedAt === "string";
}

function isAgentRun(value: unknown): value is AgentRun {
  if (!isObject(value)) return false;
  const run = value as Partial<AgentRun>;
  return typeof run.id === "string" && typeof run.generatedAt === "string" &&
    isPreferences(run.preferences) &&
    Array.isArray(run.evaluated) && run.evaluated.every(isEvaluatedCandidate) &&
    run.evaluated.every((entry) => Number.isFinite(entry.candidate.probability) &&
      entry.candidate.probability >= 0 && entry.candidate.probability <= 1 &&
      Number.isFinite(entry.candidate.uncertainty) && entry.candidate.uncertainty >= 0 &&
      entry.candidate.uncertainty <= 1) &&
    Array.isArray(run.positions) && run.positions.every(isPosition) &&
    Array.isArray(run.resolutions) && run.resolutions.every(isResolution) &&
    isObject(run.activity) &&
    ["scanned", "relevant", "bandMatched", "included", "abstained"].every((key) =>
      Number.isSafeInteger(run.activity?.[key as keyof typeof run.activity]) &&
      (run.activity?.[key as keyof typeof run.activity] ?? -1) >= 0) &&
    Number.isFinite(run.availableCredits) && (run.availableCredits ?? -1) >= 0 &&
    Number.isFinite(run.initialBankroll) && (run.initialBankroll ?? 0) > 0 &&
    run.sourceLabel === "DEMO DATA";
}

export function loadDemoSnapshot(): DemoSnapshot | null {
  try {
    for (const key of LEGACY_STORAGE_KEYS) window.localStorage.removeItem(key);
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved: unknown = JSON.parse(raw);
    if (!saved || typeof saved !== "object") return null;
    const snapshot = saved as { preferences?: unknown; run?: unknown; handledCandidateIds?: unknown };
    if (!isPreferences(snapshot.preferences)) return null;
    if (snapshot.run != null && !isAgentRun(snapshot.run)) return null;
    if (snapshot.handledCandidateIds !== undefined && (!Array.isArray(snapshot.handledCandidateIds) || !snapshot.handledCandidateIds.every((id) => typeof id === "string"))) return null;
    return {
      preferences: snapshot.preferences,
      run: snapshot.run == null ? null : snapshot.run,
      handledCandidateIds: Array.isArray(snapshot.handledCandidateIds) ? snapshot.handledCandidateIds : [],
    };
  } catch {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* storage can be unavailable */ }
    return null;
  }
}

export function saveDemoSnapshot(snapshot: DemoSnapshot): void {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot)); } catch { /* simulation remains usable without browser storage */ }
}
