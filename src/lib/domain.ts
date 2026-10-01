export type Category = "sports" | "weather";
export type RiskProfile = "low" | "medium" | "high";
export type RiskBand = RiskProfile | "very_high";
export type Mode = "review" | "auto-simulate";
export type Decision = "include" | "abstain";

export interface Preferences {
  categories: Category[];
  interests: string[];
  riskProfile: RiskProfile;
  mode: Mode;
  initialBankroll: number;
}
export interface ForecastEvent {
  id: string;
  category: Category;
  title: string;
  description: string;
  startTime: string;
  resolutionTime: string;
  outcomes: string[];
  interests: string[];
  metadata: Record<string, unknown>;
  dataQuality: number;
  dataCapturedAt: string;
  source: string;
}
export interface ForecastFactor {
  name: string;
  direction: "positive" | "negative" | "neutral";
  description: string;
}
export interface ForecastResult {
  eventId: string;
  outcomes: { outcome: string; probability: number }[];
  uncertainty: number;
  factors: ForecastFactor[];
  modelVersion: string;
  generatedAt: string;
}
export interface ReferenceProbability {
  eventId: string;
  outcome: string;
  probability: number;
  provider: string;
  capturedAt: string;
}
export interface Candidate {
  id: string;
  eventId: string;
  outcome: string;
  probability: number;
  uncertainty: number;
  riskBand: RiskBand;
  referenceProbability?: number;
  probabilityGap?: number;
  dataQuality: number;
  dataCapturedAt: string;
  calibrationError: number;
}
export interface PolicyDecision {
  candidateId: string;
  profile: RiskProfile;
  decision: Decision;
  riskScore: number;
  reason: string;
  policyVersion: string;
}
export interface EvaluatedCandidate {
  event: ForecastEvent;
  forecast: ForecastResult;
  candidate: Candidate;
  decision: PolicyDecision;
  reference?: ReferenceProbability;
}
export interface Position {
  id: string;
  candidateId: string;
  eventId: string;
  outcome: string;
  riskProfile: RiskProfile;
  probability: number;
  uncertainty: number;
  referenceProbability?: number;
  probabilityGap?: number;
  virtualAllocation: number;
  createdAt: string;
  modelVersion: string;
  policyVersion: string;
  status: "active" | "resolved";
  result?: "correct" | "incorrect";
  resolvedAt?: string;
  creditReturn?: number;
}
export interface Resolution {
  eventId: string;
  actualOutcome: string;
  resolvedAt: string;
}
export interface AgentRun {
  id: string;
  generatedAt: string;
  preferences: Preferences;
  evaluated: EvaluatedCandidate[];
  positions: Position[];
  resolutions: Resolution[];
  activity: { scanned: number; relevant: number; bandMatched: number; included: number; abstained: number };
  initialBankroll: number;
  availableCredits: number;
  sourceLabel: "DEMO DATA";
}
