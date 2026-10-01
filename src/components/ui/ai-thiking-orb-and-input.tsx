"use client";

import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import type { AgentRun } from "@/lib/domain";
import styles from "./ai-thiking-orb-and-input.module.css";

export type MorphOrbProps = {
  initialInterests: string;
  run: AgentRun | null;
  onSubmit: (text: string) => void;
  onOpen: () => void;
};

type Phase = "input" | "launch" | "orb" | "ready";
const MORPH_MS = 700;
const DOTS = Array.from({ length: 180 }, (_, index) => {
  const y = 1 - (index / 179) * 2;
  const radius = Math.sqrt(1 - y * y);
  const angle = Math.PI * (3 - Math.sqrt(5)) * index;
  return {
    x: 100 + Math.cos(angle) * radius * 82,
    y: 100 + y * 82,
    delay: `${(index % 17) * 18}ms`,
    opacity: 0.32 + ((index * 13) % 67) / 100,
  };
});

export default function MorphOrb({ initialInterests, run, onSubmit, onOpen }: MorphOrbProps) {
  const [interests, setInterests] = useState(initialInterests);
  const [phase, setPhase] = useState<Phase>("input");
  const [submitted, setSubmitted] = useState(false);
  const [beforeRunId, setBeforeRunId] = useState<string | null>(null);
  const submitFrame = useRef(0);
  const openRef = useRef<HTMLButtonElement>(null);
  const pendingRun = submitted && (!run || run.id === beforeRunId);

  useEffect(() => {
    if (!submitted || !run || run.id === beforeRunId) return;
    const frame = window.requestAnimationFrame(() => setPhase((current) => current === "launch" ? current : "ready"));
    return () => window.cancelAnimationFrame(frame);
  }, [run, submitted, beforeRunId]);

  useEffect(() => {
    if (phase !== "launch") return;
    const timer = window.setTimeout(() => setPhase((current) => current === "launch" ? (pendingRun ? "orb" : "ready") : current), MORPH_MS);
    return () => window.clearTimeout(timer);
  }, [phase, pendingRun]);

  useEffect(() => () => window.cancelAnimationFrame(submitFrame.current), []);

  useEffect(() => {
    if (phase === "ready") openRef.current?.focus({ preventScroll: true });
  }, [phase]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitted) return;
    setBeforeRunId(run?.id ?? null);
    setSubmitted(true);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setPhase(reduceMotion ? "orb" : "launch");
    const value = interests;
    submitFrame.current = window.requestAnimationFrame(() => {
      submitFrame.current = window.requestAnimationFrame(() => onSubmit(value));
    });
  }

  const hasSummary = Boolean(run && submitted && run.id !== beforeRunId);
  const showingReady = hasSummary && phase === "ready";
  const label = showingReady ? "Snapshot ready" : pendingRun ? "Scanning demo events" : "Snapshot ready";

  return (
    <section className={styles.root} aria-label="Set interests and start your agent">
      {phase === "input" ? (
        <form className={styles.form} onSubmit={submit}>
          <label className={styles.inputLabel} htmlFor="morph-interests">What should your agent follow?</label>
          <div className={styles.inputPill}>
            <svg className={styles.spark} width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><circle cx="4" cy="10" r="2" /><circle cx="10" cy="5" r="2" /><circle cx="16" cy="10" r="2" /><circle cx="10" cy="15" r="2" /></svg>
            <input
              id="morph-interests"
              className={styles.input}
              value={interests}
              onChange={(event) => setInterests(event.target.value)}
              placeholder="NBA, Warriors, San Francisco"
              autoComplete="off"
              aria-describedby="morph-hint"
            />
            <button className={styles.submit} type="submit">Start agent <span aria-hidden="true">↗</span></button>
          </div>
          <p className={styles.hint} id="morph-hint">Separate interests with commas. Your demo agent only simulates decisions.</p>
        </form>
      ) : (
        <div className={`${styles.experience} ${phase === "launch" ? styles.launch : ""} ${phase === "ready" ? styles.ready : ""}`}>
          {phase === "launch" && <span className={styles.launchSeed} aria-hidden="true">INTERESTS CAPTURED</span>}
          <div className={styles.orbStage} aria-hidden="true">
            <svg className={styles.orb} viewBox="0 0 200 200" role="presentation">
              {DOTS.map((dot, index) => (
                <circle key={index} cx={dot.x} cy={dot.y} r={index % 11 === 0 ? 1.5 : 1.05} fill="currentColor" style={{ "--dot-delay": dot.delay, "--dot-opacity": dot.opacity } as CSSProperties} />
              ))}
            </svg>
            <span className={styles.orbHalo} />
          </div>
          {showingReady ? (
            <div className={styles.summary} aria-live="polite">
              <div className={styles.summaryTop}><span className={styles.statusDot} /> Snapshot ready <span className={styles.demoTag}>DEMO RUN</span></div>
              <h2>Your snapshot is ready.</h2>
              <p className={styles.summaryCopy}>A deterministic run evaluated your interests and risk settings. No real positions were placed.</p>
              <dl className={styles.counts} aria-label="Run summary">
                <div><dt>Scanned</dt><dd>{run?.activity.scanned ?? 0}</dd></div>
                <div><dt>Relevant</dt><dd>{run?.activity.relevant ?? 0}</dd></div>
                <div><dt>Included</dt><dd>{run?.activity.included ?? 0}</dd></div>
                <div><dt>Abstained</dt><dd>{run?.activity.abstained ?? 0}</dd></div>
              </dl>
              <button ref={openRef} className={styles.open} type="button" onClick={onOpen}>Open workspace <span aria-hidden="true">↗</span></button>
            </div>
          ) : (
            <div className={styles.scanning} role="status" aria-live="polite">
              <span className={styles.statusDot} />
              <span>{label}</span>
              <span className={styles.interestLine}>{interests.split(",").map((item) => item.trim()).filter(Boolean).join(" · ")}</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
