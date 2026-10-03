export type StoryAnnotation = {
  label: string;
  x: number;
  y: number;
  tone?: "accent" | "muted";
};

export type GraphStoryState = {
  id: "signals" | "context" | "filter" | "decision";
  eyebrow: string;
  title: string;
  description: string;
  model: number[];
  reference: number[];
  annotations: StoryAnnotation[];
  activePoints: number[];
};

export const GRAPH_WIDTH = 800;
export const GRAPH_HEIGHT = 440;

export const graphStoryStates: GraphStoryState[] = [
  {
    id: "signals",
    eyebrow: "01 / SIGNALS",
    title: "Start with the signal.",
    description: "RØGUE brings the relevant information into one view.",
    model: [0.34, 0.41, 0.39, 0.52, 0.56, 0.61, 0.66],
    reference: [0.53, 0.5, 0.48, 0.47, 0.49, 0.46, 0.44],
    annotations: [{ label: "FORM", x: 0.22, y: 0.26, tone: "muted" }],
    activePoints: [3, 4],
  },
  {
    id: "context",
    eyebrow: "02 / CONTEXT",
    title: "Context changes everything.",
    description: "Multiple factors become useful when they are read together.",
    model: [0.39, 0.46, 0.43, 0.57, 0.6, 0.67, 0.71],
    reference: [0.51, 0.49, 0.45, 0.46, 0.47, 0.45, 0.43],
    annotations: [
      { label: "MATCHUP", x: 0.44, y: 0.68, tone: "accent" },
      { label: "PACE", x: 0.7, y: 0.2, tone: "muted" },
    ],
    activePoints: [1, 4, 6],
  },
  {
    id: "filter",
    eyebrow: "03 / FILTER",
    title: "Filter the noise.",
    description: "Only the strongest signals stay in focus.",
    model: [0.43, 0.45, 0.48, 0.59, 0.62, 0.66, 0.69],
    reference: [0.48, 0.47, 0.46, 0.45, 0.45, 0.44, 0.43],
    annotations: [
      { label: "HISTORY", x: 0.28, y: 0.24, tone: "accent" },
      { label: "NOISE", x: 0.74, y: 0.76, tone: "muted" },
    ],
    activePoints: [3, 5],
  },
  {
    id: "decision",
    eyebrow: "04 / DECISION",
    title: "See the final read.",
    description: "The signal settles into a clear, reviewable decision.",
    model: [0.46, 0.5, 0.53, 0.58, 0.61, 0.64, 0.67],
    reference: [0.45, 0.46, 0.47, 0.47, 0.46, 0.45, 0.44],
    annotations: [{ label: "INCLUDED", x: 0.75, y: 0.3, tone: "accent" }],
    activePoints: [6],
  },
];

export function interpolateSeries(from: number[], to: number[], progress: number) {
  return from.map((value, index) => value + ((to[index] ?? value) - value) * progress);
}

export function storySeries(progress: number) {
  const scaled = Math.max(0, Math.min(1, progress)) * (graphStoryStates.length - 1);
  const index = Math.min(graphStoryStates.length - 2, Math.floor(scaled));
  const next = Math.min(graphStoryStates.length - 1, index + 1);
  const localProgress = scaled - index;
  const current = graphStoryStates[index];
  const following = graphStoryStates[next];

  return {
    model: interpolateSeries(current.model, following.model, localProgress),
    reference: interpolateSeries(current.reference, following.reference, localProgress),
    annotations: localProgress > 0.58 ? following.annotations : current.annotations,
    activePoints: localProgress > 0.5 ? following.activePoints : current.activePoints,
  };
}
