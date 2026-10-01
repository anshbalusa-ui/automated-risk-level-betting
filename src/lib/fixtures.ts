import type {
  ForecastEvent,
  ForecastResult,
  ReferenceProbability,
  Resolution,
} from "@/lib/domain";

type DemoSnapshot = {
  events: ForecastEvent[];
  forecasts: ForecastResult[];
  references: ReferenceProbability[];
  resolutions: Resolution[];
};

export interface EventProvider {
  getUpcomingEvents(now?: Date): ForecastEvent[];
  getHistoricalEvents(): ForecastEvent[];
}

export interface ForecastProvider {
  getForecasts(events: ForecastEvent[], now?: Date): ForecastResult[];
}

export interface ReferenceProbabilityProvider {
  getReferences(events: ForecastEvent[], now?: Date): ReferenceProbability[];
}

const DAY = 24 * 60 * 60 * 1000;
const DEMO_SOURCE = "Deterministic DEMO DATA";
const outcomes = ["Yes", "No"];

interface EventSeed {
  id: string;
  category: ForecastEvent["category"];
  title: string;
  description: string;
  interests: string[];
  yesProbability: number;
  uncertainty: number;
  dataQuality: number;
  referenceYesProbability?: number;
}

const upcomingSeeds: EventSeed[] = [
  {
    id: "demo-nba-warriors-close",
    category: "sports",
    title: "DEMO DATA: Warriors edge a fictional NBA simulation matchup",
    description: "A deterministic fictional Warriors matchup for testing forecasts; not a real NBA game.",
    interests: ["NBA", "Warriors", "Golden State"],
    yesProbability: 0.54,
    uncertainty: 0.14,
    dataQuality: 0.94,
  },
  {
    id: "demo-nba-warriors-uncertain",
    category: "sports",
    title: "DEMO DATA: Warriors win a high-uncertainty NBA simulation",
    description: "An intentionally uncertain fictional NBA scenario; not a real game or live performance.",
    interests: ["NBA", "Warriors", "Golden State"],
    yesProbability: 0.56,
    uncertainty: 0.45,
    dataQuality: 0.83,
  },
  {
    id: "demo-nba-north",
    category: "sports",
    title: "DEMO DATA: North City scores first in a fictional NBA simulation",
    description: "A fictional basketball scenario for exercising the demo forecast pipeline.",
    interests: ["NBA", "basketball"],
    yesProbability: 0.59,
    uncertainty: 0.29,
    dataQuality: 0.83,
  },
  {
    id: "demo-nba-harbor",
    category: "sports",
    title: "DEMO DATA: Harbor Hawks win a fictional NBA simulation",
    description: "A fictional basketball scenario; no real teams or live performance data.",
    interests: ["NBA", "basketball"],
    yesProbability: 0.68,
    uncertainty: 0.19,
    dataQuality: 0.88,
    referenceYesProbability: 0.79,
  },
  {
    id: "demo-weather-sf-dry",
    category: "weather",
    title: "DEMO DATA: San Francisco stays dry in the simulation window",
    description: "A fictional San Francisco weather scenario, not an observation or forecast.",
    interests: ["San Francisco", "weather", "California"],
    yesProbability: 0.54,
    uncertainty: 0.14,
    dataQuality: 0.92,
  },
  {
    id: "demo-weather-seattle-rain",
    category: "weather",
    title: "DEMO DATA: Seattle has measurable rain in the simulation window",
    description: "A fictional weather example; it does not describe real or live conditions.",
    interests: ["Seattle", "weather"],
    yesProbability: 0.62,
    uncertainty: 0.25,
    dataQuality: 0.85,
    referenceYesProbability: 0.72,
  },
  {
    id: "demo-weather-denver-snow",
    category: "weather",
    title: "DEMO DATA: Denver has snow in the simulation window",
    description: "A fictional weather scenario for the deterministic demo only.",
    interests: ["Denver", "weather"],
    yesProbability: 0.57,
    uncertainty: 0.32,
    dataQuality: 0.79,
  },
  {
    id: "demo-weather-miami-wind",
    category: "weather",
    title: "DEMO DATA: Miami stays below the simulation wind threshold",
    description: "A fictional weather event, not a real observation or meteorological forecast.",
    interests: ["Miami", "weather"],
    yesProbability: 0.81,
    uncertainty: 0.1,
    dataQuality: 0.9,
  },
];

