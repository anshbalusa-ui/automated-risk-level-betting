"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAgent } from "@/components/AgentProvider";
import { summarize } from "@/lib/analytics";
import { defaultPreferences, runAgent } from "@/lib/agent";
import type { EvaluatedCandidate, Preferences } from "@/lib/domain";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { MorphThinkingOrb } from "@/components/ui/morph-thinking-orb";
const nav = [
  { href: "/dashboard", label: "Overview", icon: "overview" },
  { href: "/forecasts", label: "Forecasts", icon: "forecast" },
  { href: "/portfolio", label: "Portfolio", icon: "portfolio" },
] as const;
const secondaryNav = [
  { href: "/history", label: "History", icon: "history" },
  { href: "/performance", label: "Performance", icon: "performance" },
] as const;
function Icon({ name }: { name: (typeof nav)[number]["icon"] | (typeof secondaryNav)[number]["icon"] | "sports" | "weather" | "arrow" | "info" | "more" }) {
  const paths = {
    overview: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    forecast: <><path d="M3 19h18M5 15l5-5 4 3 5-7" /><path d="M16 6h3v3" /></>,
    portfolio: <><rect x="3" y="6" width="18" height="15" rx="2" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M3 12h18" /></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></>,
    performance: <><path d="M3 20h18M5 17v-5M10 17V7M15 17v-8M20 17V4" /></>,
    sports: <><circle cx="12" cy="12" r="9" /><path d="M4.5 7.5c4 2 10.5 7 15 9M9 3.5c-.6 4.5-2 9.5-4.5 13M16 4c-.5 5 0 10 3 13" /></>,
    weather: <><path d="M4 17h15a3 3 0 0 0 .2-6A6 6 0 0 0 7.5 10 3.5 3.5 0 0 0 4 17ZM12 2v2M3 5l2 2M21 5l-2 2" /></>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
    more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
function BrandMark() {
  return <span className="brand-symbol" aria-hidden="true">
    <svg viewBox="0 0 24 24" role="presentation">
      <circle className="brand-ring" cx="12" cy="12" r="7.4" />
      <path className="brand-slash" d="M6.8 17.2 17.2 6.8" />
      <path className="brand-signal" d="M4.2 13.3c2.1-1.15 3.9-1.1 5.6.15 1.8 1.35 3.8 1.35 5.8-.05 1.45-1.05 2.8-1.15 4.2-.65" />
      <circle className="brand-pulse" cx="12" cy="12.1" r="1.25" />
    </svg>
  </span>;
}
const number = (value: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
const percent = (value: number | null | undefined) => typeof value === "number" ? `${(value * 100).toFixed(1)}%` : "—";
const date = (value: string) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const sportInterestOptions = [
  { label: "Basketball", value: "NBA", detail: "NBA" },
  { label: "Football", value: "NFL", detail: "NFL" },
  { label: "Baseball", value: "MLB", detail: "MLB" },
  { label: "Soccer", value: "Soccer", detail: "Soccer" },
  { label: "Hockey", value: "NHL", detail: "NHL" },
] as const;
const quickInterestValues = new Set<string>(sportInterestOptions.map((item) => item.value));
const ForecastList = ({ items }: { items: EvaluatedCandidate[] }) => {
  const { run } = useAgent();
  if (!items.length) return <div className="empty-inline">No matching demo picks for this risk level.</div>;
  return <div className="forecast-list">{items.map((entry) => {
    const resolved = run?.resolutions.some((resolution) => resolution.eventId === entry.event.id) ?? false;
    return <Link href={`/forecast/${encodeURIComponent(`${entry.event.id}::${entry.candidate.outcome}`)}`} prefetch={false} key={entry.candidate.id} className="forecast-row pick-row">
      <div className="event-category"><span className="category-symbol"><Icon name={entry.event.category} /></span><span>{entry.event.category}<small>{resolved ? "Resolved" : date(entry.event.startTime)}</small></span></div>
      <div className="forecast-name"><strong>{entry.event.title.replace(/^DEMO DATA: /, "")}</strong><small>{entry.event.description}</small></div>
      <div className="forecast-outcome"><span>PREDICTION</span><strong>{entry.candidate.outcome}</strong></div>
      <div className="forecast-gap"><span>CONFIDENCE</span><strong>{percent(entry.candidate.probability)}</strong></div>
      <div className="decision-cell"><span className={entry.decision.decision === "include" ? "decision-yes" : "decision-no"}>{entry.decision.decision === "include" ? "SHOWN" : "SKIPPED"}</span><small>{entry.decision.decision === "include" ? "FITS" : "OUTSIDE"} {entry.candidate.riskBand.replace("_", " ")} RISK</small></div>
      <div className="row-arrow"><Icon name="arrow" /></div>
    </Link>;
  })}</div>;
};

function useRoutePath() {
  const pathname = usePathname();
  const basePath = process.env.NEXT_PUBLIC_APP_BASE_PATH ?? "";
  const relativePath = basePath && pathname.startsWith(`${basePath}/`)
    ? pathname.slice(basePath.length)
    : pathname;
  return relativePath.replace(/\/$/, "") || "/";
}

function Frame({ children, eyebrow, title, subtitle, action }: { children: React.ReactNode; eyebrow: string; title: string; subtitle?: string; action?: React.ReactNode }) {
  const pathname = useRoutePath(); const { run } = useAgent();
  return (
    <div className="app-frame">
      <aside className="sidebar">
        <Link href="/" className="brand"><BrandMark/><span>RØGUE</span></Link>
        <nav aria-label="Main navigation">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} aria-current={pathname.startsWith(item.href) || (item.href === "/forecasts" && pathname.startsWith("/forecast/")) ? "page" : undefined} className={`nav-link ${pathname.startsWith(item.href) || (item.href === "/forecasts" && pathname.startsWith("/forecast/")) ? "active" : ""}`}>
              <span className="nav-index"><Icon name={item.icon} /></span>{item.label}
            </Link>
          ))}
          <details key={pathname} className="nav-more">
            <summary className={`nav-link ${secondaryNav.some((item) => pathname.startsWith(item.href)) ? "active" : ""}`}><span className="nav-index"><Icon name="more" /></span>More</summary>
            <div className="nav-more-links">{secondaryNav.map((item) => (
              <Link key={item.href} href={item.href} aria-current={pathname.startsWith(item.href) ? "page" : undefined} className={`nav-link ${pathname.startsWith(item.href) ? "active" : ""}`}>
                <span className="nav-index"><Icon name={item.icon} /></span>{item.label}
              </Link>
            ))}</div>
          </details>
        </nav>
        <div className="side-bottom">
          <div className="demo-mark"><span className="status-dot" /> DEMO · SIMULATION ONLY</div>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <span className="crumb">DEMO WORKSPACE</span>
          <div className="topbar-right">
            <span className="run-state"><i /> {run ? "READY" : "SET UP"}</span>
            <Link href="/onboarding" className="avatar-link" aria-label="Change sports and risk" title="Change sports and risk">↗</Link>
          </div>
        </header>
        <div className="page-content">
          <div className="page-heading">
            <div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{subtitle && <p className="page-subtitle">{subtitle}</p>}</div>
            {action && <div className="heading-action">{action}</div>}
          </div>
          {children}
          <footer className="page-footer">DEMO DATA · SIMULATION ONLY</footer>
        </div>
      </main>
    </div>
  );
}
function Empty({ title = "Start with your setup", text = "Pick topics and a risk level." }: { title?: string; text?: string }) { return <section className="empty-state"><h2>{title}</h2><p>{text}</p><Link className="button button-dark" href="/onboarding">Set up your agent <Icon name="arrow" /></Link></section>; }
function Badge({ children }: { children: React.ReactNode }) { return <span className="badge">{children}</span>; }
function RiskPill({ children }: { children: string }) { return <span className={`risk-pill risk-${children.toLowerCase().replaceAll(" ", "-")}`}>{children}</span>; }

