export type ThinkingOrbMode =
  | "orbits"
  | "globe"
  | "rubik"
  | "wave"
  | "web"
  | "braid"
  | "ribbon"
  | "ring"
  | "morph";

export type ThinkingOrbVariant =
  | "working"
  | "searching"
  | "solving"
  | "listening"
  | "connecting"
  | "weaving"
  | "composing"
  | "breathing"
  | "shaping";

export type ThinkingOrbSurface = "auto" | "light" | "dark";

export type ThinkingOrbPlayback = "play" | "pause";

export interface ThinkingOrbDescriptor {
  id: string;
  name: string;
  variant: ThinkingOrbVariant;
  mode: ThinkingOrbMode;
  caption: string;
  frame: [number, number];
  summary: string;
}

export interface ThinkingOrbProps {
  variant?: ThinkingOrbVariant | ThinkingOrbMode;
  mode?: ThinkingOrbMode;
  caption?: string;
  summary?: string;
  frame?: [number, number];
  size?: number;
  speed?: number;
  scale?: number;
  playback?: ThinkingOrbPlayback;
  surface?: ThinkingOrbSurface;
  showMeta?: boolean;
  className?: string;
}
