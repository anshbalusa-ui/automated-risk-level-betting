import type { CSSProperties } from "react";
import styles from "./SignalOrb.module.css";

type OrbProps = {
  progress: number;
  reducedMotion: boolean;
};

type OrbStyle = CSSProperties & {
  "--orb-scroll-scale": number;
  "--orb-scroll-opacity": number;
  "--orb-scroll-rotate": string;
};

const nodes = [
  { x: 50, y: 50, r: 3.2 },
  { x: 27, y: 28, r: 2.1 },
  { x: 72, y: 25, r: 2.4 },
  { x: 79, y: 53, r: 1.8 },
  { x: 64, y: 78, r: 2.2 },
  { x: 34, y: 76, r: 1.8 },
  { x: 20, y: 54, r: 2.5 },
  { x: 42, y: 20, r: 1.5 },
  { x: 58, y: 18, r: 1.7 },
  { x: 88, y: 36, r: 1.2 },
  { x: 85, y: 70, r: 1.4 },
  { x: 18, y: 37, r: 1.3 },
  { x: 39, y: 90, r: 1.1 },
  { x: 58, y: 91, r: 1.3 },
];

const edges: Array<[number, number]> = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6],
  [1, 2], [1, 6], [1, 7], [2, 3], [2, 8], [2, 9],
  [3, 4], [3, 10], [4, 5], [4, 13], [5, 6], [5, 12],
  [6, 11], [7, 8], [8, 9], [10, 13],
];

export function SignalOrb({ progress, reducedMotion }: OrbProps) {
  const boundedProgress = Math.max(0, Math.min(1, progress));
  const style: OrbStyle = {
    "--orb-scroll-scale": 1 + boundedProgress * 2.45,
    "--orb-scroll-opacity": Math.max(0, 1 - Math.max(0, boundedProgress - 0.42) / 0.43),
    "--orb-scroll-rotate": `${boundedProgress * 28}deg`,
    visibility: boundedProgress < 0.99 ? "visible" : "hidden",
  };
  const signalCount = 18 + Math.round(boundedProgress * 34);

  return (
    <div className={`${styles.orb} ${reducedMotion ? styles.reduced : ""}`} style={style} aria-label="RØGUE signal network">
      <div className={styles.halo} />
      <div className={styles.core}>
        <svg className={styles.network} viewBox="0 0 100 100" role="img" aria-label="Connected signal nodes">
          <defs>
            <radialGradient id="signal-orb-core" cx="50%" cy="44%" r="60%">
              <stop offset="0" stopColor="#263c4a" stopOpacity="0.9" />
              <stop offset="0.62" stopColor="#13232e" stopOpacity="0.76" />
              <stop offset="1" stopColor="#091117" stopOpacity="0.08" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="44" fill="url(#signal-orb-core)" />
          <g className={styles.edges}>
            {edges.map(([from, to], index) => {
              const start = nodes[from];
              const end = nodes[to];
              return <line key={`${from}-${to}`} className={styles.edge} style={{ "--edge-delay": `${index * 0.19}s` } as CSSProperties} x1={start.x} y1={start.y} x2={end.x} y2={end.y} />;
            })}
          </g>
          <g className={styles.nodes}>
            {nodes.map((node, index) => (
              <circle
                key={`${node.x}-${node.y}`}
                className={styles.node}
                style={{ "--node-delay": `${index * 0.21}s` } as CSSProperties}
                cx={node.x}
                cy={node.y}
                r={node.r}
              />
            ))}
          </g>
          <circle className={styles.center} cx="50" cy="50" r="4.7" />
        </svg>
        <div className={styles.readout}>
          <span>LIVE SIGNAL CORE</span>
          <strong>{String(signalCount).padStart(2, "0")}</strong>
          <small>inputs in motion</small>
        </div>
      </div>
    </div>
  );
}