function Onboard() {
  const router = useRouter(); const { preferences, savePreferences, startAgent, hydrated } = useAgent();
  const [step, setStep] = useState(0); const [ready, setReady] = useState(false); const [isScanning, setIsScanning] = useState(false); const [scanStage, setScanStage] = useState(0); const [form, setForm] = useState<Preferences>(() => ({ ...preferences, categories: ["sports"], interests: [...preferences.interests] }));
  const initialized = useRef(false);
  const scanTimeoutRef = useRef<number | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  useEffect(() => {
    if (hydrated && !initialized.current) {
      const sportsOnly = preferences.interests.filter((interest) => quickInterestValues.has(interest));
      setForm({ ...preferences, categories: ["sports"], interests: sportsOnly.length ? sportsOnly : ["NBA"] });
      setReady(true);
      initialized.current = true;
    }
  }, [hydrated, preferences]);
  useEffect(() => { if (ready) savePreferences(form); }, [form, ready, savePreferences]);
  useEffect(() => () => {
    if (scanTimeoutRef.current !== null) window.clearTimeout(scanTimeoutRef.current);
    if (scanIntervalRef.current !== null) window.clearInterval(scanIntervalRef.current);
  }, []);
  const toggleInterest = (interest: string) => setForm((current) => ({
    ...current,
    categories: ["sports"],
    interests: current.interests.includes(interest)
      ? current.interests.filter((item) => item !== interest)
      : [...current.interests, interest],
  }));
  function showPicks() {
    if (isScanning) return;

    const next: Preferences = { ...form, categories: ["sports"], mode: "review" };
    setForm(next);
    savePreferences(next);
    startAgent(next);
    setScanStage(0);
    setIsScanning(true);

    let stage = 0;
    scanIntervalRef.current = window.setInterval(() => {
      stage = Math.min(stage + 1, 3);
      setScanStage(stage);
      if (stage >= 3 && scanIntervalRef.current !== null) {
        window.clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    }, 900);

    scanTimeoutRef.current = window.setTimeout(() => {
      router.push("/forecasts");
    }, 3650);
  }
  if (isScanning) {
    return (
      <div className="onboard-wrap agent-thinking-page">
        <header className="onboard-header">
          <Link href="/" className="brand"><BrandMark/><span>RØGUE</span></Link>
          <Badge>AGENT RUNNING</Badge>
        </header>
        <main className="agent-thinking-shell" aria-label="RØGUE agent thinking">
          <MorphThinkingOrb stage={scanStage} />
        </main>
      </div>
    );
  }

  return (
    <div className="onboard-wrap">
      <header className="onboard-header">
        <Link href="/" className="brand"><BrandMark/><span>RØGUE</span></Link>
        <Badge>DEMO DATA</Badge>
      </header>
      <div className="onboard-layout">
        <aside className="onboard-aside"><h1>Set your<br />preferences.</h1></aside>
        <section className="onboard-card" aria-label="Configure your agent">
          <div className="eyebrow">STEP {String(step + 1).padStart(2, "0")} / 02</div>

          {step === 0 && <>
            <h2>Choose what you follow.</h2>
            <p className="section-copy">Pick one or more sports. The agent scans those demo slates.</p>
            <div className="interest-section">
              <div className="field-label">SPORTS</div>
              <div className="interest-grid" role="group" aria-label="Sports">
                {sportInterestOptions.map((option) => {
                  const selected = form.interests.includes(option.value);
                  return <button
                    type="button"
                    key={option.value}
                    className={`interest-choice ${selected ? "selected" : ""}`}
                    aria-pressed={selected}
                    onClick={() => toggleInterest(option.value)}
                  >
                    <span><strong>{option.label}</strong><small>{option.detail}</small></span>
                    <i>{selected ? "✓" : "+"}</i>
                  </button>;
                })}
              </div>
            </div>
            <div className="interest-selection-note">{form.interests.length} selected</div>
          </>}

          {step === 1 && <>
            <h2>Set your risk & bankroll.</h2>
            <p className="section-copy">Risk controls which demo predictions the agent shows. Bankroll settings control the simulated amount attached to each accepted pick.</p>
            <div className="choice-stack" role="group" aria-label="Risk profile">
              {(["low", "medium", "high"] as const).map((risk) => (
                <button type="button" key={risk} onClick={() => setForm((current) => ({ ...current, riskProfile: risk }))} aria-pressed={form.riskProfile === risk} className={`risk-choice ${form.riskProfile === risk ? "selected" : ""}`}>
                  <span><strong>{risk === "low" ? "Low · 60%+" : risk === "medium" ? "Medium · 40–59%" : "High · 15–39%"}</strong></span>
                </button>
              ))}
            </div>

            <div className="bankroll-settings">
              <label className="bankroll-field">
                <span>STARTING DEMO BANKROLL</span>
                <div className="money-input"><b>$</b><input type="number" min="10" step="10" inputMode="decimal" value={form.initialBankroll} onChange={(event) => setForm((current) => ({ ...current, initialBankroll: Math.max(0, Number(event.target.value)) }))} /></div>
              </label>
              <label className="bankroll-field">
                <span>PER-PICK ALLOCATION</span>
                <div className="allocation-control">
                  <input type="range" min="1" max="20" step="1" value={form.allocationPercent} onChange={(event) => setForm((current) => ({ ...current, allocationPercent: Number(event.target.value) }))} />
                  <strong>{form.allocationPercent}%</strong>
                </div>
              </label>
              <div className="bankroll-preview">
                <span>ESTIMATED FIRST PICK</span>
                <strong>{money(form.initialBankroll * (form.allocationPercent / 100))}</strong>
                <small>{form.allocationPercent}% of the available demo bankroll</small>
              </div>
            </div>

            <p className="notice">Simulation only. These are demo dollars, not real funds or transactions.</p>
          </>}

          <div className="onboard-actions">
            <button className="button button-quiet" onClick={() => step === 0 ? router.push("/") : setStep(step - 1)}>{step === 0 ? "Back to home" : "← Back"}</button>
            {step === 0
              ? <LiquidButton disabled={form.interests.length === 0} onClick={() => setStep(1)}>Continue <span>→</span></LiquidButton>
              : <LiquidButton disabled={!Number.isFinite(form.initialBankroll) || form.initialBankroll <= 0 || !Number.isFinite(form.allocationPercent) || form.allocationPercent <= 0 || form.allocationPercent > 100} onClick={showPicks}>Run agent <span>→</span></LiquidButton>}
          </div>
        </section>
      </div>
    </div>
  );
}
function Dashboard() {
 const { run } = useAgent(); if (!run) return <Frame eyebrow="WORKSPACE" title="Overview"><Empty/></Frame>;
 const abstained = run.activity.abstained;
 const selectedSports = run.preferences.interests.filter((interest) => quickInterestValues.has(interest));
 const upcoming = run.evaluated.filter((item) => item.event.category === "sports" && Date.parse(item.event.startTime) > Date.parse(run.generatedAt) && item.candidate.riskBand === run.preferences.riskProfile);
 const preferred = [
   upcoming.find((item) => item.event.category === "sports" && item.decision.decision === "include"),
   upcoming.find((item) => item.decision.decision === "abstain" && /uncertainty/i.test(item.decision.reason)),
 ].filter((item): item is EvaluatedCandidate => item !== undefined);
 const featured = [...preferred, ...upcoming.filter((item) => !preferred.includes(item))].slice(0, 3);
 return <Frame eyebrow={`AGENT SNAPSHOT · ${date(run.generatedAt).toUpperCase()}`} title="Overview" subtitle={`${run.preferences.riskProfile.toUpperCase()} RISK · ${(selectedSports.length ? selectedSports : ["SPORTS"]).join(" + ").toUpperCase()} · ${run.preferences.mode === "auto-simulate" ? "AUTO-SIMULATE" : "REVIEW"}`} action={<div className="heading-actions"><Link href="/onboarding" className="button button-dark">Change sports & risk <Icon name="arrow" /></Link><Link href="/forecasts" className="button button-outline">View demo picks</Link></div>}>
   <section className="scan-panel" aria-label="Agent scan">
     <div className="scan-intro"><div><div className="eyebrow">SCAN · DEMO DATA</div><h2>From event to decision.</h2></div></div>
     <div className="scan-steps">
       <div><strong>{run.activity.scanned}</strong><span>Events scanned</span></div>
       <div><strong>{run.activity.relevant}</strong><span>Relevant</span></div>
       <div><strong>{run.activity.bandMatched}</strong><span>Band matched</span></div>
       <div className="scan-included"><strong>{run.activity.included}</strong><span>Included</span></div>
       <div><strong>{abstained}</strong><span>Abstained</span></div>
     </div>
   </section>
   <div className="section-heading"><div><h2>Forecasts</h2></div><Link href="/forecasts" className="text-link">View all <Icon name="arrow" /></Link></div>
   {featured.length ? <ForecastList items={featured}/> : <div className="empty-inline">No upcoming candidates in this band. <Link href="/forecasts">View all forecasts</Link>.</div>}
 </Frame>;
}
function Forecasts() {
  const { run, handledCandidateIds } = useAgent();
  if (!run) return <Frame eyebrow="AGENT RESULTS" title="Agent recommendations"><Empty /></Frame>;
  const matching = run.evaluated.filter((item) =>
    item.event.category === "sports" &&
    item.event.metadata.historical !== true &&
    item.candidate.riskBand === run.preferences.riskProfile &&
    item.decision.decision === "include" &&
    !handledCandidateIds.includes(item.candidate.id)
  );
  return (
    <Frame eyebrow="AGENT RESULTS · DEMO DATA" title="Agent recommendations" subtitle={`${run.preferences.riskProfile.toUpperCase()} RISK · ${matching.length} SHOWN`} action={<Link href="/onboarding" className="button button-outline">Find more bets</Link>}>
      <p className="picks-intro"><strong>Prediction</strong> is what the model thinks will happen. The agent shows you the ones that fit your selected risk. Tap any result for the reasoning.</p>
      <ForecastList items={matching} />
    </Frame>
  );
}
function ForecastDetail({ id }: { id: string }) {
  const router = useRouter();
  const { run, addToSimulation, dismissPick } = useAgent();
  const [eventId, outcome] = decodeURIComponent(id).split("::");
  const item = run?.evaluated.find((entry) => entry.event.id === eventId && entry.candidate.outcome === outcome);
  if (!run || !item) return <Frame eyebrow="PREDICTION DETAIL" title="Prediction not found"><Empty title="This prediction is not in your snapshot" text="Go back to your agent results and choose another one." /></Frame>;

  const candidateId = item.candidate.id;
  const position = run.positions.find((entry) => entry.candidateId === candidateId);
  const canSimulate = item.decision.decision === "include" && !position;
  const factors = item.forecast.factors.slice(0, 2);
  const estimatedAllocation = run.availableCredits * (run.preferences.allocationPercent / 100);

  function acceptDemoPick() {
    if (!canSimulate) return;
    addToSimulation(candidateId);
    dismissPick(candidateId);
    router.push("/forecasts");
  }

  function declineDemoPick() {
    dismissPick(candidateId);
    router.push("/forecasts");
  }

  return (
    <Frame eyebrow={`${item.event.category.toUpperCase()} / AGENT RESULT`} title={item.event.title.replace(/^DEMO DATA: /, "")} action={<Link href="/forecasts" className="button button-outline">← Results</Link>}>
      <div className="pick-detail-shell">
        <section className="panel pick-summary-card">
          <div className="pick-summary-top">
            <div>
              <div className="eyebrow">MODEL PREDICTION</div>
              <h2>{item.candidate.outcome}</h2>
              <p>{item.event.description}</p>
            </div>
            <div className="pick-probability"><span>CONFIDENCE</span><strong>{percent(item.candidate.probability)}</strong></div>
          </div>

          <div className="pick-meta">
            <span><b>Risk fit</b>{item.decision.decision === "include" ? "Match" : "No match"}</span><span><b>Risk</b>{item.candidate.riskBand.replace("_", " ")}</span>
            <span><b>Starts</b>{new Date(item.event.startTime).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
            <span><b>Uncertainty</b>{percent(item.forecast.uncertainty)}</span>
          </div>
        </section>

        <section className="panel pick-reason-card">
          <div className="eyebrow">QUICK READ</div>
          <h3>{item.decision.decision === "include" ? "Why the agent showed it" : "Why the agent skipped it"}</h3>
          <p className="pick-reason">{item.decision.reason}</p>
          <div className="pick-factors">
            {factors.map((factor) => <div key={factor.name}><i className={`factor-dot factor-${factor.direction}`} /><span><strong>{factor.name}</strong><small>{factor.description}</small></span></div>)}
          </div>
        </section>

        <section className="panel pick-action-card">
          <div>
            <div className="eyebrow">SIMULATION ONLY</div>
            <h3>{position ? "Added to your demo." : "Want to add this pick?"}</h3>
            <p>{position ? `${money(position.virtualAllocation)} from your demo bankroll is attached to this simulated position.` : `${run.preferences.allocationPercent}% of your available demo bankroll (${money(estimatedAllocation)}) will be attached if you accept it.`}</p>
          </div>
          <div className="pick-actions">
            {position
              ? <Link href="/portfolio" className="button button-dark">View portfolio</Link>
              : <LiquidButton onClick={acceptDemoPick}>Add to simulation <span>→</span></LiquidButton>}
            <button type="button" className="button button-outline" onClick={position ? () => router.push("/forecasts") : declineDemoPick}>{position ? "Back to picks" : "Skip"}</button>
          </div>
        </section>
      </div>
    </Frame>
  );
}
function Portfolio() {
  const { run } = useAgent();
  if (!run) return <Frame eyebrow="SIMULATION" title="Portfolio"><Empty/></Frame>;
  const positions = run.positions;
  const active = positions.filter((position) => position.status === "active");
  const resolved = positions.filter((position) => position.status === "resolved");
  const total = positions.reduce((sum, position) => sum + position.virtualAllocation, 0);
  return <Frame eyebrow="SIMULATION" title="Portfolio" subtitle={`Demo bankroll · ${run.preferences.allocationPercent}% per accepted pick`}>
    <div className="stat-grid">
      <article className="stat-card dark-stat"><span>AVAILABLE BANKROLL</span><strong>{money(run.availableCredits)}</strong><small>demo dollars</small></article>
      <article className="stat-card"><span>ALLOCATED</span><strong>{money(total)}</strong><small>across {positions.length} positions</small></article>
      <article className="stat-card"><span>ACTIVE</span><strong>{active.length}</strong><small>unresolved positions</small></article>
      <article className="stat-card"><span>RESOLVED</span><strong>{resolved.length}</strong><small>in this run</small></article>
    </div>
    <div className="section-heading"><div><h2>Positions</h2></div></div>
    {positions.length ? <div className="table-scroll ledger-table"><table><thead><tr><th>EVENT / OUTCOME</th><th>STATUS</th><th>RISK</th><th>MODEL PROBABILITY</th><th>DEMO AMOUNT</th><th>CREATED</th></tr></thead><tbody>{positions.map((position) => <tr key={position.id}>
      <td data-label="Event / outcome"><Link prefetch={false} className="table-event" href={`/forecast/${encodeURIComponent(`${position.eventId}::${position.outcome}`)}`}>{run.evaluated.find((item) => item.event.id === position.eventId)?.event.title ?? position.eventId}<small>{position.outcome}</small></Link></td>
      <td data-label="Status"><span className={`status-pill ${position.status}`}>{position.status}</span></td>
      <td data-label="Risk"><RiskPill>{position.riskProfile}</RiskPill></td>
      <td data-label="Model probability">{percent(position.probability)}</td>
      <td data-label="Demo amount">{money(position.virtualAllocation)}</td>
      <td data-label="Created">{date(position.createdAt)}</td>
    </tr>)}</tbody></table></div> : <div className="empty-inline">No positions were created by the current policy. Abstentions remain visible in <Link href="/forecasts">forecasts</Link>.</div>}
  </Frame>;
}
function History() {
  const { run } = useAgent();
  const [category, setCategory] = useState("all");
  const [risk, setRisk] = useState("all");
  const [decision, setDecision] = useState("all");
  const [result, setResult] = useState("all");
  if (!run) return <Frame eyebrow="DECISIONS" title="History"><Empty/></Frame>;
  const positions = new Map(run.positions.map((position) => [position.candidateId, position]));
  const resolutions = new Map(run.resolutions.map((resolution) => [resolution.eventId, resolution.actualOutcome]));
  const filtered = run.evaluated.filter((item) => {
    const actual = resolutions.get(item.event.id);
    const outcome = actual === undefined ? "pending" : item.candidate.outcome === actual ? "correct" : "incorrect";
    return (category === "all" || item.event.category === category) && (risk === "all" || item.candidate.riskBand === risk) && (decision === "all" || item.decision.decision === decision) && (result === "all" || outcome === result);
  });
  const filters: { value: string; set: (value: string) => void; label: string; options: string[] }[] = [
    { value: category, set: setCategory, label: "Category", options: ["all", "sports"] },
    { value: risk, set: setRisk, label: "Risk", options: ["all", "low", "medium", "high", "very_high"] },
    { value: decision, set: setDecision, label: "Decision", options: ["all", "include", "abstain"] },
    { value: result, set: setResult, label: "Result", options: ["all", "pending", "correct", "incorrect"] },
  ];
  return <Frame eyebrow="DECISIONS" title="History">
    <div className="history-filters">{filters.map((filter) => <label key={filter.label}>{filter.label}<select value={filter.value} onChange={(event) => filter.set(event.target.value)}>{filter.options.map((option) => <option key={option} value={option}>{option === "all" ? "All" : option.replace("_", " ")}</option>)}</select></label>)}<span>{filtered.length} records</span></div>
    <div className="table-scroll ledger-table history-table"><table><thead><tr><th>EVENT</th><th>CATEGORY</th><th>RISK</th><th>DECISION</th><th>ALLOCATION</th><th>MODEL OUTCOME</th><th>RESULT</th><th>RATIONALE</th></tr></thead><tbody>{filtered.map((item) => {
      const allocation = positions.get(item.candidate.id)?.virtualAllocation;
      return <tr key={item.candidate.id}>
      <td data-label="Event"><Link prefetch={false} className="table-event" href={`/forecast/${encodeURIComponent(`${item.event.id}::${item.candidate.outcome}`)}`}>{item.event.title}<small>{date(item.event.startTime)}</small></Link></td>
      <td data-label="Category">{item.event.category}</td>
      <td data-label="Risk">{item.candidate.riskBand}</td>
      <td data-label="Decision"><span className={item.decision.decision === "include" ? "decision-yes" : "decision-no"}>{item.decision.decision}</span></td>
      <td data-label="Allocation">{allocation === undefined ? "No position" : money(allocation)}</td>
      <td data-label="Model outcome">{item.candidate.outcome} · {percent(item.candidate.probability)}</td>
      <td data-label="Result">{resolutions.has(item.event.id) ? (resolutions.get(item.event.id) === item.candidate.outcome ? "Correct" : "Incorrect") : "Pending"}</td>
      <td data-label="Rationale" className="rationale-cell">{item.decision.reason}</td>
    </tr>;
    })}</tbody></table></div>
  </Frame>;
}
function Performance() {
  const { run } = useAgent();
  if (!run) return <Frame eyebrow="MODEL REVIEW" title="Performance"><Empty/></Frame>;
  const summary = summarize(run);
  const groups = [...Object.entries(summary.byRisk), ...Object.entries(summary.byCategory)];
  return <Frame eyebrow="MODEL REVIEW" title="Performance" action={<Badge>DEMO DATA</Badge>}>
    <div className="performance-alert"><span aria-hidden="true"><Icon name="info" /></span><p>Resolved demo events only. Small samples are not predictive.</p></div>
    <div className="section-heading"><div><h2>All forecasts vs. included</h2></div><span className="sample-count">{summary.resolved} resolved samples</span></div>
    <div className="score-grid">{[["All forecasts", summary.allForecasts], ["Policy included", summary.includedForecasts]].map(([label, value]) => { const data = value as typeof summary.allForecasts; return <article key={label as string} className="score-card"><span>{label as string}</span><div className="score-metrics"><div><strong>{data.accuracy === null ? "—" : percent(data.accuracy)}</strong><small>ACCURACY</small></div><div><strong>{data.brierScore === null ? "—" : data.brierScore.toFixed(3)}</strong><small>BRIER SCORE</small></div></div><div className="sample-count">n = {data.count} resolved</div><Calibration calibration={data.calibration}/></article>; })}</div>
    <div className="section-heading"><div><h2>By risk and category</h2></div></div>
    <div className="breakdown-grid">{groups.map(([name, data], index) => <Breakdown key={`${index}-${name}`} title={name} data={data}/>)}</div>
    <details className="metric-notes"><summary>About these metrics · {summary.abstention.abstained} of {summary.abstention.denominator} abstained</summary><p>Brier score: lower is better. Calibration: predicted vs. observed frequency. Only resolved outcomes count.</p></details>
  </Frame>;
}
function Calibration({ calibration }: { calibration: Array<{ label: string; predictedMean: number | null; observedFrequency: number | null; count: number }> }) {
  return <div className="calibration"><div className="calibration-head"><strong>CALIBRATION</strong><span>{calibration.reduce((n, row) => n + row.count, 0)} samples</span></div>{calibration.length ? calibration.map((row) => <div className="calibration-row" key={row.label}><span>{row.label}%</span><div className="calibration-track"><i style={{ left: `${(row.predictedMean ?? 0) * 100}%` }}/><b style={{ left: `${(row.observedFrequency ?? 0) * 100}%` }}/></div><span>{percent(row.predictedMean)} → {percent(row.observedFrequency)} <small>n={row.count}</small></span></div>) : <div className="no-samples">No resolved sample yet</div>}<div className="calibration-legend"><span><i/> predicted mean</span><span><b/> observed frequency</span></div></div>;
}
function Breakdown({ title, data }: { title: string; data: { evaluated: number; included: number; resolved: number; allForecasts: { accuracy: number | null; brierScore: number | null }; includedForecasts: { accuracy: number | null; brierScore: number | null } } }) {
  return <section className="panel breakdown"><div className="eyebrow">{title.toUpperCase()}</div><div className="breakdown-list"><div className="breakdown-counts"><span>{data.evaluated} evaluated</span><span>{data.included} included</span><span>{data.resolved} resolved</span></div><div><strong>All forecasts</strong><b>{data.allForecasts.accuracy === null ? "—" : percent(data.allForecasts.accuracy)}</b><small>accuracy</small><em>{data.allForecasts.brierScore === null ? "—" : data.allForecasts.brierScore.toFixed(3)} Brier</em></div><div><strong>Included</strong><b>{data.includedForecasts.accuracy === null ? "—" : percent(data.includedForecasts.accuracy)}</b><small>accuracy</small><em>{data.includedForecasts.brierScore === null ? "—" : data.includedForecasts.brierScore.toFixed(3)} Brier</em></div></div></section>;
}
const landingSports = runAgent(defaultPreferences).evaluated.filter((entry) =>
  entry.event.category === "sports" && entry.event.metadata.historical !== true && entry.candidate.outcome === "Yes");

function Landing() {
  const { run, preferences } = useAgent();
  const router = useRouter();
  const signalLandscapeRef = useRef<HTMLDivElement>(null);
  const signalParticleLayerRef = useRef<HTMLDivElement>(null);
  const sports = landingSports;
  const featured = sports[0];
  const secondary = sports[1] ?? featured;
  const signalGap = (featured.candidate.probabilityGap ?? 0) * 100;
  const activeRisk = run?.preferences.riskProfile ?? preferences.riskProfile;

  useEffect(() => {
    const landscape = signalLandscapeRef.current;
    const particleLayer = signalParticleLayerRef.current;
    if (!landscape || !particleLayer) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mesh = landscape.querySelector<SVGSVGElement>(".signal-mesh");
    const haze = landscape.querySelector<HTMLElement>(".signal-haze");
    const fragments = Array.from(landscape.querySelectorAll<HTMLElement>(".signal-fragment"));
    const fragmentOpacities = fragments.map((fragment) => Number.parseFloat(getComputedStyle(fragment).opacity) || 1);
    const paths = Array.from(landscape.querySelectorAll<SVGGeometryElement>(".mesh-lines path, .mesh-verticals path, .signal-ridge"));
    const pulse = landscape.querySelector<SVGCircleElement>(".signal-pulse");

    let animationFrame = 0;

    const clamp = (value: number) => Math.min(1, Math.max(0, value));
    const smoothstep = (value: number) => {
      const t = clamp(value);
      return t * t * (3 - 2 * t);
    };
    const easeOut = (value: number) => 1 - Math.pow(1 - clamp(value), 3);

    type PathState = {
      path: SVGGeometryElement;
      start: number;
      duration: number;
      length: number;
      drift: number;
      lift: number;
    };

    const pathStates: PathState[] = paths.map((path, index) => {
      const box = path.getBBox();
      const centerY = box.y + box.height * 0.5;
      const verticalProgress = clamp((centerY - 160) / 325);
      const length = Math.max(1, path.getTotalLength());
      const isVertical = path.closest(".mesh-verticals") !== null;
      const start = 0.012 + verticalProgress * 0.6 + (isVertical ? 0.018 : 0);
      const duration = isVertical ? 0.36 : 0.4;

      path.style.strokeDasharray = `${length.toFixed(2)} ${length.toFixed(2)}`;
      path.style.strokeDashoffset = "0";
      path.style.transformBox = "fill-box";
      path.style.transformOrigin = "center";
      path.style.willChange = "transform, opacity, stroke-dashoffset";

      return {
        path,
        start,
        duration,
        length,
        drift: ((index % 5) - 2) * 2.6,
        lift: 5 + (index % 4) * 2.2,
      };
    });

    const particleNodes: HTMLElement[] = [];
    const particleData: Array<{
      node: HTMLElement;
      start: number;
      lift: number;
      drift: number;
      spin: number;
      baseOpacity: number;
    }> = [];

    paths.forEach((path, pathIndex) => {
      const length = Math.max(1, path.getTotalLength());
      const samples = Math.max(8, Math.min(22, Math.round(length / 62)));

      for (let sample = 0; sample <= samples; sample += 1) {
        const along = (sample / samples) * length;
        const point = path.getPointAtLength(along);
        const seed = pathIndex * 97 + sample * 31;
        const jitter = (Math.sin(seed * 1.713) + 1) * 0.5;
        const jitterTwo = (Math.sin(seed * 0.917 + 3.4) + 1) * 0.5;
        const verticalProgress = clamp((point.y - 150) / 340);
        const start = 0.01 + verticalProgress * 0.6 + jitter * 0.025;

        const particle = document.createElement("span");
        particle.className = "signal-particle";
        const size = 0.95 + jitter * 1.7;
        const width = size * (jitterTwo > 0.76 ? 1.55 : 1);
        particle.style.left = `${(point.x / 1200) * 100}%`;
        particle.style.top = `${(point.y / 560) * 100}%`;
        particle.style.width = `${width.toFixed(2)}px`;
        particle.style.height = `${size.toFixed(2)}px`;
        particle.style.opacity = "0";
        particleLayer.appendChild(particle);

        particleNodes.push(particle);
        particleData.push({
          node: particle,
          start,
          lift: 75 + jitter * 120 + verticalProgress * 34,
          drift: (jitterTwo - 0.5) * 72,
          spin: (jitter - 0.5) * 44,
          baseOpacity: 0.24 + jitter * 0.48,
        });
      }
    });

    const renderAt = (progress: number) => {
      pathStates.forEach(({ path, start, duration, length, drift, lift }, index) => {
        const local = smoothstep((progress - start) / duration);
        const remaining = 1 - local;

        path.style.opacity = String(clamp(remaining * 1.04));
        path.style.strokeDashoffset = `${(length * local * (0.16 + (index % 3) * 0.055)).toFixed(2)}`;
        path.style.transform = `translate3d(${(drift * local).toFixed(2)}px,${(-lift * local).toFixed(2)}px,0)`;
        path.style.filter = `blur(${(local * 0.42).toFixed(2)}px)`;
      });

      particleData.forEach(({ node, start, lift, drift, spin, baseOpacity }) => {
        const raw = clamp((progress - start) / 0.48);
        const motion = easeOut(raw);
        const appear = smoothstep(raw / 0.14);
        const fade = 1 - smoothstep((raw - 0.52) / 0.48);
        const opacity = baseOpacity * appear * fade;

        node.style.opacity = opacity.toFixed(3);
        node.style.transform = `translate3d(${(drift * motion).toFixed(2)}px,${(-lift * motion).toFixed(2)}px,0) rotate(${(spin * motion).toFixed(1)}deg) scale(${(0.72 + motion * 0.48).toFixed(3)})`;
        node.style.filter = `blur(${(motion * 0.55).toFixed(2)}px)`;
      });

      if (mesh) {
        const meshFade = smoothstep(progress / 0.62);
        mesh.style.opacity = String(1 - meshFade);
        mesh.style.transform = `translate3d(0,${(-meshFade * 7).toFixed(2)}px,0) scale(${(1 - meshFade * 0.012).toFixed(4)})`;
      }

      if (haze) {
        const hazeProgress = smoothstep(progress / 0.72);
        haze.style.opacity = String(1 - hazeProgress);
        haze.style.transform = `translate3d(0,${(-hazeProgress * 12).toFixed(2)}px,0) scale(${(1 - hazeProgress * 0.03).toFixed(4)})`;
      }

      if (pulse) {
        const pulseProgress = smoothstep(progress / 0.54);
        pulse.style.opacity = String(1 - pulseProgress);
      }

      fragments.forEach((fragment, index) => {
        const start = 0.56 + index * 0.02;
        const local = smoothstep((progress - start) / 0.34);
        fragment.style.opacity = String(fragmentOpacities[index] * (1 - local));
        fragment.style.transform = `translate3d(${((index % 2 === 0 ? -1 : 1) * local * 6).toFixed(2)}px,${(-local * (12 + index * 3)).toFixed(2)}px,0)`;
        fragment.style.filter = `blur(${(local * 0.45).toFixed(2)}px)`;
      });

      landscape.style.transform = `translate3d(0,${(-progress * 4).toFixed(2)}px,0)`;
    };

    const resetForReducedMotion = () => {
      landscape.style.transform = "";
      pathStates.forEach(({ path }) => {
        path.style.removeProperty("opacity");
        path.style.removeProperty("stroke-dashoffset");
        path.style.removeProperty("transform");
        path.style.removeProperty("filter");
      });
      particleNodes.forEach((particle) => {
        particle.style.opacity = "0";
        particle.style.transform = "none";
        particle.style.filter = "none";
      });
      mesh?.style.removeProperty("opacity");
      mesh?.style.removeProperty("transform");
      haze?.style.removeProperty("opacity");
      haze?.style.removeProperty("transform");
      pulse?.style.removeProperty("opacity");
      fragments.forEach((fragment) => {
        fragment.style.removeProperty("opacity");
        fragment.style.removeProperty("transform");
        fragment.style.removeProperty("filter");
      });
    };

    const renderFromScroll = () => {
      animationFrame = 0;

      if (reducedMotion.matches) {
        resetForReducedMotion();
        return;
      }

      const dissolveDistance = Math.min(1650, Math.max(1250, window.innerHeight * 1.55));
      const progress = clamp(window.scrollY / dissolveDistance);
      renderAt(progress);
    };

    const scheduleUpdate = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(renderFromScroll);
    };

    renderFromScroll();

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    reducedMotion.addEventListener?.("change", scheduleUpdate);

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      reducedMotion.removeEventListener?.("change", scheduleUpdate);
      particleLayer.replaceChildren();
    };
  }, []);

  function tryDemo() { router.push("/onboarding"); }

  return <div className="landing">

    <main>
      <section className="hero" id="signal">
        <div className="hero-copy">
          <h1><span>Set your risk.</span><em>See the predictions.</em></h1>
          <p>RØGUE scans fictional sports matchups, scores each prediction by confidence, and shows the ones that match your risk level.</p>
          <div className="hero-actions">
            {run
              ? <Link href="/dashboard" className="button button-outline">Open workspace <span aria-hidden="true">→</span></Link>
              : <LiquidButton size="lg" onClick={tryDemo}>Try demo <span aria-hidden="true">→</span></LiquidButton>}
            <a className="landing-secondary" href="#how-it-works">How it works <span aria-hidden="true">↓</span></a>
          </div>
        </div>

        <div ref={signalLandscapeRef} className="signal-landscape" role="img" aria-label="Sports prediction flow showing scan, risk, prediction, and result">
          <div className="signal-haze" aria-hidden="true" />
          <svg className="signal-mesh" viewBox="0 0 1200 560" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            <defs>
              <linearGradient id="meshFade" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                <stop offset="18%" stopColor="rgba(255,255,255,.26)" />
                <stop offset="52%" stopColor="rgba(188,228,240,.92)" />
                <stop offset="82%" stopColor="rgba(255,255,255,.26)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
              <linearGradient id="signalStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(255,255,255,.12)" />
                <stop offset="43%" stopColor="rgba(255,255,255,.72)" />
                <stop offset="58%" stopColor="rgba(156,220,239,1)" />
                <stop offset="100%" stopColor="rgba(255,255,255,.14)" />
              </linearGradient>
            </defs>
            <g className="mesh-lines" fill="none" stroke="url(#meshFade)">
              <path d="M40 470 C170 450 250 425 360 438 C470 450 530 340 620 342 C710 344 760 450 870 430 C975 410 1050 438 1160 462" />
              <path d="M35 442 C165 420 245 390 355 407 C468 425 524 302 620 304 C718 306 766 421 875 397 C982 374 1063 410 1165 439" />
              <path d="M28 410 C152 385 242 352 350 376 C463 401 520 265 620 267 C723 269 772 392 882 364 C990 336 1070 382 1172 412" />
              <path d="M20 374 C148 346 232 316 346 342 C458 368 513 231 620 232 C727 233 780 361 890 330 C1000 299 1080 350 1180 382" />
              <path d="M20 336 C145 310 227 283 345 307 C462 331 513 204 620 204 C733 204 784 330 898 299 C1009 268 1084 318 1180 344" />
              <path d="M28 299 C154 278 235 252 348 272 C462 293 520 187 620 186 C729 184 790 298 902 270 C1015 242 1089 284 1172 307" />
              <path d="M38 265 C164 249 246 224 356 240 C470 257 529 181 620 178 C719 175 797 267 902 243 C1008 219 1080 250 1162 272" />
              <path d="M52 233 C176 221 262 201 368 212 C479 225 540 184 620 178 C708 171 804 240 896 219 C991 197 1063 222 1148 241" />
            </g>
            <g className="mesh-verticals" fill="none">
              <path d="M120 223 C166 282 166 390 149 448" />
              <path d="M220 202 C270 276 266 374 252 421" />
              <path d="M325 191 C366 257 373 335 363 392" />
              <path d="M430 187 C471 235 481 307 470 362" />
              <path d="M520 181 C555 213 574 272 560 331" />
              <path d="M620 176 C620 214 620 274 620 343" />
              <path d="M720 182 C690 222 674 280 682 346" />
              <path d="M815 191 C779 239 773 319 784 379" />
              <path d="M920 203 C884 257 886 349 902 410" />
              <path d="M1020 219 C987 282 993 379 1012 435" />
              <path d="M1105 239 C1080 304 1087 407 1110 459" />
            </g>
            <path className="signal-ridge" d="M65 360 C180 350 270 336 366 353 C472 372 528 246 620 246 C718 246 777 370 884 343 C984 318 1070 344 1140 360" fill="none" stroke="url(#signalStroke)" />
            <circle className="signal-pulse" cx="620" cy="246" r="6" />
          </svg>

          <div ref={signalParticleLayerRef} className="signal-disperse-layer" aria-hidden="true" />

          <div className="signal-fragment signal-fragment-a">
            <span>01 / SCAN</span>
            <strong>SPORTS</strong>
          </div>
          <div className="signal-fragment signal-fragment-b">
            <span>02 / RISK</span>
            <strong>MEDIUM</strong>
            <small>40–59%</small>
          </div>
          <div className="signal-fragment signal-fragment-c">
            <span>03 / PREDICT</span>
            <strong>{featured.candidate.outcome}</strong>
            <small>{percent(featured.candidate.probability)}</small>
          </div>
          <div className="signal-fragment signal-fragment-d">
            <span>04 / RESULT</span>
            <strong>{featured.decision.decision === "include" ? "SHOW" : "SKIP"}</strong>
          </div>
        </div>
      </section>

      <section className="landing-risk" id="how-it-works">
        <div className="landing-section-heading">
          <h2>Your risk level sets the confidence range.</h2>
        </div>
        <div className="risk-spectrum" aria-label="Risk bands">
          <div className={`risk-band risk-band-low ${activeRisk === "low" ? "risk-band-active" : ""}`}><span>LOW</span><strong>60–100%</strong>{activeRisk === "low" && <i>ACTIVE</i>}</div>
          <div className={`risk-band risk-band-medium ${activeRisk === "medium" ? "risk-band-active" : ""}`}><span>MEDIUM</span><strong>40–59%</strong>{activeRisk === "medium" && <i>ACTIVE</i>}</div>
          <div className={`risk-band risk-band-high ${activeRisk === "high" ? "risk-band-active" : ""}`}><span>HIGH</span><strong>15–39%</strong>{activeRisk === "high" && <i>ACTIVE</i>}</div>
        </div>

      </section>

      <section className="landing-close">
        <div>
          <h2>Sports predictions, filtered to your risk level.</h2>
          <p>RØGUE runs fictional matchups through confidence and uncertainty checks, then shows the predictions that fit the risk level you chose. Simulation only. No real money or transactions.</p>
        </div>
      </section>
    </main>
  </div>;
}

function RouteContent() {
  const pathname = useRoutePath();
  const { hydrated } = useAgent();
  if (pathname !== "/" && pathname !== "/onboarding" && !hydrated) {
    return <Frame eyebrow="DEMO DATA" title="Restoring your snapshot"><p className="page-subtitle" role="status">Loading this browser’s local simulation.</p></Frame>;
  }
  if (pathname === "/") return <Landing/>;
  if (pathname === "/onboarding") return <Onboard/>;
  if (pathname === "/dashboard") return <Dashboard/>;
  if (pathname === "/forecasts") return <Forecasts/>;
  if (pathname.startsWith("/forecast/") || pathname.startsWith("/forecasts/")) return <ForecastDetail id={pathname.split("/").at(-1) ?? ""}/>;
  if (pathname === "/portfolio") return <Portfolio/>;
  if (pathname === "/history") return <History/>;
  if (pathname === "/performance") return <Performance/>;
  return <Frame eyebrow="WORKSPACE" title="Page not found"><Empty title="This page isn’t here" text="Use the workspace navigation to find your way."/></Frame>;
}
export default function ForecastApp() { return <RouteContent/>; }
