import { LiquidButton } from "@/components/ui/liquid-glass-button";
import ThinkingOrb from "@/components/ui/thinking-orb";
import styles from "./AgenticOrb.module.css";

type AgenticOrbProps = {
  onTryDemo: () => void;
};

export default function AgenticOrb({ onTryDemo }: AgenticOrbProps) {
  return (
    <div className={styles.centerContent}>
      <h1 className={styles.headline}>FIND SIGNAL.</h1>
      <div className={styles.orbFrame}>
        <ThinkingOrb
          variant="connecting"
          caption="Signal core"
          summary="A restrained sports-data signal core for the demo."
          frame={[560, 560]}
          size={680}
          speed={0.28}
          scale={0.96}
          showMeta={false}
          className={styles.orb}
        />
      </div>
      <p className={styles.supporting}>Data in. Signal out.</p>
      <div className={`hero-actions ${styles.actions}`}>
        <LiquidButton size="lg" onClick={onTryDemo}>Try demo <span aria-hidden="true">→</span></LiquidButton>
      </div>
    </div>
  );
}
