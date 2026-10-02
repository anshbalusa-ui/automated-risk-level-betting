"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAgent } from "@/components/AgentProvider";
import type { EvaluatedCandidate, Preferences } from "@/lib/domain";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { MorphThinkingOrb } from "@/components/ui/morph-thinking-orb";
const nav = [
  { href: "/dashboard", label: "Overview", icon: "overview" },
  { href: "/forecasts", label: "Forecasts", icon: "forecast" },
  { href: "/portfolio", label: "Portfolio", icon: "portfolio" },
  { href: "/history", label: "History", icon: "history" },
] as const;
function Icon({ name }: { name: (typeof nav)[number]["icon"] | "sports" | "weather" | "arrow" | "info" | "more" }) {
  const paths = {
    overview: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    forecast: <><path d="M3 19h18M5 15l5-5 4 3 5-7" /><path d="M16 6h3v3" /></>,
    portfolio: <><rect x="3" y="6" width="18" height="15" rx="2" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M3 12h18" /></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></>,
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
      <div className="decision-cell"><span className={entry.decision.decision === "include" ? "decision-yes" : "decision-no"}>{entry.decision.decision === "include" ? "SHOWN" : "SKIPPED"}</span><small>{entry.decision.decision === "include" ? "MATCHES" : "DOES NOT MATCH"} {entry.candidate.riskBand.replace("_", " ")} RISK</small></div>
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
function Empty({ title = "Start with your setup", text = "Pick topics and a risk level." }: { title?: string; text?: string }) { return <section className="empty-state"><h2>{title}</h2><p>{text}</p><Link className="button button-dark" href="/onboarding">Set up RØGUE <Icon name="arrow" /></Link></section>; }
function Badge({ children }: { children: React.ReactNode }) { return <span className="badge">{children}</span>; }
function RiskPill({ children }: { children: string }) { return <span className={`risk-pill risk-${children.toLowerCase().replaceAll(" ", "-")}`}>{children}</span>; }

function Onboard() {
  const router = useRouter(); const { preferences, run, savePreferences, startAgent, hydrated } = useAgent();
  const [step, setStep] = useState(0); const [ready, setReady] = useState(false); const [isScanning, setIsScanning] = useState(false); const [scanStage, setScanStage] = useState(0); const [selectedRisk, setSelectedRisk] = useState<Preferences["riskProfile"] | null>(() => run ? preferences.riskProfile : null); const [form, setForm] = useState<Preferences>(() => ({ ...preferences, categories: ["sports"], interests: [...preferences.interests] }));
  const initialized = useRef(false);
  const scanTimeoutRef = useRef<number | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  useEffect(() => {
    if (hydrated && !initialized.current) {
      const sportsOnly = preferences.interests.filter((interest) => quickInterestValues.has(interest));
      setForm({ ...preferences, categories: ["sports"], interests: sportsOnly });
      setSelectedRisk(run ? preferences.riskProfile : null);
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

    if (!selectedRisk) return;
    const next: Preferences = { ...form, categories: ["sports"], riskProfile: selectedRisk, mode: "review" };
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
          <Badge>FINDING PICKS</Badge>
        </header>
        <main className="agent-thinking-shell" aria-label="RØGUE finding picks">
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
            <p className="section-copy">Pick one or more sports. RØGUE will only look at those slates.</p>
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
            <p className="section-copy">Risk controls which picks you see. Bankroll controls how much demo money goes on each pick you add.</p>
            <div className="choice-stack" role="group" aria-label="Risk profile">
              {(["high", "medium", "low"] as const).map((risk) => (
                <button type="button" key={risk} onClick={() => setSelectedRisk(risk)} aria-pressed={selectedRisk === risk} className={`risk-choice ${selectedRisk === risk ? "selected" : ""}`}>
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
              : <LiquidButton disabled={!selectedRisk || !Number.isFinite(form.initialBankroll) || form.initialBankroll <= 0 || !Number.isFinite(form.allocationPercent) || form.allocationPercent <= 0 || form.allocationPercent > 100} onClick={showPicks}>Find picks <span>→</span></LiquidButton>}
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
 return <Frame eyebrow={`YOUR SETUP · ${date(run.generatedAt).toUpperCase()}`} title="Overview" subtitle={`${run.preferences.riskProfile.toUpperCase()} RISK · ${(selectedSports.length ? selectedSports : ["SPORTS"]).join(" + ").toUpperCase()} · ${run.preferences.mode === "auto-simulate" ? "AUTO-SIMULATE" : "REVIEW"}`} action={<div className="heading-actions"><Link href="/onboarding" className="button button-dark">Change sports & risk <Icon name="arrow" /></Link><Link href="/forecasts" className="button button-outline">View demo picks</Link></div>}>
   <section className="scan-panel" aria-label="How picks were filtered">
     <div className="scan-intro"><div><div className="eyebrow">HOW IT FILTERED</div><h2>Here is how your picks were narrowed down.</h2></div></div>
     <div className="scan-steps">
       <div><strong>{run.activity.scanned}</strong><span>Games checked</span></div>
       <div><strong>{run.activity.relevant}</strong><span>Match your sports</span></div>
       <div><strong>{run.activity.bandMatched}</strong><span>Match your risk</span></div>
       <div className="scan-included"><strong>{run.activity.included}</strong><span>Shown to you</span></div>
       <div><strong>{abstained}</strong><span>Skipped</span></div>
     </div>
   </section>
   <div className="section-heading"><div><h2>Forecasts</h2></div><Link href="/forecasts" className="text-link">View all <Icon name="arrow" /></Link></div>
   {featured.length ? <ForecastList items={featured}/> : <div className="empty-inline">No upcoming picks match this setup. <Link href="/forecasts">View all forecasts</Link>.</div>}
 </Frame>;
}
function Forecasts() {
  const { run, handledCandidateIds } = useAgent();
  if (!run) return <Frame eyebrow="YOUR PICKS" title="Predictions for your setup"><Empty /></Frame>;
  const matching = run.evaluated.filter((item) =>
    item.event.category === "sports" &&
    item.event.metadata.historical !== true &&
    item.candidate.riskBand === run.preferences.riskProfile &&
    item.decision.decision === "include" &&
    !handledCandidateIds.includes(item.candidate.id)
  );
  return (
    <Frame eyebrow="YOUR PICKS · DEMO DATA" title="Predictions for your setup" subtitle={`${run.preferences.riskProfile.toUpperCase()} RISK · ${matching.length} SHOWN`} action={<Link href="/onboarding" className="button button-outline">Find more picks</Link>}>
      <p className="picks-intro">These are the picks that match your current sports and risk settings. Open one to see the prediction, confidence, and why it made the cut.</p>
      <ForecastList items={matching} />
    </Frame>
  );
}
function ForecastDetail({ id }: { id: string }) {
  const router = useRouter();
  const { run, addToSimulation, dismissPick } = useAgent();
  const [eventId, outcome] = decodeURIComponent(id).split("::");
  const item = run?.evaluated.find((entry) => entry.event.id === eventId && entry.candidate.outcome === outcome);
  if (!run || !item) return <Frame eyebrow="PREDICTION DETAIL" title="Prediction not found"><Empty title="This prediction is not in your snapshot" text="Go back to your picks and choose another one." /></Frame>;

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
    <Frame eyebrow={`${item.event.category.toUpperCase()} / PICK DETAILS`} title={item.event.title.replace(/^DEMO DATA: /, "")} action={<Link href="/forecasts" className="button button-outline">← Results</Link>}>
      <div className="pick-detail-shell">
        <section className="panel pick-summary-card">
          <div className="pick-summary-top">
            <div>
              <div className="eyebrow">PREDICTION</div>
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
          <h3>{item.decision.decision === "include" ? "Why this pick was shown" : "Why this pick was skipped"}</h3>
          <p className="pick-reason">{item.decision.reason}</p>
          <div className="pick-factors">
            {factors.map((factor) => <div key={factor.name}><i className={`factor-dot factor-${factor.direction}`} /><span><strong>{factor.name}</strong><small>{factor.description}</small></span></div>)}
          </div>
        </section>

        <section className="panel pick-action-card">
          <div>
            <div className="eyebrow">SIMULATION ONLY</div>
            <h3>{position ? "Added to your demo." : "Add this pick to your demo?"}</h3>
            <p>{position ? `${money(position.virtualAllocation)} from your demo bankroll is on this pick.` : `This will use ${run.preferences.allocationPercent}% of your available demo bankroll, or ${money(estimatedAllocation)}.`}</p>
          </div>
          <div className="pick-actions">
            {position
              ? <Link href="/portfolio" className="button button-dark">View portfolio</Link>
              : <LiquidButton onClick={acceptDemoPick}>Add to demo <span>→</span></LiquidButton>}
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
  return <Frame eyebrow="YOUR DEMO MONEY" title="Portfolio" subtitle={`${run.preferences.allocationPercent}% of your available bankroll is used when you add a pick`}>
    <div className="stat-grid">
      <article className="stat-card dark-stat"><span>AVAILABLE</span><strong>{money(run.availableCredits)}</strong><small>demo bankroll</small></article>
      <article className="stat-card"><span>IN PICKS</span><strong>{money(total)}</strong><small>across {positions.length} picks</small></article>
      <article className="stat-card"><span>OPEN</span><strong>{active.length}</strong><small>waiting for a result</small></article>
      <article className="stat-card"><span>SETTLED</span><strong>{resolved.length}</strong><small>finished picks</small></article>
    </div>
    <div className="section-heading"><div><h2>Your picks</h2></div></div>
    {positions.length ? <div className="table-scroll ledger-table"><table><thead><tr><th>EVENT / OUTCOME</th><th>STATUS</th><th>RISK</th><th>CONFIDENCE</th><th>DEMO AMOUNT</th><th>CREATED</th></tr></thead><tbody>{positions.map((position) => <tr key={position.id}>
      <td data-label="Event / outcome"><Link prefetch={false} className="table-event" href={`/forecast/${encodeURIComponent(`${position.eventId}::${position.outcome}`)}`}>{run.evaluated.find((item) => item.event.id === position.eventId)?.event.title ?? position.eventId}<small>{position.outcome}</small></Link></td>
      <td data-label="Status"><span className={`status-pill ${position.status}`}>{position.status}</span></td>
      <td data-label="Risk"><RiskPill>{position.riskProfile}</RiskPill></td>
      <td data-label="Confidence">{percent(position.probability)}</td>
      <td data-label="Demo amount">{money(position.virtualAllocation)}</td>
      <td data-label="Created">{date(position.createdAt)}</td>
    </tr>)}</tbody></table></div> : <div className="empty-inline">You have not added any picks yet. Browse <Link href="/forecasts">forecasts</Link>.</div>}
  </Frame>;
}
function History() {
  const { run } = useAgent();
  const [category, setCategory] = useState("all");
  const [risk, setRisk] = useState("all");
  const [decision, setDecision] = useState("all");
  const [result, setResult] = useState("all");
  if (!run) return <Frame eyebrow="PAST PICKS" title="History"><Empty/></Frame>;
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
  return <Frame eyebrow="PAST PICKS" title="History">
    <div className="history-filters">{filters.map((filter) => <label key={filter.label}>{filter.label}<select value={filter.value} onChange={(event) => filter.set(event.target.value)}>{filter.options.map((option) => <option key={option} value={option}>{option === "all" ? "All" : option.replace("_", " ")}</option>)}</select></label>)}<span>{filtered.length} records</span></div>
    <div className="table-scroll ledger-table history-table"><table><thead><tr><th>EVENT</th><th>CATEGORY</th><th>RISK</th><th>SHOWN</th><th>ALLOCATION</th><th>PREDICTION</th><th>RESULT</th><th>WHY</th></tr></thead><tbody>{filtered.map((item) => {
      const allocation = positions.get(item.candidate.id)?.virtualAllocation;
      return <tr key={item.candidate.id}>
      <td data-label="Event"><Link prefetch={false} className="table-event" href={`/forecast/${encodeURIComponent(`${item.event.id}::${item.candidate.outcome}`)}`}>{item.event.title}<small>{date(item.event.startTime)}</small></Link></td>
      <td data-label="Category">{item.event.category}</td>
      <td data-label="Risk">{item.candidate.riskBand}</td>
      <td data-label="Decision"><span className={item.decision.decision === "include" ? "decision-yes" : "decision-no"}>{item.decision.decision}</span></td>
      <td data-label="Allocation">{allocation === undefined ? "No position" : money(allocation)}</td>
      <td data-label="Prediction">{item.candidate.outcome} · {percent(item.candidate.probability)}</td>
      <td data-label="Result">{resolutions.has(item.event.id) ? (resolutions.get(item.event.id) === item.candidate.outcome ? "Correct" : "Incorrect") : "Pending"}</td>
      <td data-label="Why" className="rationale-cell">{item.decision.reason}</td>
    </tr>;
    })}</tbody></table></div>
  </Frame>;
}
function Landing() {
  const { run } = useAgent();
  const router = useRouter();
  const activeRisk = run?.preferences.riskProfile ?? null;

  function tryDemo() { router.push("/onboarding"); }

  return <div className="landing landing-editorial">
    <main>
      <section className="hero hero-editorial">
        <div className="hero-video-stage" aria-label="Sports prediction demo">
          <div className="hero-copy hero-copy-center">
            <div className="sports-eyebrow"><span>RØGUE</span><i /> SPORTS PREDICTIONS</div>
            <h1><span>Your sports.</span><em>Your risk.</em><b>Your predictions.</b></h1>
            <p>Choose the leagues you follow and how much risk you want. RØGUE gives you a short list of demo predictions built around that setup.</p>
            <div className="hero-actions">
              {run
                ? <Link href="/dashboard" className="button button-outline">Open workspace <span aria-hidden="true">→</span></Link>
                : <LiquidButton size="lg" onClick={tryDemo}>Try demo <span aria-hidden="true">→</span></LiquidButton>}
              <a className="landing-secondary" href="#how-it-works">How it works <span aria-hidden="true">↓</span></a>
            </div>
            <small className="hero-demo-note">DEMO DATA · NO REAL MONEY</small>
          </div>

          <figure className="sports-film sports-film-football">
            <div className="sports-film-media">
              <video
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                onTimeUpdate={(event) => { if (event.currentTarget.currentTime >= 9.5) event.currentTarget.currentTime = 0; }}
                src="https://videos.pexels.com/video-files/32102515/13685679_1920_1080_30fps.mp4"
              />
            </div>
            <figcaption><span>FOOTBALL</span><small>01</small></figcaption>
          </figure>

          <figure className="sports-film sports-film-basketball">
            <div className="sports-film-media">
              <video
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                onTimeUpdate={(event) => { if (event.currentTarget.currentTime >= 9.5) event.currentTarget.currentTime = 0; }}
                src="https://videos.pexels.com/video-files/5192151/5192151-hd_1920_1080_30fps.mp4"
              />
            </div>
            <figcaption><span>BASKETBALL</span><small>02</small></figcaption>
          </figure>

          <figure className="sports-film sports-film-soccer">
            <div className="sports-film-media">
              <video
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                onTimeUpdate={(event) => { if (event.currentTarget.currentTime >= 9.5) event.currentTarget.currentTime = 0; }}
                src="https://videos.pexels.com/video-files/9502506/9502506-uhd_4096_2160_24fps.mp4"
              />
            </div>
            <figcaption><span>SOCCER</span><small>03</small></figcaption>
          </figure>

          <figure className="sports-film sports-film-hockey">
            <div className="sports-film-media">
              <video
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                onTimeUpdate={(event) => { if (event.currentTarget.currentTime >= 9.5) event.currentTarget.currentTime = 0; }}
                src="https://videos.pexels.com/video-files/6847321/6847321-uhd_3840_2160_25fps.mp4"
              />
            </div>
            <figcaption><span>HOCKEY</span><small>04</small></figcaption>
          </figure>
        </div>
      </section>

      <section className="landing-risk" id="how-it-works">
        <div className="landing-section-heading">
          <h2>Pick the kind of slate you want to see.</h2>
          <p>Risk just changes how selective RØGUE is. Pick one, choose your sports, and see the demo predictions that match.</p>
        </div>
        <div className="risk-spectrum risk-spectrum-simple" aria-label="Risk levels">
          <div className={`risk-band risk-band-high ${activeRisk === "high" ? "risk-band-active" : ""}`}><span>HIGH RISK</span><strong>More variance</strong>{activeRisk === "high" && <i>ACTIVE</i>}</div>
          <div className={`risk-band risk-band-medium ${activeRisk === "medium" ? "risk-band-active" : ""}`}><span>MEDIUM RISK</span><strong>Balanced</strong>{activeRisk === "medium" && <i>ACTIVE</i>}</div>
          <div className={`risk-band risk-band-low ${activeRisk === "low" ? "risk-band-active" : ""}`}><span>LOW RISK</span><strong>More selective</strong>{activeRisk === "low" && <i>ACTIVE</i>}</div>
        </div>
      </section>

      <section className="landing-close landing-close-editorial">
        <div>
          <h2>Pick your sports. Set your risk. See what makes the cut.</h2>
          <p>Open a prediction to see the reasoning behind it. Everything here stays in the demo: simulated data, simulated bankroll, no real transactions.</p>
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
  return <Frame eyebrow="WORKSPACE" title="Page not found"><Empty title="This page isn’t here" text="Use the workspace navigation to find your way."/></Frame>;
}
export default function ForecastApp() { return <RouteContent/>; }
