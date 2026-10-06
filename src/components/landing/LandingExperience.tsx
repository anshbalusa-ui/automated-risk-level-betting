"use client";

import Link from "next/link";
import { defaultPreferences, runAgent } from "@/lib/agent";

const sample = runAgent(defaultPreferences, new Date("2026-10-02T12:00:00Z"));
const featured = sample.evaluated.find((entry) => entry.decision.decision === "include") ?? sample.evaluated[0];

const percent = (value: number | undefined) => typeof value === "number" ? `${Math.round(value * 100)}%` : "—";
const gap = featured?.candidate.probabilityGap;
const cleanTitle = featured?.event.title.replace(/^DEMO DATA:\s*/i, "") ?? "A deterministic sports forecast";

function PixelMark() {
  return <span className="landing-bitload-mark" aria-hidden="true"><span>R</span></span>;
}

function Bar({ label, value, tone = "ink" }: { label: string; value: number; tone?: "ink" | "muted" }) {
  return <div className="bitload-bar-row">
    <span>{label}</span>
    <span className={`bitload-bar-track bitload-bar-${tone}`}><i style={{ width: `${Math.max(4, Math.round(value * 100))}%` }} /></span>
    <strong>{percent(value)}</strong>
  </div>;
}

export default function LandingExperience() {
  return <div className="landing-bitload">
    <header className="landing-bitload-nav">
      <Link href="/" className="landing-bitload-brand" aria-label="RØGUE home">
        <PixelMark />
        <span>RØGUE <small>/ FORECAST STUDIO</small></span>
      </Link>
      <nav aria-label="Main navigation">
        <a href="#how-it-works">How it works</a>
        <a href="#risk-bands">Risk bands</a>
        <Link href="/forecasts">Open workspace</Link>
      </nav>
      <Link href="/onboarding" className="bitload-nav-cta">TRY DEMO <span aria-hidden="true">↗</span></Link>
    </header>

    <main>
      <section className="landing-bitload-hero">
        <div className="landing-bitload-copy">
          <p className="bitload-kicker"><span /> SIMULATION ONLY · VIRTUAL CREDITS</p>
          <h1>Set your risk.<br /><em>Find the signal.</em></h1>
          <p className="bitload-lede">Tell the agent what you follow and how much uncertainty you can tolerate. It checks the slate, shows its evidence, and knows when to pass.</p>
          <div className="bitload-hero-actions">
            <Link href="/onboarding" className="bitload-button bitload-button-dark">Try the demo <span aria-hidden="true">↗</span></Link>
            <a href="#how-it-works" className="bitload-text-link">See how it works <span aria-hidden="true">↓</span></a>
          </div>
          <p className="bitload-disclaimer">No account. No payments. No real-money execution.</p>
        </div>

        <div className="bitload-preview-wrap">
          <div className="bitload-preview-label">LIVE DEMO READOUT / 001</div>
          <article className="bitload-preview" aria-label="Forecast preview">
            <div className="bitload-preview-header">
              <div><span className="bitload-micro">RØGUE / FORECAST</span><strong>{cleanTitle}</strong></div>
              <span className="bitload-status">INCLUDED</span>
            </div>
            <div className="bitload-preview-rule" />
            <div className="bitload-preview-metrics">
              <div><span>MODEL</span><strong>{percent(featured?.candidate.probability)}</strong></div>
              <div><span>REFERENCE</span><strong>{percent(featured?.candidate.referenceProbability)}</strong></div>
              <div><span>GAP</span><strong>{gap === undefined ? "—" : `${gap >= 0 ? "+" : ""}${Math.round(gap * 100)} pts`}</strong></div>
            </div>
            <div className="bitload-preview-chart" aria-label="Model and reference probability bars">
              <Bar label="MODEL" value={featured?.candidate.probability ?? 0} />
              <Bar label="REF" value={featured?.candidate.referenceProbability ?? 0} tone="muted" />
            </div>
            <div className="bitload-preview-footer">
              <span>RISK / {featured?.candidate.riskBand.replace("_", " ").toUpperCase() ?? "MEDIUM"}</span>
              <span>UNCERTAINTY / {percent(featured?.forecast.uncertainty)}</span>
              <span>DECISION / INCLUDED</span>
            </div>
          </article>
          <span className="bitload-preview-stamp">DEMO DATA</span>
        </div>
      </section>

      <section className="bitload-strip" aria-label="Product principles">
        <span>01 / PERSONALIZE</span><i /><span>02 / PROBABILITY</span><i /><span>03 / UNCERTAINTY</span><i /><span>04 / ABSTAIN</span>
      </section>

      <section className="bitload-section" id="how-it-works">
        <div className="bitload-section-heading">
          <p className="bitload-kicker"><span /> THE LOOP</p>
          <h2>A clearer way to<br /><em>make a call.</em></h2>
          <p>Every forecast is a small, inspectable record. No black box theater. No forced answer when the evidence is thin.</p>
        </div>
        <div className="bitload-step-grid">
          {[
            ["01", "Choose your lens", "Pick sports, interests, and the risk band that matches your tolerance."],
            ["02", "Read the signal", "Compare model probability with a reference, the gap, uncertainty, and evidence."],
            ["03", "Review or simulate", "Add an included outcome to your virtual portfolio—or let the agent abstain."],
          ].map(([number, title, text]) => <article className="bitload-step" key={number}>
            <span className="bitload-step-number">{number}</span>
            <h3>{title}</h3>
            <p>{text}</p>
            <span className="bitload-step-arrow" aria-hidden="true">↘</span>
          </article>)}
        </div>
      </section>

      <section className="bitload-section bitload-risk-section" id="risk-bands">
        <div className="bitload-section-heading bitload-section-heading-wide">
          <p className="bitload-kicker"><span /> RISK BANDS</p>
          <h2>Choose how much<br /><em>uncertainty stays.</em></h2>
          <p>The band controls which candidate probabilities are eligible. Evidence still decides whether the agent includes or abstains.</p>
        </div>
        <div className="bitload-risk-grid">
          {[
            ["LOW", "60–100%", "Higher confidence", "low"],
            ["MEDIUM", "40–59%", "Balanced signal", "medium"],
            ["HIGH", "15–39%", "More uncertainty", "high"],
          ].map(([label, range, detail, tone]) => <div className={`bitload-risk-card bitload-risk-${tone}`} key={label}>
            <span>{label}</span><strong>{range}</strong><small>{detail}</small>
          </div>)}
          <div className="bitload-risk-abstain"><span>UNDER 15%</span><strong>ABSTAIN</strong><small>No forced picks.</small></div>
        </div>
      </section>

      <section className="bitload-cta">
        <div><p className="bitload-kicker"><span /> READY WHEN YOU ARE</p><h2>Run the first scan.</h2></div>
        <Link href="/onboarding" className="bitload-button bitload-button-dark">Open the demo <span aria-hidden="true">↗</span></Link>
      </section>
    </main>
    <footer className="landing-bitload-footer">
      <span>RØGUE / FORECAST STUDIO</span>
      <span>DEMO DATA · SIMULATION ONLY · VIRTUAL CREDITS</span>
      <span>BUILT FOR BETTER DECISIONS</span>
    </footer>
  </div>;
}
