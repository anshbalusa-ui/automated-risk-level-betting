"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AgentRun } from "@/lib/domain";
import styles from "./GraphStory.module.css";

const YES_PATH = "M0 276 L35 276 L68 280 L95 265 L126 270 L154 254 L180 259 L207 251 L238 245 L270 249 L300 232 L335 227 L366 233 L395 212 L423 216 L456 202 L485 206 L514 189 L545 193 L577 175 L610 179 L640 167 L672 172 L700 154 L720 148";
const NO_PATH = "M0 84 L35 84 L68 80 L95 95 L126 90 L154 106 L180 101 L207 109 L238 115 L270 111 L300 128 L335 133 L366 127 L395 148 L423 144 L456 158 L485 154 L514 171 L545 167 L577 185 L610 181 L640 193 L672 188 L700 206 L720 212";
const ENTRY_FRACTIONS = [0.2, 0.25, 0.25] as const;
const ENTRY_STEPS = [0.16, 0.38, 0.6, 0.82] as const;
function revealPath(path: SVGPathElement | null, progress: number, length: number) {
  if (!path) return null;
  path.style.strokeDasharray = `${Math.max(0.02, length * progress)} ${length}`;
  return path.getPointAtLength(length * progress);
}

type Reading = { yes: number; no: number; count: number; phase: "risk" | "about" };

export default function GraphStory({ sample }: { sample: AgentRun }) {
  const sectionRef = useRef<HTMLElement>(null);
  const yesPath = useRef<SVGPathElement>(null);
  const noPath = useRef<SVGPathElement>(null);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [reading, setReading] = useState<Reading>({ yes: 54, no: 46, count: ENTRY_STEPS.length, phase: "risk" });
  const currentReading = useRef(reading);
  const forecast = sample.evaluated.find((item) => item.event.id === "demo-nfl-river-medium" && item.candidate.outcome === "Yes");
  const position = sample.positions.find((item) => item.candidateId === forecast?.candidate.id);
  const entries = useMemo(() => {
    if (!position) return [];
    const total = Math.round(position.virtualAllocation * 10);
    const first = ENTRY_FRACTIONS.map((fraction) => Math.round(total * fraction));
    return [...first, total - first.reduce((sum, amount) => sum + amount, 0)].map((amount) => (amount / 10).toFixed(1));
  }, [position]);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const yesLength = yesPath.current?.getTotalLength() ?? 0;
    const noLength = noPath.current?.getTotalLength() ?? 0;
    let frame = 0;
    let scheduled = false;
    const update = () => {
      scheduled = false;
      const rect = section.getBoundingClientRect();
      const travel = Math.max(1, section.offsetHeight - window.innerHeight);
      const progress = reducedMotion ? 1 : Math.max(0, Math.min(1, -rect.top / travel));
      const point = revealPath(yesPath.current, progress, yesLength);
      revealPath(noPath.current, progress, noLength);
      const yes = point ? Math.round(70 - (point.y - 20) / 8) : Math.round((forecast?.candidate.probability ?? 0.54) * 100);
      const count = !entries.length ? 0 : progress >= ENTRY_STEPS[3] ? 4 : progress >= ENTRY_STEPS[2] ? 3 : progress >= ENTRY_STEPS[1] ? 2 : progress >= ENTRY_STEPS[0] ? 1 : 0;
      const next: Reading = { yes, no: 100 - yes, count, phase: progress < 0.5 ? "risk" : "about" };
      if (next.yes !== currentReading.current.yes || next.no !== currentReading.current.no || next.count !== currentReading.current.count || next.phase !== currentReading.current.phase) {
        currentReading.current = next;
        setReading(next);
      }
    };
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      frame = window.requestAnimationFrame(update);
    };
    schedule();
    if (!reducedMotion) {
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule);
    }
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [entries.length, forecast?.candidate.probability, reducedMotion]);

  if (!forecast) return null;

  return <section className={styles.story} ref={sectionRef} id="signal-story" aria-label="Illustrative football forecast and agent overview">
    <div className={styles.sticky}>
      <div className={styles.intro}><span>ONE GAME / DEMO DATA</span></div>
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
            <svg viewBox="0 0 720 360" preserveAspectRatio="none" role="img" aria-labelledby="signal-title signal-description">
              <title id="signal-title">Illustrative Yes and No probability paths for one demo football game</title>
              <desc id="signal-description">Scrolling reveals two lines for a demo game. Values along the way are part of this illustration. The final 54% and 46% are the demo model&apos;s forecast, not a record of past odds.</desc>
              <g className={styles.gridLines} aria-hidden="true">{[20, 100, 180, 260, 340].map((y) => <line key={y} x1="0" y1={y} x2="720" y2={y} />)}</g>
              <path ref={yesPath} className={styles.yesPath} d={YES_PATH} />
              <path ref={noPath} className={styles.noPath} d={NO_PATH} />
            </svg>
            <div className={styles.timeAxis} aria-hidden="true"><span>SCAN</span><span>REVIEW</span><span>FORECAST</span></div>
          </div>
          <aside className={styles.credits} aria-label="Illustrative virtual-credit entries">
            <span className={styles.micro}>VIRTUAL CREDITS</span>
            <div className={styles.entryList}>{entries.map((amount, index) => <div className={index < reading.count ? styles.entryActive : ""} aria-hidden={index >= reading.count} key={index}><small>0{index + 1}</small><strong>+${amount}</strong></div>)}</div>
            <p>Demo credits, not winnings.</p>
          </aside>
        </div>
        <div className={styles.visualFooter}><span>ONE DEMO GAME · {forecast.candidate.riskBand.toUpperCase()} RISK</span><span>SIMULATION ONLY</span></div>
      </div>
      <div className={styles.information} aria-live="off">
        <div className={styles.phase} data-stage="risk" hidden={reading.phase !== "risk" && !reducedMotion}>
          <span className={styles.stageLabel}>01 / CHOOSE YOUR RISK LEVEL</span>
          <p>Choose your risk level. High risk level is lower probability and low risk is higher probability to happen.</p>
          <div className={styles.bands} aria-label="Probability bands"><div><span>HIGH</span><strong>15–39%</strong></div><div><span>MEDIUM</span><strong>40–59%</strong></div><div><span>LOW</span><strong>60–100%</strong></div></div>
          <small>Below 15%, the agent skips the pick.</small>
        </div>
        <div className={styles.phase} data-stage="about" hidden={reading.phase !== "about" && !reducedMotion}>
          <span className={styles.stageLabel}>02 / HOW IT WORKS</span>
          <p>Tell RØGUE what you follow and the risk you&apos;re okay with. It checks the demo games and shows picks that fit—or skips them.</p>
          <div className={styles.workflow} aria-label="Agent workflow"><div><span>01 / PICK</span><strong>Sports + risk</strong></div><div><span>02 / CHECK</span><strong>Demo games</strong></div><div><span>03 / SHOW</span><strong>Picks or a pass</strong></div></div>
          <small>Review the picks yourself, or let the demo simulate them with virtual credits.</small>
        </div>
      </div>
      <p className={styles.disclosure}>ILLUSTRATION ONLY · LINES ARE NOT PAST FORECASTS · +$ SHOWS VIRTUAL CREDITS, NOT EARNINGS.</p>
    </div>
  </section>;
}
