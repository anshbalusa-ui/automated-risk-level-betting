"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AgentRun, EvaluatedCandidate } from "@/lib/domain";
import styles from "./GraphStory.module.css";

type StoryPoint = { item: EvaluatedCandidate; allocation: number | null };
const STAGE_COUNT = 5;
const percent = (value: number) => `${Math.round(value * 100)}%`;
const credits = (value: number) => `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value)} virtual credits`;

function makeStory(sample: AgentRun): StoryPoint[] {
  // Each phase shows a different evaluated DEMO candidate, not a fluctuating forecast.
  const chosenEvents = [
    "demo-nba-warriors-close",
    "demo-nba-north",
    "demo-nhl-ice-medium",
    "demo-nba-warriors-uncertain",
    "demo-nba-warriors-close",
  ];
  const upcoming = sample.evaluated.filter((item) =>
    item.event.metadata.historical !== true && item.candidate.outcome === "Yes");
  return chosenEvents.map((id, index) => {
    const item = upcoming.find((candidate) => candidate.event.id === id) ?? upcoming[index % upcoming.length];
    if (!item) return null;
    const allocation = sample.positions.find((position) => position.candidateId === item.candidate.id)?.virtualAllocation ?? null;
    return { item, allocation };
  }).filter((point): point is StoryPoint => point !== null);
}

const CURVES = [
  { blue: "M0 118 L58 110 L92 119 L145 107 L174 155 L220 166 L270 174 L307 209 L349 222 L394 221 L433 246 L479 239 L520 270 L563 257 L603 291 L650 277 L694 324 L720 314", lilac: "M0 313 L51 309 L90 317 L141 296 L175 283 L213 267 L268 244 L312 217 L350 202 L395 185 L437 166 L480 143 L519 123 L565 107 L604 98 L646 83 L691 76 L720 68" },
  { blue: "M0 127 L42 120 L76 129 L108 121 L144 146 L180 145 L217 180 L248 166 L284 193 L316 213 L349 205 L383 242 L419 228 L453 249 L485 268 L524 254 L560 287 L595 276 L630 304 L671 292 L704 335 L720 329", lilac: "M0 306 L41 317 L80 305 L111 313 L149 281 L181 299 L213 260 L254 279 L289 237 L322 254 L354 214 L385 197 L421 206 L459 156 L495 177 L523 134 L563 127 L598 103 L632 111 L668 80 L699 85 L720 70" },
  { blue: "M0 103 L47 112 L88 104 L126 122 L162 115 L199 162 L232 151 L267 177 L305 190 L344 178 L383 222 L417 215 L454 243 L487 228 L529 269 L559 281 L591 262 L627 304 L664 295 L698 336 L720 328", lilac: "M0 322 L39 314 L78 326 L118 307 L157 320 L196 277 L234 284 L271 250 L307 258 L340 222 L381 235 L415 186 L451 192 L487 152 L524 167 L557 127 L596 139 L628 99 L666 105 L695 72 L720 64" },
  { blue: "M0 123 L42 119 L83 131 L119 117 L161 136 L193 146 L233 181 L269 176 L311 207 L343 204 L380 245 L418 232 L454 264 L489 243 L528 275 L561 288 L598 279 L637 321 L670 301 L705 345 L720 335", lilac: "M0 305 L39 312 L80 293 L120 310 L159 289 L197 300 L233 264 L273 278 L311 243 L350 254 L384 207 L418 215 L456 178 L490 193 L526 149 L560 154 L595 119 L631 135 L667 95 L698 104 L720 80" },
  { blue: "M0 111 L36 117 L70 109 L106 126 L141 113 L178 157 L214 166 L249 171 L284 192 L318 211 L351 207 L390 239 L424 226 L459 244 L496 260 L531 271 L570 287 L606 278 L645 307 L682 297 L720 325", lilac: "M0 320 L40 308 L75 318 L111 303 L149 296 L185 276 L222 283 L258 248 L295 255 L332 216 L367 229 L402 191 L437 199 L472 154 L508 169 L542 127 L577 141 L613 105 L651 115 L688 78 L720 70" },
] as const;
const BLUE_ENDS = [314, 329, 328, 335, 325] as const;
const LILAC_ENDS = [68, 70, 64, 80, 70] as const;

