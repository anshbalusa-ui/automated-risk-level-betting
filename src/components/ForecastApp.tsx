"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAgent } from "@/components/AgentProvider";
import type { EvaluatedCandidate, Preferences } from "@/lib/domain";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { MorphThinkingOrb } from "@/components/ui/morph-thinking-orb";
import LandingExperience from "@/components/landing/LandingExperience";
import { ForecastDashboard } from "@/components/ui/dashboard-1";
import { summarize } from "@/lib/analytics";
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
const creditsFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const credits = (value: number) => `${creditsFormatter.format(value)} credits`;
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
  }, [hydrated, preferences, run]);
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
            <h2>Set your risk & credits.</h2>
            <p className="section-copy">Risk controls which outcomes you see. Your virtual credits determine how much you can allocate in the simulation.</p>
            <div className="choice-stack" role="group" aria-label="Risk profile">
              {(["high", "medium", "low"] as const).map((risk) => (
                <button type="button" key={risk} onClick={() => setSelectedRisk(risk)} aria-pressed={selectedRisk === risk} className={`risk-choice ${selectedRisk === risk ? "selected" : ""}`}>
                  <span><strong>{risk === "low" ? "Low · 60%+" : risk === "medium" ? "Medium · 40–59%" : "High · 15–39%"}</strong></span>
                </button>
              ))}
            </div>

            <div className="bankroll-settings">
              <label className="bankroll-field">
                <span>STARTING VIRTUAL CREDITS</span>
                <div className="money-input"><input type="number" min="10" step="10" inputMode="decimal" aria-label="Starting virtual credits" value={form.initialBankroll} onChange={(event) => setForm((current) => ({ ...current, initialBankroll: Math.max(0, Number(event.target.value)) }))} /><b>credits</b></div>
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
                <strong>{credits(form.initialBankroll * (form.allocationPercent / 100))}</strong>
                <small>{form.allocationPercent}% of your available virtual credits</small>
              </div>
            </div>

            <p className="notice">Simulation only. These are virtual credits, not real funds or transactions.</p>
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
  const router = useRouter();
  const { run } = useAgent();
  if (!run) return <Frame eyebrow="WORKSPACE" title="Overview"><Empty /></Frame>;

  const selectedSports = run.preferences.interests.filter((interest) => quickInterestValues.has(interest));
  const upcoming = run.evaluated.filter((item) =>
    item.event.category === "sports" &&
    Date.parse(item.event.startTime) > Date.parse(run.generatedAt) &&
    item.candidate.riskBand === run.preferences.riskProfile,
  );
  const preferred = [
    upcoming.find((item) => item.decision.decision === "include"),
    upcoming.find((item) => item.decision.decision === "abstain" && /uncertainty/i.test(item.decision.reason)),
  ].filter((item): item is EvaluatedCandidate => item !== undefined);
  const featured = [...preferred, ...upcoming.filter((item) => !preferred.includes(item))].slice(0, 3);
  const signals = featured.map((item) => ({
    id: item.candidate.id,
    href: `/forecast/${encodeURIComponent(`${item.event.id}::${item.candidate.outcome}`)}`,
    category: item.event.category,
    title: item.event.title.replace(/^DEMO DATA: /, ""),
    outcome: item.candidate.outcome,
    probability: item.candidate.probability,
    referenceProbability: item.candidate.referenceProbability,
    probabilityGap: item.candidate.probabilityGap,
    uncertainty: item.forecast.uncertainty,
    decision: item.decision.decision,
  }));

  return (
    <Frame
      eyebrow={`YOUR SETUP · ${date(run.generatedAt).toUpperCase()}`}
      title="Overview"
      subtitle={`${run.preferences.riskProfile.toUpperCase()} RISK · ${(selectedSports.length ? selectedSports : ["SPORTS"]).join(" + ").toUpperCase()} · ${run.preferences.mode === "auto-simulate" ? "AUTO-SIMULATE" : "REVIEW"}`}
      action={<div className="heading-actions"><Link href="/onboarding" className="button button-dark">Change sports & risk <Icon name="arrow" /></Link><Link href="/forecasts" className="button button-outline">View demo picks</Link></div>}
    >
      <ForecastDashboard
        subtitle="A compact readout of the scan, the policy gate, and the signals worth opening."
        activity={run.activity}
        forecasts={signals}
        onFilterClick={() => router.push("/forecasts")}
        cta={{
          text: "Tune the profile or inspect every candidate.",
          buttonText: "Edit setup",
          onButtonClick: () => router.push("/onboarding"),
        }}
      />
    </Frame>
  );
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
            <div className="pick-probability"><span>MODEL PROBABILITY</span><strong>{percent(item.candidate.probability)}</strong></div>
          </div>
          <dl className="pick-evidence">
            <div><dt>Reference</dt><dd>{percent(item.candidate.referenceProbability)}</dd></div>
            <div><dt>Probability gap</dt><dd>{item.candidate.probabilityGap === undefined ? "—" : `${item.candidate.probabilityGap >= 0 ? "+" : ""}${(item.candidate.probabilityGap * 100).toFixed(1)} pts`}</dd></div>
            <div><dt>Policy decision</dt><dd>{item.decision.decision === "include" ? "Included" : "Abstained"}</dd></div>
          </dl>

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
            <h3>{position ? "Added to your demo." : canSimulate ? "Add this pick to your demo?" : "This outcome was not included."}</h3>
            <p>{position ? `${credits(position.virtualAllocation)} from your virtual credits is allocated to this pick.` : canSimulate ? `This allocates ${run.preferences.allocationPercent}% of your available credits, or ${credits(estimatedAllocation)}.` : item.decision.reason}</p>
          </div>
          <div className="pick-actions">
            {position
              ? <Link href="/portfolio" className="button button-dark">View portfolio</Link>
              : canSimulate ? <LiquidButton onClick={acceptDemoPick}>Add to demo <span>→</span></LiquidButton> : <Link href="/history" className="button button-outline">View decision history</Link>}
            {(position || canSimulate) && <button type="button" className="button button-outline" onClick={position ? () => router.push("/forecasts") : declineDemoPick}>{position ? "Back to picks" : "Skip"}</button>}
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
  return <Frame eyebrow="VIRTUAL CREDITS" title="Portfolio" subtitle={`${run.preferences.allocationPercent}% of your available credits is allocated when you add a pick`}>
    <div className="stat-grid">
      <article className="stat-card dark-stat"><span>AVAILABLE</span><strong>{credits(run.availableCredits)}</strong><small>virtual credits</small></article>
      <article className="stat-card"><span>IN PICKS</span><strong>{credits(total)}</strong><small>across {positions.length} picks</small></article>
      <article className="stat-card"><span>OPEN</span><strong>{active.length}</strong><small>waiting for a result</small></article>
      <article className="stat-card"><span>SETTLED</span><strong>{resolved.length}</strong><small>finished picks</small></article>
    </div>
    <div className="section-heading"><div><h2>Your picks</h2></div></div>
    {positions.length ? <div className="table-scroll ledger-table"><table><thead><tr><th>EVENT / OUTCOME</th><th>STATUS</th><th>RISK</th><th>CONFIDENCE</th><th>DEMO AMOUNT</th><th>CREATED</th></tr></thead><tbody>{positions.map((position) => <tr key={position.id}>
      <td data-label="Event / outcome"><Link prefetch={false} className="table-event" href={`/forecast/${encodeURIComponent(`${position.eventId}::${position.outcome}`)}`}>{run.evaluated.find((item) => item.event.id === position.eventId)?.event.title ?? position.eventId}<small>{position.outcome}</small></Link></td>
      <td data-label="Status"><span className={`status-pill ${position.status}`}>{position.status}</span></td>
      <td data-label="Risk"><RiskPill>{position.riskProfile}</RiskPill></td>
      <td data-label="Confidence">{percent(position.probability)}</td>
      <td data-label="Demo amount">{credits(position.virtualAllocation)}</td>
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
  return <Frame eyebrow="PAST PICKS" title="History" action={<Link href="/performance" className="button button-outline">Performance <Icon name="arrow" /></Link>}>
    <div className="history-filters">{filters.map((filter) => <label key={filter.label}>{filter.label}<select value={filter.value} onChange={(event) => filter.set(event.target.value)}>{filter.options.map((option) => <option key={option} value={option}>{option === "all" ? "All" : option.replace("_", " ")}</option>)}</select></label>)}<span>{filtered.length} records</span></div>
    <div className="table-scroll ledger-table history-table"><table><thead><tr><th>EVENT</th><th>CATEGORY</th><th>RISK</th><th>SHOWN</th><th>ALLOCATION</th><th>PREDICTION</th><th>RESULT</th><th>WHY</th></tr></thead><tbody>{filtered.map((item) => {
      const allocation = positions.get(item.candidate.id)?.virtualAllocation;
      return <tr key={item.candidate.id}>
      <td data-label="Event"><Link prefetch={false} className="table-event" href={`/forecast/${encodeURIComponent(`${item.event.id}::${item.candidate.outcome}`)}`}>{item.event.title}<small>{date(item.event.startTime)}</small></Link></td>
      <td data-label="Category">{item.event.category}</td>
      <td data-label="Risk">{item.candidate.riskBand}</td>
      <td data-label="Decision"><span className={item.decision.decision === "include" ? "decision-yes" : "decision-no"}>{item.decision.decision}</span></td>
      <td data-label="Allocation">{allocation === undefined ? "No position" : credits(allocation)}</td>
      <td data-label="Prediction">{item.candidate.outcome} · {percent(item.candidate.probability)}</td>
      <td data-label="Result">{resolutions.has(item.event.id) ? (resolutions.get(item.event.id) === item.candidate.outcome ? "Correct" : "Incorrect") : "Pending"}</td>
      <td data-label="Why" className="rationale-cell">{item.decision.reason}</td>
    </tr>;
    })}</tbody></table></div>
  </Frame>;
}

function Performance() {
  const { run } = useAgent();
  if (!run) return <Frame eyebrow="DEMO DATA" title="Performance"><Empty /></Frame>;
  const summary = summarize(run);
  const scores = [
    { label: "Included forecasts", data: summary.includedForecasts },
    { label: "All forecasts", data: summary.allForecasts },
  ];
  return <Frame eyebrow="DEMO DATA / ANALYTICS" title="Performance" subtitle="Resolved fictional outcomes only. These metrics do not demonstrate real-world predictive ability." action={<Link href="/history" className="button button-outline">View history</Link>}>
    <div className="performance-alert"><span><Icon name="info" /></span><p>Calibration and accuracy use resolved demo outcomes. Pending events are excluded; small samples can vary substantially.</p></div>
    <p className="sample-count">{summary.resolved} resolved candidate forecasts · {summary.abstention.abstained} of {summary.abstention.denominator} selected-band candidates abstained</p>
    <div className="score-grid">{scores.map(({ label, data }) => <section className="score-card" key={label}>
      <span>{label}</span><div className="score-metrics">
        <div><strong>{percent(data.accuracy)}</strong><small>ACCURACY</small></div>
        <div><strong>{data.brierScore === null ? "—" : data.brierScore.toFixed(3)}</strong><small>BRIER SCORE</small></div>
      </div>
      <small className="sample-count">{data.count} resolved candidates</small>
      <div className="calibration"><div className="calibration-head"><span>MODEL PROBABILITY</span><span>OBSERVED FREQUENCY</span></div>
        {data.calibration.map((bucket) => <div className="calibration-row" key={bucket.label}>
          <span>{bucket.label}%</span><div className="calibration-track">
            {bucket.predictedMean !== null && <i style={{ left: `${bucket.predictedMean * 100}%` }} />}
            {bucket.observedFrequency !== null && <b style={{ left: `${bucket.observedFrequency * 100}%` }} />}
          </div><span>{bucket.count ? `${percent(bucket.predictedMean)} / ${percent(bucket.observedFrequency)}` : "No resolved samples"} <small>· {bucket.count}</small></span>
        </div>)}
      </div>
      <div className="calibration-legend"><span><i /> Prediction</span><span><b /> Observed</span></div>
    </section>)}</div>
    <details className="metric-notes"><summary>How these metrics are calculated</summary><p>Included accuracy is the share of included candidates whose outcome occurred. All-forecast accuracy uses the 50% decision threshold. Brier score averages squared probability error; lower is better. Calibration groups forecasts by probability band and compares predicted probability with observed frequency. All numbers use deterministic demo data, not live results.</p></details>
  </Frame>;
}

function RouteContent() {
  const pathname = useRoutePath();
  const { hydrated } = useAgent();
  if (pathname !== "/" && pathname !== "/onboarding" && !hydrated) {
    return <Frame eyebrow="DEMO DATA" title="Restoring your snapshot"><p className="page-subtitle" role="status">Loading this browser’s local simulation.</p></Frame>;
  }
  if (pathname === "/") return <LandingExperience/>;
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
