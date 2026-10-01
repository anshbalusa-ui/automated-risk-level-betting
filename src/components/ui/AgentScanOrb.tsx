"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./AgentScanOrb.module.css";

export type AgentScanOrbProps = {
  active: boolean;
  onComplete: () => void;
  scanned: number;
  relevant: number;
  included: number;
  abstained: number;
};

const SCAN_DURATION_MS = 780;

export default function AgentScanOrb({
  active,
  onComplete,
  scanned,
  relevant,
  included,
  abstained,
}: AgentScanOrbProps) {
  const [complete, setComplete] = useState(false);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    const finish = () => {
      if (cancelled || completedRef.current) return;
      completedRef.current = true;
      setComplete(true);
      onCompleteRef.current();
    };

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(finish, reduceMotion ? 0 : SCAN_DURATION_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div className={styles.backdrop}>
      <section
        className={styles.panel}
        aria-label={complete ? "Agent run complete" : "Opening your agent snapshot"}
      >
        <div className={styles.orbStage} aria-hidden="true">
          <div className={`${styles.orb} ${complete ? styles.orbComplete : ""}`}>
            <span className={styles.orbCore} />
            <span className={styles.orbRing} />
            <span className={styles.orbSweep} />
          </div>
          <span className={styles.stageRule} />
        </div>

        <div className={styles.copy} role="status" aria-live="polite" aria-atomic="true">
          <p className={styles.eyebrow}>{complete ? "SCAN COMPLETE" : "DEMO DATA · SCAN COMPLETE"}</p>
          <h1>Your snapshot is ready.</h1>
          <p className={styles.description}>
            The deterministic run evaluated your preferences and risk settings. Opening your workspace.
          </p>
        </div>

        <dl className={styles.counts} aria-label="Run summary">
          <div><dt>Scanned</dt><dd>{scanned}</dd></div>
          <div><dt>Relevant</dt><dd>{relevant}</dd></div>
          <div><dt>Included</dt><dd>{included}</dd></div>
          <div><dt>Abstained</dt><dd>{abstained}</dd></div>
        </dl>

        <p className={styles.footer}>DETERMINISTIC DEMO RUN</p>
      </section>
    </div>
  );
}
