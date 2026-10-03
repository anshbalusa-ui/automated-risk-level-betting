import { BaseThinkingOrb } from "./base-orb";
import type { ThinkingOrbProps } from "./types";

type Props = Omit<ThinkingOrbProps, "mode" | "variant">;

export function OrbWorking(props: Props) {
  return <BaseThinkingOrb mode="orbits" {...props} />;
}