const reduceMotionQuery = "(prefers-reduced-motion: reduce)";

export default function GraphStory({ sample }: { sample: AgentRun }) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef(STAGE_COUNT - 1);
  const [stage, setStage] = useState(STAGE_COUNT - 1);
  const [reducedMotion, setReducedMotion] = useState(true);
  const points = useMemo(() => makeStory(sample), [sample]);

  useEffect(() => {
    const motion = window.matchMedia(reduceMotionQuery);
    const updateMotion = () => setReducedMotion(motion.matches);
    updateMotion();
    motion.addEventListener("change", updateMotion);
    return () => motion.removeEventListener("change", updateMotion);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      if (stageRef.current !== STAGE_COUNT - 1) {
        stageRef.current = STAGE_COUNT - 1;
        setStage(STAGE_COUNT - 1);
      }
      return;
    }
    const section = sectionRef.current;
    if (!section) return;
    let frame = 0;
    let scheduled = false;
    const update = () => {
      scheduled = false;
      const rect = section.getBoundingClientRect();
      const travel = Math.max(1, section.offsetHeight - window.innerHeight);
      const progress = Math.max(0, Math.min(1, -rect.top / travel));
      section.style.setProperty("--story-progress", `${Math.min(1, 0.2 + progress * 4)}`);
      const nextStage = Math.min(STAGE_COUNT - 1, Math.floor(progress * STAGE_COUNT));
      if (nextStage !== stageRef.current) {
        stageRef.current = nextStage;
        setStage(nextStage);
      }
    };
    const requestUpdate = () => {
      if (scheduled) return;
      scheduled = true;
      frame = window.requestAnimationFrame(update);
    };
    requestUpdate();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, [reducedMotion]);

  if (points.length === 0) {
    return <section className={styles.story} id="signal-story" aria-label="How forecasts are evaluated"><div className={styles.empty}>No demo candidates are available in this run.</div></section>;
  }

  const active = points[stage % points.length];
  const other = sample.evaluated.find((item) =>
    item.event.id === active.item.event.id && item.candidate.outcome !== active.item.candidate.outcome) ?? active.item;
  const activeEvent = active.item.event;
  const allocationCopy = active.allocation === null ? "No position" : credits(active.allocation);
  const interestCopy = sample.preferences.interests.length ? sample.preferences.interests.join(", ") : "all interests";
  const stageDetails = [
    { title: "Start with what matters", text: `The run filters ${sample.preferences.categories.join(" and ")} forecasts against ${interestCopy}. Only matching inputs enter this pass.` },
    { title: "A forecast meets a reference", text: "RØGUE compares each model probability with a reference captured before the event. A gap is useful context, not proof." },
    { title: "Uncertainty changes the call", text: "Your selected risk band narrows the candidates. Uncertainty and data quality still affect what makes the cut." },
    { title: "Evidence can mean abstaining", text: `${activeEvent.title.replace(/^DEMO DATA: /, "")} is marked ${active.item.decision.decision}. An abstention is an intentional decision, never a position.` },
    { title: "Allocation stays virtual", text: `Only included outcomes can receive virtual credits. This demo candidate has ${allocationCopy}; outcomes later resolve in the simulation ledger.` },
  ];
  const detail = stageDetails[stage];
  const activeDecision = active.item.decision.decision;
  const lineProgress = reducedMotion ? 1 : undefined;

  return (
    <section ref={sectionRef} className={styles.story} id="signal-story" aria-label="A forecast, from input to virtual allocation">
      <div className={styles.sticky}>
        <div className={styles.layout}>
          <aside className={`${styles.copy} ${styles.left}`} aria-label="Forecast workflow">
            <span className={styles.kicker}>A signal, with its limits</span>
            <h2>{detail.title}</h2>
            <p>{detail.text}</p>
            <div className={styles.stepList} aria-label={`Stage ${stage + 1} of ${STAGE_COUNT}`}>
              {stageDetails.map((step, index) => <span key={step.title} className={index === stage ? styles.currentStep : ""}><i>{String(index + 1).padStart(2, "0")}</i>{step.title}</span>)}
            </div>
          </aside>

          <div className={styles.chartColumn}>
            <div className={styles.chartHead}><span>DEMO RUN · {sample.sourceLabel}</span><span>ILLUSTRATIVE PATHS</span></div>
            <div className={styles.chart}>
              <svg className={styles.svg} viewBox="0 0 720 420" role="img" aria-labelledby="graph-title graph-description" preserveAspectRatio="none">
                <title id="graph-title">Illustrative probability paths with current demo candidate values</title>
                <desc id="graph-description">Two jagged paths cross and diverge. Their geometric paths are decorative, not historical data. Endpoint percentages are the actual model probabilities for the labeled demo candidates.</desc>
                {CURVES.map((curve, index) => <g key={index} className={`${styles.curvePhase} ${index === stage ? styles.curveActive : ""}`} aria-hidden="true">
                  <path className={styles.pathBlue} pathLength="1" style={lineProgress === undefined ? undefined : { strokeDasharray: `${lineProgress} 1` }} d={curve.blue} />
                  <path className={styles.pathLilac} pathLength="1" style={lineProgress === undefined ? undefined : { strokeDasharray: `${lineProgress} 1` }} d={curve.lilac} />
                  <circle className={styles.blueDot} cx="720" cy={BLUE_ENDS[index]} r="6" />
                  <circle className={styles.lilacDot} cx="720" cy={LILAC_ENDS[index]} r="6" />
                </g>)}
              </svg>
              <div className={`${styles.endpoint} ${styles.endpointLilac}`}><span>{active.item.candidate.outcome} · {activeEvent.interests[0]}</span><strong>{percent(active.item.candidate.probability)}</strong><small>model probability</small></div>
              <div className={`${styles.endpoint} ${styles.endpointBlue}`}><span>{other.candidate.outcome} · {activeEvent.interests[0]}</span><strong>{percent(other.candidate.probability)}</strong><small>model probability</small></div>
              <div className={styles.pathNote}>Line shape is a non-historical demo illustration</div>
              <div className={styles.reading}>
                <div><span className={styles.eventName}>{activeEvent.title}</span><span className={styles.mobileLabel}>MODEL</span><strong>{percent(active.item.candidate.probability)}</strong><small>model · {active.item.candidate.outcome}</small></div>
                <div><span className={styles.eventName}>{active.item.reference ? `Reference · ${active.item.reference.provider}` : "Reference · unavailable"}</span><span className={styles.mobileLabel}>REFERENCE</span><strong>{active.item.reference ? percent(active.item.reference.probability) : "—"}</strong><small>{active.item.reference ? "captured before event" : "no comparable reference"}</small></div>
                <div><span>POLICY</span><strong className={activeDecision === "include" ? styles.include : styles.abstain}>{activeDecision}</strong><small>{active.item.decision.profile} risk profile</small></div>
              </div>
            </div>
            <div className={styles.chartFoot}><span>{String(stage + 1).padStart(2, "0")} / 05 · {activeEvent.category.toUpperCase()}</span><span>Virtual ledger · {allocationCopy}</span></div>
          </div>

          <aside className={`${styles.copy} ${styles.right}`} aria-label="Forecast details">
            <span className={styles.kicker}>From estimate to decision</span>
            <h3>{activeEvent.title}</h3>
            <p>{activeEvent.description}</p>
            <dl className={styles.facts}>
              <div><dt>Model</dt><dd>{percent(active.item.candidate.probability)}</dd></div>
              <div><dt>Reference</dt><dd>{active.item.reference ? percent(active.item.reference.probability) : "Unavailable"}</dd></div>
              <div><dt>Uncertainty</dt><dd>{percent(active.item.candidate.uncertainty)}</dd></div>
              <div><dt>Decision</dt><dd>{activeDecision}</dd></div>
              <div><dt>Virtual allocation</dt><dd>{allocationCopy}</dd></div>
            </dl>
            <p className={styles.policyNote}>Two outcomes for the same fictional matchup. The paths illustrate evaluation, not observed probability history.</p>
          </aside>
        </div>
      </div>
    </section>
  );
}
