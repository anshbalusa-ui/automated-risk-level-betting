"use client";

import { useEffect, useState } from "react";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import styles from "./SportsProbabilityGraph.module.css";

type GraphFrame = {
  modelBars: number[];
  referenceBars: number[];
  model: number;
  reference: number;
  gap: number;
};

type SportsProbabilityGraphProps = {
  onTryDemo: () => void;
};

const BASE_MODEL = [31, 34, 43, 58, 70, 62, 46, 36, 40, 50, 64, 73, 66, 51, 39, 35, 44, 58, 71, 63];
const BASE_REFERENCE = [45, 49, 56, 61, 55, 46, 39, 43, 49, 55, 59, 52, 45, 40, 44, 50, 55, 51, 45, 42];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function tracePoints(values: number[]) {
  return values.map((value, index) => {
    const x = 2 + (index / (values.length - 1)) * 96;
    return `${x},${100 - value}`;
  }).join(" ");
}

function frameAt(tick: number): GraphFrame {
  const phase = tick * 0.19;
  const modelBars = BASE_MODEL.map((base, index) => clamp(
    base + Math.sin(phase + index * 0.64) * 2.8 + Math.cos(phase * 0.68 - index * 0.31) * 1.5,
    22,
    78,
  ));
  const referenceBars = BASE_REFERENCE.map((base, index) => clamp(
    base + Math.cos(phase * 0.72 + index * 0.53) * 2.2 + Math.sin(phase * 0.38 - index * 0.21) * 1.2,
    26,
    72,
  ));
  const model = Math.round(modelBars[modelBars.length - 1]);
  const reference = Math.round(referenceBars[referenceBars.length - 1]);

  return {
    modelBars,
    referenceBars,
    model,
    reference,
    gap: model - reference,
  };
}

const INITIAL_FRAME = frameAt(0);

export default function SportsProbabilityGraph({ onTryDemo }: SportsProbabilityGraphProps) {
  const [frame, setFrame] = useState(INITIAL_FRAME);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let tick = 0;
    let interval: number | null = null;

    const stop = () => {
      if (interval !== null) window.clearInterval(interval);
      interval = null;
    };
    const start = () => {
      stop();
      if (preference.matches) {
        setFrame(INITIAL_FRAME);
        return;
      }
      interval = window.setInterval(() => {
        tick += 1;
        setFrame(frameAt(tick));
      }, 180);
    };

    start();
    preference.addEventListener("change", start);
    return () => {
      stop();
      preference.removeEventListener("change", start);
    };
  }, []);

  const modelTrace = tracePoints(frame.modelBars);
  const referenceTrace = tracePoints(frame.referenceBars);

  return (
    <div className={styles.centerContent}>
      <h1 className={styles.headline}>READ THE NUMBERS.</h1>
      <div
        className={styles.graphFrame}
        role="img"
        aria-label="Animated demo football probability chart for Metro Wolves versus River City with three distinct signal regimes"
      >
        <div className={styles.graphHeader}>
          <div className={styles.graphKicker}>
            <span>DEMO DATA / NFL</span>
            <span className={styles.live}><i aria-hidden="true" /> UPDATING</span>
          </div>
          <div className={styles.matchup}>
            <div><span>YES</span><strong>Metro Wolves</strong></div>
            <b>VS</b>
            <div className={styles.away}><span>NO</span><strong>River City</strong></div>
          </div>
        </div>

        <div className={styles.plotHeader}>
          <span>WIN PROBABILITY</span>
          <span>LAST 20 CHECKS / 3 REGIMES</span>
        </div>
        <div className={styles.plot} aria-hidden="true">
          <div className={styles.gridLines}><i /><i /><i /><i /><i /></div>
          <svg className={styles.signalTrace} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <polyline className={styles.referenceTrace} points={referenceTrace} />
            <polyline className={styles.modelTrace} points={modelTrace} />
            <circle className={styles.referenceNode} cx="98" cy={100 - frame.reference} r="1" />
            <circle className={styles.modelNode} cx="98" cy={100 - frame.model} r="1.1" />
          </svg>
          <div className={styles.axis}><span>80</span><span>60</span><span>40</span><span>20</span></div>
          <div className={styles.bars}>
            {frame.modelBars.map((modelBar, index) => (
              <div className={styles.barPair} key={index}>
                <i className={`${styles.bar} ${styles.modelBar}`} style={{ height: `${modelBar}%`, transitionDelay: `${index * 7}ms` }} />
                <i className={`${styles.bar} ${styles.referenceBar}`} style={{ height: `${frame.referenceBars[index]}%`, transitionDelay: `${index * 7}ms` }} />
              </div>
            ))}
          </div>
          <div className={styles.currentRule} style={{ bottom: `${frame.model}%` }}><span>{frame.model}%</span></div>
          <div className={styles.plotFoot}><span>-20</span><span>-10</span><span>NOW</span></div>
        </div>

        <div className={styles.readouts}>
          <div><span>MODEL / YES</span><strong>{frame.model}%</strong></div>
          <div><span>REFERENCE</span><strong>{frame.reference}%</strong></div>
          <div><span>GAP</span><strong>{frame.gap >= 0 ? "+" : ""}{frame.gap} PTS</strong></div>
        </div>
        <div className={styles.graphFooter}>
          <div className={styles.legend}><span><i className={styles.modelSwatch} /> MODEL</span><span><i className={styles.referenceSwatch} /> REFERENCE</span></div>
          <span>SIMULATION ONLY</span>
        </div>
      </div>
      <p className={styles.supporting}>Choose sports. Set a risk. Review the picks.</p>
      <div className={`hero-actions ${styles.actions}`}>
        <LiquidButton size="lg" onClick={onTryDemo}>Try demo <span aria-hidden="true">→</span></LiquidButton>
      </div>
    </div>
  );
}
