"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AgentRun } from "@/lib/domain";
import styles from "./GraphStory.module.css";

const YES_PATH = "M0 313 L51 309 L90 317 L141 296 L175 283 L213 267 L268 244 L312 217 L350 202 L395 185 L437 166 L480 143 L519 123 L565 107 L604 98 L646 83 L691 76 L720 68";
const NO_PATH = "M0 118 L58 110 L92 119 L145 107 L174 155 L220 166 L270 174 L307 209 L349 222 L394 221 L433 246 L479 239 L520 270 L563 257 L603 291 L650 277 L694 324 L720 314";
const ENTRY_FRACTIONS = [0.2, 0.25, 0.25] as const;
const ENTRY_STEPS = [0.16, 0.38, 0.6, 0.82] as const;
const percent = (value: number) => `${Math.round(value * 100)}%`;
function moveDot(path: SVGPathElement | null, dot: SVGCircleElement | null, progress: number) {
  if (!path || !dot) return;
  const point = path.getPointAtLength(path.getTotalLength() * progress);
  dot.setAttribute("cx", `${point.x}`);
  dot.setAttribute("cy", `${point.y}`);
}

type Reading = { yes: number; no: number; count: number };

export default function GraphStory({ sample }: { sample: AgentRun }) {
  const sectionRef = useRef<HTMLElement>(null);
  const yesPath = useRef<SVGPathElement>(null);
  const noPath = useRef<SVGPathElement>(null);
  const yesDot = useRef<SVGCircleElement>(null);
  const noDot = useRef<SVGCircleElement>(null);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [reading, setReading] = useState<Reading>({ yes: 54, no: 46, count: ENTRY_STEPS.length });
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
    let frame = 0;
    let scheduled = false;
    const update = () => {
      scheduled = false;
      const rect = section.getBoundingClientRect();
      const travel = Math.max(1, section.offsetHeight - window.innerHeight);
      const progress = reducedMotion ? 1 : Math.max(0, Math.min(1, -rect.top / travel));
      section.style.setProperty("--draw", `${Math.max(0.02, progress)}`);
      moveDot(yesPath.current, yesDot.current, progress);
      moveDot(noPath.current, noDot.current, progress);
      const yes = Math.round(38 + ((forecast?.candidate.probability ?? 0.54) * 100 - 38) * progress);
      const count = !entries.length ? 0 : progress >= ENTRY_STEPS[3] ? 4 : progress >= ENTRY_STEPS[2] ? 3 : progress >= ENTRY_STEPS[1] ? 2 : progress >= ENTRY_STEPS[0] ? 1 : 0;
      const next = { yes, no: 100 - yes, count };
      if (next.yes !== currentReading.current.yes || next.no !== currentReading.current.no || next.count !== currentReading.current.count) {
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

  return <section className={styles.story} ref={sectionRef} id="signal-story" aria-label="Illustrative football forecast and risk levels">
    <div className={styles.sticky}>
      <div className={styles.intro}><span>ONE GAME / DEMO DATA</span><h2>Watch the signal take shape.</h2></div>
      <div className={styles.layout}>
        <aside className={styles.credits} aria-label="Illustrative virtual-credit entries">
          <span className={styles.micro}>VIRTUAL CREDITS</span>
          <div className={styles.entryList}>{entries.map((amount, index) => <div className={index < reading.count ? styles.entryActive : ""} aria-hidden={index >= reading.count} key={index}><small>0{index + 1}</small><strong>+${amount}</strong></div>)}</div>
          <p>Illustrative allocation, not earnings or a payout.</p>
        </aside>
        <div className={styles.chartArea}>
          <div className={styles.chartTop}><span>METRO WOLVES / NFL</span><span>SIMULATION ONLY</span></div>
          <div className={styles.chart}>
            <svg viewBox="0 0 720 420" preserveAspectRatio="none" role="img" aria-labelledby="signal-title signal-description">
              <title id="signal-title">Illustrative Yes and No probability paths for one demo football game</title>
              <desc id="signal-description">As the page scrolls, two jagged paths are revealed and illustrative percentages change. Only their final 54 and 46 percent values are the current demo forecast; the path is not a historical probability series.</desc>
              <path ref={yesPath} className={styles.yesPath} pathLength="1" d={YES_PATH} />
              <path ref={noPath} className={styles.noPath} pathLength="1" d={NO_PATH} />
              <circle ref={yesDot} className={styles.yesDot} cx="720" cy="68" r="7" />
              <circle ref={noDot} className={styles.noDot} cx="720" cy="314" r="7" />
            </svg>
            <div className={styles.yesValue}><span>YES · MODEL</span><strong>{reading.yes}%</strong></div>
            <div className={styles.noValue}><span>NO · MODEL</span><strong>{reading.no}%</strong></div>
          </div>
          <div className={styles.chartBottom}><span>{forecast.event.title.replace(/^DEMO DATA: /, "")}</span><span>FINAL DEMO FORECAST · {percent(forecast.candidate.probability)} YES</span></div>
        </div>
        <aside className={styles.explanation}>
          <span className={styles.micro}>WHAT THIS IS</span>
          <p>Pick your sports and risk. RØGUE filters demo forecasts, checks the evidence, and can abstain.</p>
          <div className={styles.bands} aria-label="Probability bands"><div><span>HIGH</span><strong>15–39%</strong></div><div><span>MEDIUM</span><strong>40–59%</strong></div><div><span>LOW</span><strong>60–100%</strong></div></div>
          <small>Under 15%: abstain. A band match alone does not guarantee inclusion.</small>
        </aside>
      </div>
      <p className={styles.disclosure}>SCROLL ILLUSTRATION · NOT LIVE ODDS, FORECAST HISTORY, CASH FLOW, OR REAL-MONEY EXECUTION. +$ MARKS SHOW VIRTUAL DEMO CREDITS ONLY.</p>
    </div>
  </section>;
}
