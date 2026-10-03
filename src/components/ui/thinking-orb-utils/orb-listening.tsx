import { BaseThinkingOrb } from "./base-orb";
import type { ThinkingOrbProps } from "./types";

type Props = Omit<ThinkingOrbProps, "mode" | "variant">;

export function OrbListening(props: Props) {
  return <BaseThinkingOrb mode="wave" {...props} />;
}
