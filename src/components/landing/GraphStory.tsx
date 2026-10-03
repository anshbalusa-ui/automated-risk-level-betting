"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { SignalOrb } from "./SignalOrb";
import {
  GRAPH_HEIGHT,
  GRAPH_WIDTH,
  graphStoryStates,
  storySeries,
  type StoryAnnotation,
} from "./graph-story-data";
import styles from "./GraphStory.module.css";

type GraphStoryProps = {
  onTryDemo: () => void;
};

type StoryStyle = CSSProperties & {
  "--graph-opacity": number;
  "--graph-scale": number;
  "--cta-opacity": number;
  "--cta-shift": string;
};

type CopyStyle = CSSProperties & {
  "--copy-opacity": number;
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smoothstep = (value: number) => value * value * (3 - 2 * value);
const phase = (value: number, start: number, end: number) => smoothstep(clamp((value - start) / (end - start)));

function graphPoint(value: number, index: number, total: number) {
  const x = 56 + (index / (total - 1)) * 688;
  const y = 365 - value * 270;
  return { x, y };
}

function graphPath(values: number[]) {
  return values
    .map((value, index) => {
      const point = graphPoint(value, index, values.length);
      return `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
    })
    .join(" ");
}

function annotationPosition(annotation: StoryAnnotation) {
  return {
    x: 56 + annotation.x * 688,
    y: 365 - annotation.y * 270,
  };
}

function GraphVisual({ progress }: { progress: number }) {
  const series = useMemo(() => storySeries(progress), [progress]);
  const modelPath = graphPath(series.model);
  const referencePath = graphPath(series.reference);
  const modelValue = Math.round(series.model.at(-1)! * 100);
  const referenceValue = Math.round(series.reference.at(-1)! * 100);
  const gap = modelValue - referenceValue;

  return (
    <div className={styles.graphFrame}>
      <div className={styles.graphMeta}>
        <span>RØGUE / SIGNAL REGISTER</span>
        <span>LIVE DEMO / 04 STATES</span>
      </div>
      <svg
        className={styles.graphSvg}
        viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}
        role="img"
        aria-label={`Signal graph. Model ${modelValue} percent, reference ${referenceValue} percent, gap ${gap >= 0 ? "+" : ""}${gap} points.`}
      >
        <g aria-hidden="true">
          {[0, 1, 2, 3, 4].map((row) => {
            const y = 75 + row * 67.5;
            return <line key={`row-${row}`} className={styles.gridLine} x1="56" x2="744" y1={y} y2={y} />;
          })}
          {[0, 1, 2, 3, 4, 5, 6].map((column) => {
            const x = 56 + column * 114.67;
            return <line key={`column-${column}`} className={styles.gridLine} x1={x} x2={x} y1="75" y2="365" />;
          })}
          <text className={styles.gridLabel} x="56" y="57">100</text>
          <text className={styles.gridLabel} x="56" y="220">50</text>
          <text className={styles.gridLabel} x="56" y="378">0</text>
        </g>
        <path className={styles.referenceLine} d={referencePath} />
        <path className={styles.modelLine} d={modelPath} />
        <g aria-hidden="true">
          {series.reference.map((value, index) => {
            const point = graphPoint(value, index, series.reference.length);
            return <circle key={`reference-${index}`} className={styles.point} cx={point.x} cy={point.y} r={series.activePoints.includes(index) ? 4 : 2.7} />;
          })}
          {series.model.map((value, index) => {
            const point = graphPoint(value, index, series.model.length);
            const active = series.activePoints.includes(index);
            return <circle key={`model-${index}`} className={`${styles.point} ${styles.pointModel} ${active ? styles.activePoint : ""}`} cx={point.x} cy={point.y} r={active ? 5 : 2.9} />;
          })}
        </g>
        <g aria-hidden="true">
          {series.annotations.map((annotation) => {
            const point = annotationPosition(annotation);
            return (
              <g key={annotation.label} className={`${styles.annotation} ${annotation.tone === "muted" ? styles.annotationMuted : ""}`} transform={`translate(${point.x} ${point.y})`}>
                <line x1="0" y1="0" x2="0" y2={annotation.y > 0.5 ? 24 : -24} />
                <text x="6" y={annotation.y > 0.5 ? 39 : -29}>{annotation.label}</text>
              </g>
            );
          })}
        </g>
      </svg>
      <div className={styles.graphFooter}>
        <span>MODEL <strong>{modelValue}%</strong></span>
        <span>REFERENCE <strong>{referenceValue}%</strong></span>
        <span>GAP <strong>{gap >= 0 ? "+" : ""}{gap} pts</strong></span>
      </div>
    </div>
  );
}

export function GraphStory({ onTryDemo }: GraphStoryProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReducedMotion(media.matches);
    updateMotionPreference();
    media.addEventListener("change", updateMotionPreference);

    let frame = 0;
    const update = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const range = Math.max(section.offsetHeight - window.innerHeight, 1);
        const next = clamp(-section.getBoundingClientRect().top / range);
        setProgress(next);
      });
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      media.removeEventListener("change", updateMotionPreference);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const visualProgress = reducedMotion ? 0 : progress;
  const orbProgress = reducedMotion ? 0.08 : phase(progress, 0.06, 0.39);
  const graphOpacity = reducedMotion ? 1 : phase(progress, 0.2, 0.36);
  const graphProgress = reducedMotion ? 1 : clamp((progress - 0.3) / 0.62);
  const graphScale = reducedMotion ? 1 : 0.82 + graphOpacity * 0.18 - phase(progress, 0.86, 1) * 0.1;
  const ctaOpacity = reducedMotion ? 1 : phase(progress, 0.92, 0.98);
  const activeCopyIndex = reducedMotion
    ? graphStoryStates.length - 1
    : Math.min(graphStoryStates.length - 1, Math.floor(clamp((progress - 0.35) / 0.59) * graphStoryStates.length));
  const copyReveal = reducedMotion ? 1 : phase(progress, 0.31, 0.39);
  const storyStyle: StoryStyle = {
    "--graph-opacity": graphOpacity,
    "--graph-scale": graphScale,
    "--cta-opacity": ctaOpacity,
    "--cta-shift": `${(1 - ctaOpacity) * 14}px`,
  };

  return (
    <section ref={sectionRef} className={`${styles.story} ${reducedMotion ? styles.reducedStory : ""}`} aria-label="RØGUE signal story">
      <div className={styles.sticky} style={storyStyle}>
        <div
          className={styles.heroCopy}
          style={{ opacity: 1 - phase(visualProgress, 0.08, 0.28), transform: `translate(-50%, ${phase(visualProgress, 0.08, 0.28) * -18}px)` }}
        >
          <div className={styles.heroKicker}>A signal system for uncertain questions</div>
          <h1 className={styles.heroTitle}>FIND <em>SIGNAL.</em></h1>
          <div className={styles.heroHint}>Scroll to enter the system</div>
        </div>

        <div className={styles.orbStage}>
          <SignalOrb progress={orbProgress} reducedMotion={reducedMotion} />
        </div>

        <div className={styles.graphWrap} style={{ visibility: graphOpacity > 0.01 ? "visible" : "hidden" }}>
          <GraphVisual progress={graphProgress} />
        </div>

        {graphStoryStates.map((state, index) => {
          const baseVisibility = index === activeCopyIndex ? 1 : 0;
          const visibility = baseVisibility * copyReveal * (1 - phase(progress, 0.92, 0.98));
          const style: CopyStyle = {
            "--copy-opacity": visibility,
            opacity: visibility,
            filter: `blur(${(1 - visibility) * 4}px)`,
            transform: `translateY(${(1 - visibility) * 12}px)`,
            pointerEvents: visibility > 0.1 ? "auto" : "none",
            visibility: visibility > 0.01 ? "visible" : "hidden",
          };
          return (
            <article
              key={state.id}
              className={`${styles.copy} ${index % 2 === 0 ? styles.copyLeft : styles.copyRight}`}
              style={style}
              aria-current={activeCopyIndex === index ? "step" : undefined}
            >
              <div className={styles.copyEyebrow}>{state.eyebrow}</div>
              <h2>{state.title}</h2>
              <p>{state.description}</p>
            </article>
          );
        })}

        <div className={styles.finalCta}>
          <div className={styles.finalEyebrow}>THE NEXT STEP IS YOURS</div>
          <h2>Ready to see it work?</h2>
          <button type="button" className="button button-dark" onClick={onTryDemo}>Try the demo <span>→</span></button>
        </div>

        <div className={styles.storyRail} aria-hidden="true">SCROLL / {String(Math.round(visualProgress * 100)).padStart(2, "0")}%</div>
      </div>
    </section>
  );
}
