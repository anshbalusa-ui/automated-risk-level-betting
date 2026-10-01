import type {
  AgentRun,
  Category,
  EvaluatedCandidate,
  RiskBand,
} from "@/lib/domain";

export interface CalibrationBucket {
  label: "0–15" | "15–40" | "40–60" | "60–80" | "80–100";
  count: number;
  predictedMean: number | null;
  observedFrequency: number | null;
}
export interface ForecastMetrics {
  /** Number of resolved candidates in this forecast subset. */
  count: number;
  /** Threshold prediction accuracy for all forecasts; realized outcome hit rate for included forecasts. */
  accuracy: number | null;
  /** Mean squared probability error against the binary observed outcome. */
  brierScore: number | null;
  calibration: CalibrationBucket[];
}

export interface PerformanceBreakdown {
  evaluated: number;
  included: number;
  resolved: number;
  allForecasts: ForecastMetrics;
  includedForecasts: ForecastMetrics;
}

export interface PerformanceSummary extends PerformanceBreakdown {
  scanned: number;
  abstention: {
    abstained: number;
    /** Selected-band candidates, not every scanned/evaluated candidate. */
    denominator: number;
    rate: number | null;
  };
  byRisk: Record<RiskBand, PerformanceBreakdown>;
  byCategory: Record<Category, PerformanceBreakdown>;
}

const BUCKETS: readonly CalibrationBucket["label"][] = [
  "0–15",
  "15–40",
  "40–60",
  "60–80",
  "80–100",
];

export function brierScore(probability: number, occurred: boolean): number {
  const error = probability - Number(occurred);
  return error * error;
}

export function calibration(
  rows: { probability: number; occurred: boolean }[],
): CalibrationBucket[] {
  const counts = [0, 0, 0, 0, 0];
  const occurrences = [0, 0, 0, 0, 0];
  const probabilityTotals = [0, 0, 0, 0, 0];

  for (const row of rows) {
    // Right-hand edges are exclusive, except 100%, which belongs to the final bucket.
    const index =
      row.probability < 0.15
        ? 0
        : row.probability < 0.4
          ? 1
          : row.probability < 0.6
            ? 2
            : row.probability < 0.8
              ? 3
              : 4;
    counts[index] += 1;
    probabilityTotals[index] += row.probability;
    if (row.occurred) occurrences[index] += 1;
  }

  return BUCKETS.map((label, index) => ({
    label,
    count: counts[index],
    predictedMean:
      counts[index] === 0 ? null : probabilityTotals[index] / counts[index],
    observedFrequency:
      counts[index] === 0 ? null : occurrences[index] / counts[index],
  }));
}

interface OutcomeRow {
  probability: number;
  occurred: boolean;
}

function metrics(rows: OutcomeRow[], useOutcomeHitRate: boolean): ForecastMetrics {
  const count = rows.length;
  if (count === 0) {
    return {
      count: 0,
      accuracy: null,
      brierScore: null,
      calibration: calibration([]),
    };
  }

  let hits = 0;
  let totalBrier = 0;
  for (const row of rows) {
    if (
      useOutcomeHitRate
        ? row.occurred
        : (row.probability >= 0.5) === row.occurred
    ) {
      hits += 1;
    }
    totalBrier += brierScore(row.probability, row.occurred);
  }

  return {
    count,
    accuracy: hits / count,
    brierScore: totalBrier / count,
    calibration: calibration(rows),
  };
}

function buildBreakdown(
  evaluated: EvaluatedCandidate[],
  resolvedRows: Map<string, OutcomeRow>,
): PerformanceBreakdown {
  const allRows: OutcomeRow[] = [];
  const includedRows: OutcomeRow[] = [];
  let included = 0;

  for (const item of evaluated) {
    if (item.decision.decision === "include") included += 1;
    const outcome = resolvedRows.get(item.candidate.id);
    if (!outcome) continue;
    allRows.push(outcome);
    if (item.decision.decision === "include") includedRows.push(outcome);
  }

  return {
    evaluated: evaluated.length,
    included,
    resolved: allRows.length,
    allForecasts: metrics(allRows, false),
    includedForecasts: metrics(includedRows, true),
  };
}

export function summarize(run: AgentRun): PerformanceSummary {
  const outcomesByEvent = new Map(
    run.resolutions.map((resolution) => [resolution.eventId, resolution.actualOutcome]),
  );
  let selectedBandCount = 0;
  let selectedBandAbstained = 0;
  const byRiskCandidates: Record<RiskBand, EvaluatedCandidate[]> = {
    low: [],
    medium: [],
    high: [],
    very_high: [],
  };
  const byCategoryCandidates: Record<Category, EvaluatedCandidate[]> = {
    sports: [],
    weather: [],
  };

  const resolvedRows = new Map<string, OutcomeRow>();
  for (const item of run.evaluated) {
    if (item.candidate.riskBand === run.preferences.riskProfile) {
      selectedBandCount += 1;
      if (item.decision.decision === "abstain") selectedBandAbstained += 1;
    }
    byRiskCandidates[item.candidate.riskBand].push(item);
    byCategoryCandidates[item.event.category].push(item);
    const actualOutcome = outcomesByEvent.get(item.event.id);
    if (actualOutcome !== undefined) {
      resolvedRows.set(item.candidate.id, {
        probability: item.candidate.probability,
        occurred: item.candidate.outcome === actualOutcome,
      });
    }
  }

  const breakdown = buildBreakdown(run.evaluated, resolvedRows);
  const denominator = selectedBandCount;
  const abstained = selectedBandAbstained;
  return {
    ...breakdown,
    scanned: run.activity.scanned,
    abstention: {
      abstained,
      denominator,
      rate: denominator === 0 ? null : abstained / denominator,
    },
    byRisk: {
      low: buildBreakdown(byRiskCandidates.low, resolvedRows),
      medium: buildBreakdown(byRiskCandidates.medium, resolvedRows),
      high: buildBreakdown(byRiskCandidates.high, resolvedRows),
      very_high: buildBreakdown(byRiskCandidates.very_high, resolvedRows),
    },
    byCategory: {
      sports: buildBreakdown(byCategoryCandidates.sports, resolvedRows),
      weather: buildBreakdown(byCategoryCandidates.weather, resolvedRows),
    },
  };
}
