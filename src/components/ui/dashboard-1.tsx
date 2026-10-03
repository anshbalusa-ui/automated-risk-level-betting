"use client";

import { ArrowRight, CircleAlert, Clock3, Filter, Gauge, ScanLine, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import styles from "./dashboard-1.module.css";

export interface SignalActivity {
  scanned: number;
  relevant: number;
  bandMatched: number;
  included: number;
  abstained: number;
}

export interface SignalForecast {
  id: string;
  href: string;
  category: string;
  title: string;
  outcome: string;
  probability: number;
  referenceProbability: number | undefined;
  probabilityGap: number | undefined;
  uncertainty: number;
  decision: "include" | "abstain";
}

export interface ForecastDashboardProps {
  title?: string;
  subtitle: string;
  activity: SignalActivity;
  forecasts: SignalForecast[];
  cta: {
    text: string;
    buttonText: string;
    onButtonClick: () => void;
  };
  onFilterClick?: () => void;
  className?: string;
}

const percent = (value: number | undefined) => typeof value === "number" ? `${Math.round(value * 100)}%` : "—";
const gap = (value: number | undefined) => value === undefined ? "—" : `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)} pts`;


export function ForecastDashboard({
  title = "Signal board",
  subtitle,
  activity,
  forecasts,
  cta,
  onFilterClick,
  className,
}: ForecastDashboardProps) {
  const scanRate = activity.scanned ? Math.round((activity.included / activity.scanned) * 100) : 0;
  const abstentionRate = activity.scanned ? Math.round((activity.abstained / activity.scanned) * 100) : 0;

  return (
    <section
      className={cn(styles.dashboard, className)}
      aria-label="Forecast intelligence dashboard"
    >
      <header className={styles.header}>
        <div>
          <span className={styles.kicker}>LIVE DEMO / SIGNAL BOARD</span>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <Button variant="ghost" size="icon" className={styles.filterButton} onClick={onFilterClick} aria-label="Open forecast register">
          <Filter aria-hidden="true" />
        </Button>
      </header>

      <div className={styles.overviewGrid}>
        <div>
          <Card className={cn(styles.card, styles.scanCard)}>
            <CardContent>
              <div className={styles.cardTopline}>
                <span><ScanLine aria-hidden="true" /> Agent scan</span>
                <small>SNAPSHOT READY</small>
              </div>
              <div className={styles.scanValue}>
                <strong>{activity.scanned}</strong>
                <span>events checked against your profile</span>
              </div>
              <div className={styles.scanBar} aria-label={`${scanRate}% of scanned events were included`}>
                <i style={{ width: `${scanRate}%` }} />
                <b style={{ width: `${100 - scanRate}%` }} />
              </div>
              <div className={styles.scanLegend}>
                <span><i className={styles.legendIncluded} /> {activity.included} included</span>
                <span><i className={styles.legendSkipped} /> {activity.abstained} abstained</span>
              </div>
              <div className={styles.flow}>
                <span><b>{activity.relevant}</b> relevant</span>
                <span><b>{activity.bandMatched}</b> band match</span>
                <span><b>{abstentionRate}%</b> held back</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className={styles.metricGrid}>
          <div>
            <Card className={cn(styles.card, styles.metricCard)}>
              <CardContent>
                <div className={styles.metricLabel}><Gauge aria-hidden="true" /> Risk profile</div>
                <strong>Configured</strong>
                <span>Evidence gates stay active</span>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card className={cn(styles.card, styles.metricCard, styles.metricCardAccent)}>
              <CardContent>
                <div className={styles.metricLabel}><ShieldCheck aria-hidden="true" /> Policy</div>
                <strong>{activity.included} included</strong>
                <span>Only decisions that pass</span>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card className={cn(styles.card, styles.metricCard)}>
              <CardContent>
                <div className={styles.metricLabel}><CircleAlert aria-hidden="true" /> Uncertainty</div>
                <strong>{activity.abstained} held back</strong>
                <span>Insufficient evidence is a result</span>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card className={cn(styles.card, styles.metricCard)}>
              <CardContent>
                <div className={styles.metricLabel}><Clock3 aria-hidden="true" /> Run state</div>
                <strong>Ready</strong>
                <span>Deterministic demo snapshot</span>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className={styles.signals}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.kicker}>CURRENT SIGNALS</span>
            <h3>What the agent found</h3>
          </div>
          <span className={styles.sectionMeta}>{forecasts.length} surfaced</span>
        </div>
        <div className={styles.signalList}>
          {forecasts.length ? forecasts.map((forecast, index) => (
            <a className={styles.signalRow} href={forecast.href} key={forecast.id}>
              <span className={styles.signalIndex}>{String(index + 1).padStart(2, "0")}</span>
              <span className={styles.signalMain}>
                <b>{forecast.title}</b>
                <small>{forecast.category} · {forecast.outcome}</small>
              </span>
              <span className={styles.signalStat}><b>{percent(forecast.probability)}</b><small>model</small></span>
              <span className={styles.signalStat}><b>{percent(forecast.referenceProbability)}</b><small>reference</small></span>
              <span className={styles.signalStat}><b>{gap(forecast.probabilityGap)}</b><small>gap</small></span>
              <span className={cn(styles.signalDecision, forecast.decision === "include" ? styles.included : styles.abstained)}>
                <i /> {forecast.decision === "include" ? "Included" : "Abstained"}
              </span>
              <ArrowRight className={styles.rowArrow} aria-hidden="true" />
            </a>
          )) : <p className={styles.empty}>No upcoming signals match this setup.</p>}
        </div>
      </div>

      <div className={styles.cta}>
        <div>
          <span className={styles.kicker}>NEXT MOVE</span>
          <strong>{cta.text}</strong>
        </div>
        <Button onClick={cta.onButtonClick} className={styles.ctaButton}>{cta.buttonText}<ArrowRight aria-hidden="true" /></Button>
      </div>
    </section>
  );
}
