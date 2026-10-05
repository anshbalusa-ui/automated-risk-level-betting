"use client";

import { useEffect, useRef, useState } from "react";
import type { AgentRun } from "@/lib/domain";
import styles from "./GraphStory.module.css";

const YES_PATH = "M0 276 L35 276 L68 280 L95 265 L126 270 L154 254 L180 259 L207 251 L238 245 L270 249 L300 232 L335 227 L366 233 L395 212 L423 216 L456 202 L485 206 L514 189 L545 193 L577 175 L610 179 L640 167 L672 172 L700 154 L720 148";
const NO_PATH = "M0 84 L35 84 L68 80 L95 95 L126 90 L154 106 L180 101 L207 109 L238 115 L270 111 L300 128 L335 133 L366 127 L395 148 L423 144 L456 158 L485 154 L514 171 L545 167 L577 185 L610 181 L640 193 L672 188 L700 206 L720 212";

type Reading = { yes: number; no: number; phase: "risk" | "about" };

type GraphStoryPanelProps = {
  sample: AgentRun;
  progress: number;
  phaseProgress?: number;
  reducedMotion?: boolean;
  embedded?: boolean;
  onTryDemo?: () => void;
  actionVisible?: boolean;
};

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function readingForProgress(progress: number, phaseProgress = progress): Reading {
  const normalized = clamp(progress);
  const yes = Math.round(38 + normalized * 16);
  return {
    yes,
    no: 100 - yes,
    phase: clamp(phaseProgress) < 0.5 ? "risk" : "about",
  };
}

function revealPath(path: SVGPathElement | null, progress: number, length: number) {
  if (!path) return;
  path.setAttribute("stroke-dasharray", `${length * progress} ${length * 2}`);
  path.setAttribute("stroke-dashoffset", "0");
  path.style.opacity = progress > 0 ? "1" : "0";
}

export function GraphStoryPanel({
  sample,
  progress,
  phaseProgress = progress,
  reducedMotion = false,
  embedded = false,
  onTryDemo,
  actionVisible = true,
}: GraphStoryPanelProps) {
  const yesPath = useRef<SVGPathElement>(null);
  const noPath = useRef<SVGPathElement>(null);
  const forecast = sample.evaluated.find((item) => item.event.id === "demo-nfl-river-medium" && item.candidate.outcome === "Yes");
  const normalizedProgress = clamp(progress);
  const reading = readingForProgress(normalizedProgress, phaseProgress);

  useEffect(() => {
    const yesLength = yesPath.current?.getTotalLength() ?? 0;
    const noLength = noPath.current?.getTotalLength() ?? 0;
    revealPath(yesPath.current, normalizedProgress, yesLength);
    revealPath(noPath.current, normalizedProgress, noLength);
  }, [normalizedProgress]);

  if (!forecast) return null;

  return (
    <div className={`${styles.panel} ${embedded ? styles.embedded : ""}`} data-graph-panel data-story-progress={normalizedProgress.toFixed(3)}>
      <div className={styles.intro}><span>FORECAST VIEW</span></div>
      <div className={styles.visual}>
        <div className={styles.visualHeader}>
          <div className={styles.fixture}><span>01 / NFL</span><strong>Metro Wolves · Yes or No</strong></div>
          <div className={styles.readouts}>
            <div className={styles.yesValue}><span>YES · MODEL</span><strong>{reading.yes}%</strong></div>
            <div className={styles.noValue}><span>NO · MODEL</span><strong>{reading.no}%</strong></div>
          </div>
        </div>
        <div className={styles.visualBody}>
          <div className={styles.chart}>
            <div className={styles.axis} aria-hidden="true">{[70, 60, 50, 40, 30].map((tick) => <span key={tick} style={{ top: `${((20 + (70 - tick) * 8) / 360) * 100}%` }}>{tick}%</span>)}</div>
            <svg viewBox="0 0 720 360" preserveAspectRatio="none" role="img" aria-labelledby="forecast-title forecast-description">
              <title id="forecast-title">Yes and No probability paths for one football game</title>
              <desc id="forecast-description">Scrolling reveals two probability paths for one football game. The final model reading is 54% Yes and 46% No.</desc>
              <path ref={yesPath} className={styles.yesPath} d={YES_PATH} />
              <path ref={noPath} className={styles.noPath} d={NO_PATH} />
            </svg>
            <div className={styles.timeAxis} aria-hidden="true"><span>SCAN</span><span>REVIEW</span><span>FORECAST</span></div>
          </div>
        </div>
      </div>
      <div className={styles.information} aria-live="off">
        <div className={styles.phase} data-stage="risk" hidden={reading.phase !== "risk" && !reducedMotion}>
          <span className={styles.stageLabel}>01 / CHOOSE YOUR RISK LEVEL</span>
          <p>High risk allows lower-probability picks. Low risk asks for higher-probability picks.</p>
          <div className={styles.bands} aria-label="Probability bands"><div><span>HIGH</span><strong>15–39%</strong></div><div><span>MEDIUM</span><strong>40–59%</strong></div><div><span>LOW</span><strong>60–100%</strong></div></div>
          <small>Below 15%, it skips the pick.</small>
        </div>
        <div className={styles.phase} data-stage="about" hidden={reading.phase !== "about" && !reducedMotion}>
          <span className={styles.stageLabel}>02 / HOW IT WORKS</span>
          <p>Choose sports and a risk level. We check the games and show picks that fit—or skip them.</p>
          <div className={styles.workflow} aria-label="Agent workflow"><div><span>01 / PICK</span><strong>Sports + risk</strong></div><div><span>02 / CHECK</span><strong>Games</strong></div><div><span>03 / SHOW</span><strong>Picks or a pass</strong></div></div>
          <small>Review them yourself, or use auto-simulate.</small>
        </div>
      </div>
      {onTryDemo && <div className={styles.action} data-graph-action>
        <button className={styles.actionButton} type="button" onClick={onTryDemo} disabled={!actionVisible} tabIndex={actionVisible ? 0 : -1}>
          Try demo <span aria-hidden="true">↗</span>
        </button>
      </div>}
    </div>
  );
}

export default function GraphStory({ sample }: { sample: AgentRun }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const sticky = section?.querySelector<HTMLElement>("[data-graph-sticky]");
    if (!section || !sticky) return;
    if (reducedMotion) {
      const frame = window.requestAnimationFrame(() => setProgress(1));
      return () => window.cancelAnimationFrame(frame);
    }

    let frame = 0;
    let scheduled = false;
    const update = () => {
      scheduled = false;
      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      const stickyEnd = sectionTop + section.offsetHeight - sticky.offsetHeight;
      const travel = Math.max(1, Math.min(stickyEnd, document.documentElement.scrollHeight - window.innerHeight) - sectionTop);
      const next = clamp((window.scrollY - sectionTop) / travel);
      setProgress((current) => Math.abs(current - next) < 0.002 ? current : next);
    };
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      frame = window.requestAnimationFrame(update);
    };
    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(section);
    resizeObserver.observe(sticky);
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      resizeObserver.disconnect();
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [reducedMotion]);

  return <section className={styles.story} ref={sectionRef} id="agent-story" aria-label="Football probability forecast">
    <div className={styles.sticky} data-graph-sticky>
      <GraphStoryPanel sample={sample} progress={progress} reducedMotion={reducedMotion} />
    </div>
  </section>;
}
