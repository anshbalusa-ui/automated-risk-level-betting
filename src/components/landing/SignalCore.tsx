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
      <h1 className={styles.headline}>AGENTIC SPORTS SIGNAL.</h1>
      <div className={styles.core} role="img" aria-label="RØGUE agent core visual for sports intelligence">
        <div className={styles.coreLabel} aria-hidden="true"><span>RØGUE / AGENT CORE</span><span>SIMULATION</span></div>
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
              <radialGradient id="rogue-liquid-metal-shell" cx="30%" cy="22%" r="78%">
                <stop offset="0" stopColor="#fffdf4" />
                <stop offset=".2" stopColor="#d8e4df" stopOpacity=".96" />
                <stop offset=".42" stopColor="#778c8c" stopOpacity=".94" />
                <stop offset=".62" stopColor="#c8b997" stopOpacity=".96" />
                <stop offset=".82" stopColor="#354345" stopOpacity=".98" />
                <stop offset="1" stopColor="#070b0c" />
              </radialGradient>
              <linearGradient id="rogue-liquid-metal-sheen" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#f8f4e8" stopOpacity=".7" />
                <stop offset=".32" stopColor="#b9d6d2" stopOpacity=".08" />
                <stop offset=".58" stopColor="#e4d4ae" stopOpacity=".48" />
                <stop offset="1" stopColor="#101819" stopOpacity=".4" />
              </linearGradient>
              <filter id="rogue-liquid-metal-distortion" x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
                <feTurbulence type="fractalNoise" baseFrequency=".02 .045" numOctaves="2" seed="12" result="liquidNoise" />
                <feDisplacementMap in="SourceGraphic" in2="liquidNoise" scale="8" xChannelSelector="R" yChannelSelector="G" result="fluidSurface" />
                <feSpecularLighting in="liquidNoise" surfaceScale="3.5" specularConstant=".65" specularExponent="22" lightingColor="#e8e1d2" result="liquidShine">
                  <feDistantLight azimuth="225" elevation="52" />
                </feSpecularLighting>
                <feComposite in="liquidShine" in2="SourceAlpha" operator="in" result="liquidShineMask" />
                <feBlend in="fluidSurface" in2="liquidShineMask" mode="screen" />
              </filter>
              <clipPath id="rogue-liquid-orb-clip">
                <circle cx="164" cy="164" r="70" />
              </clipPath>
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
            <g className={styles.liquidOrb} filter="url(#rogue-liquid-metal-distortion)">
              <circle className={styles.metalBlob} cx="164" cy="164" r="68" fill="url(#rogue-liquid-metal-shell)" />
              <path className={styles.metalWave} d="M101 174 C124 143 137 139 161 157 S207 199 235 162" />
              <circle className={styles.metalEdge} cx="164" cy="164" r="67" />
            </g>
            <g className={styles.liquidHighlight} clipPath="url(#rogue-liquid-orb-clip)">
              <ellipse className={styles.metalHighlight} cx="128" cy="121" rx="44" ry="19" transform="rotate(-28 128 121)" fill="url(#rogue-liquid-metal-sheen)" />
              <path className={styles.metalReflection} d="M112 128 C136 99 175 98 208 115" />
            </g>
            <path className={styles.signalSweep} d="M48 164 A116 116 0 0 1 164 48" pathLength="1" />
            <circle className={styles.centerHalo} cx="164" cy="164" r="36" />
            <circle className={styles.centerNode} cx="164" cy="164" r="4.5" fill="url(#rogue-signal-core-line)" />
            <circle className={styles.particle} cx="164" cy="26" r="2" />
            <circle className={`${styles.particle} ${styles.particleSecond}`} cx="302" cy="164" r="1.5" />
          </svg>
        </div>
        <div className={styles.coreMeta} aria-hidden="true"><span>SCAN</span><span>FILTER</span><span>DECIDE</span></div>
      </div>
      <p className={styles.supporting}>The agent reads the game. You set the risk.</p>
      <div className={`hero-actions ${styles.actions}`}>
        <LiquidButton size="lg" onClick={onTryDemo}>Try demo <span aria-hidden="true">→</span></LiquidButton>
      </div>
    </div>
  );
}