function iso(date: Date): string {
  return date.toISOString();
}

function makeUpcomingEvents(now = new Date()): ForecastEvent[] {
  const anchor = new Date(now);
  return upcomingSeeds.map((seed, index) => {
    const start = new Date(anchor.getTime() + (index + 1) * DAY);
    const captured = new Date(now.getTime() - 60 * 60 * 1000);
    return {
      id: seed.id,
      category: seed.category,
      title: seed.title,
      description: seed.description,
      startTime: iso(start),
      resolutionTime: iso(new Date(start.getTime() + 3 * 60 * 60 * 1000)),
      outcomes: [...outcomes],
      interests: [...seed.interests],
      metadata: { fixture: "deterministic-demo", scenario: seed.id },
      dataQuality: seed.dataQuality,
      dataCapturedAt: iso(captured),
      source: DEMO_SOURCE,
    };
  });
}

interface HistoricalSeed extends EventSeed {
  resolvedAt: string;
  actualOutcome: string;
}

const historicalSeeds: HistoricalSeed[] = [
  { ...upcomingSeeds[0], id: "history-demo-sports-1", title: "DEMO DATA: Resolved fictional basketball scenario 1", resolvedAt: "2025-11-15T18:00:00.000Z", actualOutcome: "Yes" },
  { ...upcomingSeeds[1], id: "history-demo-sports-2", title: "DEMO DATA: Resolved fictional NBA scenario 2", resolvedAt: "2025-12-02T18:00:00.000Z", actualOutcome: "No" },
  { ...upcomingSeeds[2], id: "history-demo-sports-3", title: "DEMO DATA: Resolved fictional NBA scenario 3", resolvedAt: "2026-01-19T18:00:00.000Z", actualOutcome: "Yes" },
  { ...upcomingSeeds[3], id: "history-demo-sports-4", title: "DEMO DATA: Resolved fictional NBA scenario 4", resolvedAt: "2026-03-08T18:00:00.000Z", actualOutcome: "No" },
  { ...upcomingSeeds[4], id: "history-demo-weather-1", title: "DEMO DATA: Resolved fictional San Francisco weather scenario 1", resolvedAt: "2026-04-11T18:00:00.000Z", actualOutcome: "Yes" },
  { ...upcomingSeeds[5], id: "history-demo-weather-2", title: "DEMO DATA: Resolved fictional Seattle weather scenario 2", resolvedAt: "2026-05-23T18:00:00.000Z", actualOutcome: "No" },
  { ...upcomingSeeds[6], id: "history-demo-weather-3", title: "DEMO DATA: Resolved fictional Denver weather scenario 3", resolvedAt: "2026-07-14T18:00:00.000Z", actualOutcome: "Yes" },
  { ...upcomingSeeds[7], id: "history-demo-weather-4", title: "DEMO DATA: Resolved fictional Miami weather scenario 4", resolvedAt: "2026-08-26T18:00:00.000Z", actualOutcome: "No" },
];

function makeHistoricalEvents(): ForecastEvent[] {
  return historicalSeeds.map((seed) => {
    const resolved = new Date(seed.resolvedAt);
    const start = new Date(resolved.getTime() - 3 * 60 * 60 * 1000);
    const captured = new Date(start.getTime() - 2 * 60 * 60 * 1000);
    return {
      id: seed.id,
      category: seed.category,
      title: seed.title,
      description: `Fictional resolved ${seed.category} fixture for deterministic DEMO DATA; not a real-world result.`,
      startTime: iso(start),
      resolutionTime: iso(resolved),
      outcomes: [...outcomes],
      interests: [...seed.interests],
      metadata: { fixture: "deterministic-demo", historical: true },
      dataQuality: seed.dataQuality,
      dataCapturedAt: iso(captured),
      source: DEMO_SOURCE,
    };
  });
}

