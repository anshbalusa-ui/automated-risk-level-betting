import { LiquidButton } from "@/components/ui/liquid-glass-button";
import ThinkingOrb from "@/components/ui/thinking-orb";
import styles from "./AgenticOrb.module.css";

export default function AgenticOrb() {
  return (
    <div className={styles.centerContent}>
      <h1 className={styles.headline}>AGENTIC SPORTS BETTING.</h1>
      <div className={styles.orbFrame}>
        <ThinkingOrb
          variant="connecting"
          caption="Agentic sports betting"
          summary="A moving agent orb for sports betting simulation."
          frame={[560, 560]}
          size={680}
          speed={1.05}
          scale={1.05}
          showMeta={false}
          className={styles.orb}
        />
      </div>
      <p className={styles.supporting}>Let an agent find picks worth simulating.</p>
      <form action="/onboarding" method="get" className={`hero-actions ${styles.actions}`}>
        <LiquidButton size="lg" type="submit">Try demo <span aria-hidden="true">→</span></LiquidButton>
      </form>
    </div>
  );
}
