import { LiquidButton } from "@/components/ui/liquid-glass-button";
import ThinkingOrb from "@/components/ui/thinking-orb";
import styles from "./AgenticOrb.module.css";

type AgenticOrbProps = {
  onTryDemo: () => void;
};

export default function AgenticOrb({ onTryDemo }: AgenticOrbProps) {
  return (
    <div className={styles.centerContent}>
      <h1 className={styles.headline}>AGENTIC SPORTS BETTING.</h1>
      <div className={styles.orbFrame}>
        <ThinkingOrb
          variant="connecting"
          caption="Agentic sports betting"
          summary="A moving agent orb for sports betting simulation."
          frame={[420, 420]}
          size={560}
          speed={1.05}
          scale={0.86}
          showMeta={false}
          className={styles.orb}
        />
      </div>
      <p className={styles.supporting}>Let an agent find picks worth simulating.</p>
      <div className={`hero-actions ${styles.actions}`}>
        <LiquidButton size="lg" onClick={onTryDemo}>Try demo <span aria-hidden="true">→</span></LiquidButton>
      </div>
    </div>
  );
}