function makeForecast(event: ForecastEvent, now = new Date()): ForecastResult {
  const seed = [...upcomingSeeds, ...historicalSeeds].find(({ id }) => id === event.id);
  const yesProbability = seed?.yesProbability ?? 0.5;
  const uncertainty = seed?.uncertainty ?? 0.3;
  const generatedAt = event.metadata.historical === true
    ? iso(new Date(Date.parse(event.startTime) - 60 * 60 * 1000))
    : iso(new Date(Math.min(now.getTime(), Date.parse(event.dataCapturedAt))));
  return {
    eventId: event.id,
    outcomes: [
      { outcome: "Yes", probability: yesProbability },
      { outcome: "No", probability: 1 - yesProbability },
    ],
    uncertainty,
    factors: [
      { name: "Scenario evidence", direction: "positive", description: "Deterministic synthetic evidence for this demo fixture." },
      { name: "Model uncertainty", direction: uncertainty > 0.25 ? "negative" : "neutral", description: "Illustrative uncertainty; not based on live observations." },
    ],
    modelVersion: "demo-forecast-v1",
    generatedAt,
  };
}

function makeReferences(events: ForecastEvent[], now = new Date()): ReferenceProbability[] {
  return events.flatMap((event) => {
    const forecast = makeForecast(event, now);
    const seed = [...upcomingSeeds, ...historicalSeeds].find(({ id }) => id === event.id);
    const referenceYesProbability = seed?.referenceYesProbability ??
      Math.max(0.05, forecast.outcomes[0].probability - 0.04);
    const capturedAt = event.metadata.historical === true
      ? iso(new Date(Date.parse(event.startTime) - 90 * 60 * 1000))
      : event.dataCapturedAt;
    return forecast.outcomes.map(({ outcome }) => ({
      eventId: event.id,
      outcome,
      probability: outcome === "Yes" ? referenceYesProbability : 1 - referenceYesProbability,
      provider: seed?.referenceYesProbability === undefined
        ? "DEMO DATA synthetic reference baseline"
        : "DEMO DATA synthetic benchmark inversion",
      capturedAt,
    }));
  });
}

function makeResolutions(): Resolution[] {
  return historicalSeeds.map((seed) => ({
    eventId: seed.id,
    actualOutcome: seed.actualOutcome,
    resolvedAt: seed.resolvedAt,
  }));
}

export function getDemoSnapshot(now = new Date()): DemoSnapshot {
  const upcoming = makeUpcomingEvents(now);
  const historical = makeHistoricalEvents();
  const events = [...upcoming, ...historical];
  return {
    events,
    forecasts: events.map((event) => makeForecast(event, now)),
    references: makeReferences(events, now),
    resolutions: makeResolutions(),
  };
}

// Synthetic labels are separate from forecast features and become visible only after
// the snapshotted event's resolution time. They are not real-world observations.
const upcomingOutcomes: Record<string, "Yes" | "No"> = {
  "demo-nba-warriors-close": "Yes",
  "demo-nba-warriors-uncertain": "No",
  "demo-nba-north": "Yes",
  "demo-nba-harbor": "No",
  "demo-weather-sf-dry": "Yes",
  "demo-weather-seattle-rain": "No",
  "demo-weather-denver-snow": "Yes",
  "demo-weather-miami-wind": "No",
};

export function getDueDemoResolutions(events: ForecastEvent[], asOf: Date): Resolution[] {
  const due: Resolution[] = [];
  for (const event of events) {
    const outcome = upcomingOutcomes[event.id];
    if (outcome && event.metadata.historical !== true &&
      Date.parse(event.resolutionTime) <= asOf.getTime()) {
      due.push({ eventId: event.id, actualOutcome: outcome, resolvedAt: event.resolutionTime });
    }
  }
  return due;
}

const initialDemoSnapshot = getDemoSnapshot();
export const demoEvents = initialDemoSnapshot.events;
export const demoForecasts = initialDemoSnapshot.forecasts;
export const demoReferences = initialDemoSnapshot.references;
export const demoResolutions = initialDemoSnapshot.resolutions;

export const demoEventProvider: EventProvider = {
  getUpcomingEvents: makeUpcomingEvents,
  getHistoricalEvents: makeHistoricalEvents,
};

export const demoForecastProvider: ForecastProvider = {
  getForecasts: (events, now) => events.map((event) => makeForecast(event, now)),
};

export const demoReferenceProbabilityProvider: ReferenceProbabilityProvider = {
  getReferences: makeReferences,
};
