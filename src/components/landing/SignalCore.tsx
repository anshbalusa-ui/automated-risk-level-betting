import { LiquidButton } from "@/components/ui/liquid-glass-button";
import styles from "./SignalCore.module.css";

type SignalCoreProps = {
  onTryDemo: () => void;
};

const edges = [
  [92, 92, 164, 66],
  [164, 66, 238, 94],
  [238, 94, 278, 164],
  [278, 164, 246, 238],
  [246, 238, 164, 268],
  [164, 268, 82, 236],
  [82, 236, 48, 164],
  [48, 164, 92, 92],
  [92, 92, 164, 164],
  [238, 94, 164, 164],
  [278, 164, 164, 164],
  [246, 238, 164, 164],
  [82, 236, 164, 164],
  [48, 164, 164, 164],
] as const;

const nodes = [
  [92, 92],
  [164, 66],
  [238, 94],
  [278, 164],
  [246, 238],
  [164, 268],
  [82, 236],
  [48, 164],
] as const;

export default function SignalCore({ onTryDemo }: SignalCoreProps) {
  return (
    <div className={styles.centerContent}>
      <h1 className={styles.headline}>FIND SIGNAL.</h1>
      <div className={styles.core} role="img" aria-label="RØGUE signal core processing sports intelligence">
        <div className={styles.coreLabel} aria-hidden="true"><span>RØGUE / SIGNAL CORE</span><span>LIVE</span></div>
        <div className={styles.visual} aria-hidden="true">
          <svg viewBox="0 0 328 328" role="presentation">
            <defs>
              <radialGradient id="rogue-signal-core-field" cx="50%" cy="50%" r="50%">
                <stop offset="0" stopColor="#d8d2c4" stopOpacity=".16" />
                <stop offset=".48" stopColor="#7ca9a8" stopOpacity=".07" />
                <stop offset="1" stopColor="#090909" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="rogue-signal-core-line" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#e4d4ae" stopOpacity=".8" />
                <stop offset="1" stopColor="#77aaa5" stopOpacity=".8" />
              </linearGradient>
            </defs>
            <circle className={styles.field} cx="164" cy="164" r="148" fill="url(#rogue-signal-core-field)" />
            <circle className={`${styles.ring} ${styles.ringOuter}`} cx="164" cy="164" r="138" />
            <circle className={`${styles.ring} ${styles.ringMiddle}`} cx="164" cy="164" r="106" />
            <circle className={`${styles.ring} ${styles.ringInner}`} cx="164" cy="164" r="72" />
            <g className={styles.network}>
              {edges.map(([x1, y1, x2, y2], index) => <line key={`${x1}-${y1}-${x2}-${y2}-${index}`} x1={x1} y1={y1} x2={x2} y2={y2} />)}
            </g>
            <g className={styles.nodes}>
              {nodes.map(([cx, cy], index) => <circle key={`${cx}-${cy}`} className={index % 3 === 0 ? styles.nodeAccent : styles.node} cx={cx} cy={cy} r={index % 3 === 0 ? 3.5 : 2.5} />)}
            </g>
            <path className={styles.signalSweep} d="M48 164 A116 116 0 0 1 164 48" pathLength="1" />
            <circle className={styles.centerHalo} cx="164" cy="164" r="28" />
            <circle className={styles.centerNode} cx="164" cy="164" r="7" fill="url(#rogue-signal-core-line)" />
            <circle className={styles.particle} cx="164" cy="26" r="2" />
            <circle className={`${styles.particle} ${styles.particleSecond}`} cx="302" cy="164" r="1.5" />
          </svg>
          <div className={styles.coreReadout}><span>MODEL SIGNAL</span><strong>54%</strong></div>
        </div>
        <div className={styles.coreMeta} aria-hidden="true"><span>MODEL / 54</span><span>REF / 45</span><span>GAP / +9</span></div>
      </div>
      <p className={styles.supporting}>Sports intelligence, distilled.</p>
      <div className={`hero-actions ${styles.actions}`}>
        <LiquidButton size="lg" onClick={onTryDemo}>Try demo <span aria-hidden="true">→</span></LiquidButton>
      </div>
    </div>
  );
}
