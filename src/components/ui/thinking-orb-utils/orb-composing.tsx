import { BaseThinkingOrb } from "./base-orb";
import type { ThinkingOrbProps } from "./types";

type Props = Omit<ThinkingOrbProps, "mode" | "variant">;

export function OrbComposing(props: Props) {
  return <BaseThinkingOrb mode="ribbon" {...props} />;
}
