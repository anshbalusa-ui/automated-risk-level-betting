import { BaseThinkingOrb } from "./base-orb";
import type { ThinkingOrbProps } from "./types";

type Props = Omit<ThinkingOrbProps, "mode" | "variant">;

export function OrbSolving(props: Props) {
  return <BaseThinkingOrb mode="rubik" {...props} />;
}
