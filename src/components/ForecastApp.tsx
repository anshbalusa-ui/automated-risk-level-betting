"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAgent } from "@/components/AgentProvider";
import { summarize } from "@/lib/analytics";
import type { Category, EvaluatedCandidate, Preferences } from "@/lib/domain";
import { demoEvents, demoForecasts } from "@/lib/fixtures";

import MorphOrb from "@/components/ui/ai-thiking-orb-and-input";
const nav = [
  { href: "/dashboard", label: "Overview", icon: "overview" },
  { href: "/forecasts", label: "Forecasts", icon: "forecast" },
  { href: "/portfolio", label: "Portfolio", icon: "portfolio" },
  { href: "/history", label: "History", icon: "history" },
  { href: "/performance", label: "Performance", icon: "performance" },
] as const;
function Icon({ name }: { name: (typeof nav)[number]["icon"] | "sports" | "weather" | "arrow" }) {
  const paths = {
    overview: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    forecast: <><path d="M3 19h18M5 15l5-5 4 3 5-7" /><path d="M16 6h3v3" /></>,
    portfolio: <><rect x="3" y="6" width="18" height="15" rx="2" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M3 12h18" /></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></>,
    performance: <><path d="M3 20h18M5 17v-5M10 17V7M15 17v-8M20 17V4" /></>,
    sports: <><circle cx="12" cy="12" r="9" /><path d="M4.5 7.5c4 2 10.5 7 15 9M9 3.5c-.6 4.5-2 9.5-4.5 13M16 4c-.5 5 0 10 3 13" /></>,
    weather: <><path d="M4 17h15a3 3 0 0 0 .2-6A6 6 0 0 0 7.5 10 3.5 3.5 0 0 0 4 17ZM12 2v2M3 5l2 2M21 5l-2 2" /></>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
  };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
const number = (value: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
const percent = (value: number | null | undefined) => typeof value === "number" ? `${(value * 100).toFixed(1)}%` : "—";
const date = (value: string) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const ForecastList = ({ items }: { items: EvaluatedCandidate[] }) => {
  const { run } = useAgent();
  if (!items.length) return <div className="empty-inline">No forecasts in this snapshot.</div>;
  return <div className="forecast-list">{items.map((entry) => {
    const resolved = run?.resolutions.some((resolution) => resolution.eventId === entry.event.id) ?? false;
    const gap = entry.candidate.probabilityGap;
    return <Link href={`/forecast/${encodeURIComponent(`${entry.event.id}::${entry.candidate.outcome}`)}`} prefetch={false} key={entry.candidate.id} className="forecast-row">
      <div className="event-category"><span className="category-symbol"><Icon name={entry.event.category} /></span><span>{entry.event.category}<small>{resolved ? "Resolved event" : entry.event.interests.join(" · ")}</small></span></div>
      <div className="forecast-name"><strong>{entry.event.title}</strong><small>{entry.candidate.outcome}</small></div>
      <div className="forecast-outcome"><span>MODEL PROBABILITY</span><strong>{percent(entry.candidate.probability)}</strong></div>
      <div className="forecast-reference"><span>REFERENCE</span><strong>{percent(entry.reference?.probability)}</strong></div>
      <div className="forecast-gap"><span>GAP</span><strong>{gap === undefined ? "—" : `${gap >= 0 ? "+" : ""}${number(gap * 100)} pts`}</strong></div>
      <div className="decision-cell"><span className={entry.decision.decision === "include" ? "decision-yes" : "decision-no"}>{entry.decision.decision === "include" ? "Included" : "Abstained"}</span><small>{entry.decision.reason}</small></div>
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
        <Link href="/" className="brand"><span className="brand-symbol">F</span><span>FIELDNOTE<small>FORECAST STUDIO</small></span></Link>
        <div className="sidebar-label">WORKSPACE</div>
        <nav aria-label="Main navigation">{nav.map((item) => (
          <Link key={item.href} href={item.href} aria-current={pathname.startsWith(item.href) || (item.href === "/forecasts" && pathname.startsWith("/forecast/")) ? "page" : undefined} className={`nav-link ${pathname.startsWith(item.href) || (item.href === "/forecasts" && pathname.startsWith("/forecast/")) ? "active" : ""}`}>
            <span className="nav-index"><Icon name={item.icon} /></span>{item.label}
          </Link>
        ))}</nav>
        <div className="side-bottom">
          <div className="demo-mark"><span className="status-dot" /> DEMO ENVIRONMENT</div>
          <p>Forecasts are simulations for exploration, not advice.</p>
          <Link className="text-link" href="/onboarding">Edit preferences ↗</Link>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <span className="crumb">SIMULATION / {pathname.startsWith("/forecast/") ? "FORECASTS" : nav.find((item) => pathname.startsWith(item.href))?.label.toUpperCase() ?? "WORKSPACE"}</span>
          <div className="topbar-right">
            <span className="run-state"><i /> {run ? "RUN SNAPSHOT READY" : "SETUP REQUIRED"}</span>
            <Link href="/onboarding" className="avatar-link" aria-label="Edit setup">↗</Link>
          </div>
        </header>
        <div className="page-content">
          <div className="page-heading">
            <div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{subtitle && <p className="page-subtitle">{subtitle}</p>}</div>
            {action && <div className="heading-action">{action}</div>}
          </div>
          {children}
          <footer className="page-footer"><span>FIELDNOTE · A SIMULATION-ONLY FORECASTING AGENT</span><span>DEMO DATA · NOT FINANCIAL ADVICE</span></footer>
        </div>
      </main>
    </div>
  );
}
function Empty({ title = "Your workspace is ready when you are", text = "Choose a few preferences to create a deterministic demo run." }: { title?: string; text?: string }) { return <section className="empty-state"><h2>{title}</h2><p>{text}</p><Link className="button button-dark" href="/onboarding">Set up your agent <Icon name="arrow" /></Link></section>; }
function Badge({ children }: { children: React.ReactNode }) { return <span className="badge">{children}</span>; }
function RiskPill({ children }: { children: string }) { return <span className={`risk-pill risk-${children.toLowerCase().replaceAll(" ", "-")}`}>{children}</span>; }

function Onboard() {
  const router = useRouter(); const { preferences, savePreferences, startAgent, hydrated, run } = useAgent();
  const [step, setStep] = useState(0); const [ready, setReady] = useState(false); const [form, setForm] = useState<Preferences>(() => ({ ...preferences, categories: [...preferences.categories], interests: [...preferences.interests] }));
  const initialized = useRef(false);
  useEffect(() => {
    if (hydrated && !initialized.current) {
      setForm({ ...preferences, categories: [...preferences.categories], interests: [...preferences.interests] });
      setReady(true);
      initialized.current = true;
    }
  }, [hydrated, preferences]);
  useEffect(() => { if (ready) savePreferences(form); }, [form, ready, savePreferences]);
  const toggleCategory = (category: Category) => setForm((current) => ({ ...current, categories: current.categories.includes(category) ? current.categories.filter((x) => x !== category) : [...current.categories, category] }));
  const steps = ["Topics", "Interests", "Approach", "Review"];
  function finish(text: string) {
    const interests = text.split(",").map((interest) => interest.trim()).filter(Boolean);
    const next = { ...form, interests };
    setForm(next);
    savePreferences(next);
    startAgent(next);
  }
  return (
    <div className="onboard-wrap">
      <header className="onboard-header">
        <Link href="/" className="brand"><span className="brand-symbol">F</span><span>FIELDNOTE<small>FORECAST STUDIO</small></span></Link>
        <Badge>DEMO DATA</Badge>
      </header>
      <div className="onboard-layout">
        <aside className="onboard-aside">
          <div className="eyebrow">A THOUGHTFUL START</div>
          <h1>Set the<br />conditions.</h1>
          <p>Shape a small simulation around the questions you care about. You can change everything later.</p>
          <div className="step-list" aria-label="Setup steps">
            {steps.map((label, index) => (
              <button key={label} type="button" aria-current={step === index ? "step" : undefined} onClick={() => setStep(index)} className={`step-item ${step === index ? "current" : ""}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>{label}<i>{index < step ? "✓" : ""}</i>
              </button>
            ))}
          </div>
        </aside>
        <section className="onboard-card" aria-label="Configure your agent">
          <div className="eyebrow">STEP {String(step + 1).padStart(2, "0")} / 04</div>
          {step === 0 && <>
            <h2>What should we explore?</h2>
            <p className="section-copy">Select one or both forecast categories.</p>
            <div className="option-grid" role="group" aria-label="Categories">
              {(["sports", "weather"] as const).map((category) => (
                <button key={category} type="button" className={`choice-card ${form.categories.includes(category) ? "selected" : ""}`} aria-pressed={form.categories.includes(category)} onClick={() => toggleCategory(category)}>
                  <span className="choice-icon"><Icon name={category} /></span>
                  <strong>{category === "sports" ? "Sports" : "Weather"}</strong>
                  <small>{category === "sports" ? "NBA match outcomes" : "Local conditions & daily outlooks"}</small>
                  <i>{form.categories.includes(category) ? "✓" : "+"}</i>
                </button>
              ))}
            </div>
          </>}
          {step === 1 && <>
            <h2>Make it feel relevant.</h2>
            <p className="section-copy">Choose the interests that personalize the demo feed.</p>
            <label className="field-label" htmlFor="team">TEAM OR PLACE</label>
            <input id="team" className="text-input" value={form.interests[0] ?? ""} onChange={(event) => setForm((current) => ({ ...current, interests: event.target.value.trim() ? [event.target.value] : [] }))} placeholder="Warriors or San Francisco" />
            <div className="hint">Editing this field replaces the current interests. Use the buttons to combine them.</div>
            <div className="preset-row">
              <button type="button" onClick={() => setForm((current) => ({ ...current, interests: ["NBA", "Warriors", "San Francisco"] }))}>Use demo defaults</button>
              <button type="button" onClick={() => setForm((current) => ({ ...current, interests: current.interests.includes("San Francisco") ? current.interests : [...current.interests, "San Francisco"] }))}>+ San Francisco</button>
            </div>
            <p className="hint">Active interests: {form.interests.join(" · ") || "All events in selected categories"}</p>
          </>}
          {step === 2 && <>
            <h2>Choose your approach.</h2>
            <p className="section-copy">Each risk profile targets its own probability band. Evidence can still make the agent abstain.</p>
            <div className="choice-stack" role="group" aria-label="Risk profile">
              {(["low", "medium", "high"] as const).map((risk) => (
                <button type="button" key={risk} onClick={() => setForm((current) => ({ ...current, riskProfile: risk }))} aria-pressed={form.riskProfile === risk} className={`risk-choice ${form.riskProfile === risk ? "selected" : ""}`}>
                  <RiskPill>{risk}</RiskPill>
                  <span><strong>{risk === "low" ? "60%+ · More selective" : risk === "medium" ? "40–59% · Balanced" : "15–39% · More exploratory"}</strong>
                    <small>{risk === "low" ? "Highest evidence bar" : risk === "medium" ? "Measured uncertainty" : "Lower-probability outcomes, greater volatility"}</small></span>
                  <i>{form.riskProfile === risk ? "✓" : "○"}</i>
                </button>
              ))}
            </div>
            <div className="setting-row">
              <div><strong>Run mode</strong><small>Review qualifying candidates or reserve virtual credits automatically</small></div>
              <label className="switch-label"><input type="checkbox" checked={form.mode === "auto-simulate"} onChange={(event) => setForm((current) => ({ ...current, mode: event.target.checked ? "auto-simulate" : "review" }))} /><span>{form.mode === "auto-simulate" ? "Auto-simulate" : "Review"}</span></label>
            </div>
            <div className="setting-row">
              <div><strong>Starting credits</strong><small>Virtual units for this simulation only</small></div>
              <select aria-label="Starting credits" value={form.initialBankroll} onChange={(event) => setForm((current) => ({ ...current, initialBankroll: Number(event.target.value) }))}>
                <option value={500}>500 credits</option><option value={1000}>1,000 credits</option><option value={2500}>2,500 credits</option>
              </select>
            </div>
          </>}
          {step === 3 && <>
            <h2>Run a local scan.</h2>
            <p className="section-copy">Your choices are the brief. The agent evaluates deterministic demo events against them.</p>
            <div className="review-list">
              <div><span>Categories</span><strong>{form.categories.length ? form.categories.join(" + ") : "None selected"}</strong></div>
              <div><span>Risk profile</span><strong>{form.riskProfile} · {form.riskProfile === "low" ? "60%+" : form.riskProfile === "medium" ? "40–59%" : "15–39%"}</strong></div>
              <div><span>Mode</span><strong>{form.mode === "auto-simulate" ? "Auto-simulate" : "Review"}</strong></div>
              <div><span>Virtual credits</span><strong>{number(form.initialBankroll)} credits</strong></div>
            </div>
            {ready && form.categories.length > 0
              ? <MorphOrb initialInterests={form.interests.join(", ")} run={run} onSubmit={finish} onOpen={() => router.push("/dashboard")} />
              : <p className="notice">Choose at least one category before starting the agent.</p>}
            <p className="notice">DEMO DATA · Local simulation only. No account or real-world transaction.</p>
          </>}
          <div className="onboard-actions">
            <button className="button button-quiet" onClick={() => step === 0 ? router.push("/") : setStep(step - 1)}>{step === 0 ? "Back to home" : "← Back"}</button>
            {step < 3 && <button className="button button-dark" disabled={step === 0 && form.categories.length === 0} onClick={() => setStep(step + 1)}>Continue <span>→</span></button>}
          </div>
        </section>
      </div>
      <div className="onboard-foot">SIMULATION ONLY · NO LOGIN REQUIRED</div>
    </div>
  );
}
function Dashboard() {
 const { run } = useAgent(); if (!run) return <Frame eyebrow="YOUR WORKSPACE" title="A clear view, at a glance."><Empty/></Frame>;
 const abstained = run.activity.abstained;
 const active = run.positions.filter((position) => position.status === "active"); const resolved = run.positions.filter((position) => position.status === "resolved");
 const upcoming = run.evaluated.filter((item) => Date.parse(item.event.startTime) > Date.parse(run.generatedAt) && item.candidate.riskBand === run.preferences.riskProfile);
 const preferred = [
   upcoming.find((item) => item.event.category === "sports" && item.decision.decision === "include"),
   upcoming.find((item) => item.event.category === "weather" && item.decision.decision === "include"),
   upcoming.find((item) => item.decision.decision === "abstain" && /uncertainty/i.test(item.decision.reason)),
 ].filter((item): item is EvaluatedCandidate => item !== undefined);
 const featured = [...preferred, ...upcoming.filter((item) => !preferred.includes(item))].slice(0, 3);
 return <Frame eyebrow={`AGENT SNAPSHOT · ${date(run.generatedAt).toUpperCase()}`} title="What the agent found." subtitle={`${run.preferences.riskProfile.toUpperCase()} RISK · ${run.preferences.categories.join(" + ").toUpperCase()} · ${run.preferences.mode === "auto-simulate" ? "AUTO-SIMULATE" : "REVIEW"}`} action={<Link href="/onboarding" className="button button-outline">Edit setup <Icon name="arrow" /></Link>}>
   <section className="scan-panel" aria-label="Agent scan">
     <div className="scan-intro"><div><div className="eyebrow">AGENT SCAN / DEMO DATA</div><h2>From event to decision.</h2><p>A candidate can match your risk band and still fail the evidence policy.</p></div><span className="scan-date">RUN {date(run.generatedAt)}</span></div>
     <div className="scan-steps">
       <div><strong>{run.activity.scanned}</strong><span>Events scanned</span></div>
       <div><strong>{run.activity.relevant}</strong><span>Relevant</span></div>
       <div><strong>{run.activity.bandMatched}</strong><span>Band matched</span></div>
       <div className="scan-included"><strong>{run.activity.included}</strong><span>Included</span></div>
       <div><strong>{abstained}</strong><span>Abstained</span></div>
     </div>
   </section>
   <div className="section-heading"><div><div className="eyebrow">CURRENT SIGNALS</div><h2>Forecasts to inspect</h2></div><Link href="/forecasts" className="text-link">View register <Icon name="arrow" /></Link></div>
   {featured.length ? <ForecastList items={featured}/> : <div className="empty-inline">No upcoming candidates in the selected risk band. Open the full register to review this run.</div>}
   <div className="dashboard-bottom">
     <section className="panel simulation-summary"><div className="eyebrow">SIMULATION PORTFOLIO</div><h3>{number(run.availableCredits)} <small>available credits</small></h3><p>{active.length} active positions · {resolved.length} resolved · {number(run.initialBankroll)} starting credits</p><Link className="text-link" href="/portfolio">Open portfolio <Icon name="arrow" /></Link></section>
     <section className="panel"><div className="eyebrow">YOUR SETUP</div><h3>{run.preferences.riskProfile} · {run.preferences.mode === "auto-simulate" ? "Auto-simulate" : "Review"}</h3><p>{run.preferences.categories.join(" + ")} · {run.preferences.interests.join(" / ") || "No interests selected"}</p><Link className="text-link" href="/onboarding">Edit preferences <Icon name="arrow" /></Link></section>
   </div>
 </Frame>;
}
function Forecasts() {
  const { run } = useAgent();
  const [filter, setFilter] = useState("all");
  if (!run) return <Frame eyebrow="PREDICTION REGISTER" title="Forecasts, with the why." subtitle="Each outcome includes a policy decision and uncertainty context."><Empty /></Frame>;
  const items = filter === "all" ? run.evaluated : run.evaluated.filter((item) => item.decision.decision === filter);
  return (
    <Frame eyebrow="PREDICTION REGISTER" title="Forecasts, with the why." subtitle={`${run.evaluated.length} evaluated candidates · DEMO DATA`}>
      <div className="filter-bar">
        <div className="filter-tabs" role="group" aria-label="Filter forecasts">
          {([["all", "All"], ["include", "Included"], ["abstain", "Abstained"]] as const).map(([value, label]) => (
            <button key={value} type="button" aria-pressed={filter === value} className={filter === value ? "selected" : ""} onClick={() => setFilter(value)}>{label}</button>
          ))}
        </div>
        <span>{items.length} shown</span>
      </div>
      <ForecastList items={items} />
    </Frame>
  );
}
function ForecastDetail({ id }: { id: string }) {
  const { run } = useAgent();
  const [eventId, outcome] = decodeURIComponent(id).split("::");
  const item = run?.evaluated.find((entry) => entry.event.id === eventId && entry.candidate.outcome === outcome);
  if (!run || !item) return <Frame eyebrow="FORECAST DETAIL" title="Forecast not found"><Empty title="This forecast is not in your snapshot" text="The selected forecast may belong to another demo run." /></Frame>;
  const position = run.positions.find((entry) => entry.candidateId === item.candidate.id);
  const resolution = run.resolutions.find((entry) => entry.eventId === item.event.id);
  const gap = item.candidate.probabilityGap;
  return (
    <Frame eyebrow={`${item.event.category.toUpperCase()} / FORECAST DETAIL`} title={item.event.title} subtitle={item.event.description} action={<Link href="/forecasts" className="button button-outline">← All forecasts</Link>}>
      <div className="detail-grid">
        <section className="panel forecast-detail-main">
          <div className="detail-overline"><Badge>{item.event.category}</Badge><Badge>{item.forecast.modelVersion}</Badge></div>
          <div className="eyebrow detail-label">MODEL FORECAST · {item.candidate.outcome.toUpperCase()}</div>
          <div className="probability-display">{percent(item.candidate.probability)}</div>
          <div className="outcome-label">Outcome: {item.candidate.outcome}</div>
          <div className="probability-track"><i style={{ width: `${item.candidate.probability * 100}%` }} /></div>
          <div className="detail-kpis">
            <div><span>REFERENCE</span><strong>{item.reference ? percent(item.reference.probability) : "Unavailable"}</strong></div>
            <div><span>PROBABILITY GAP</span><strong>{gap === undefined ? "Unavailable" : `${gap >= 0 ? "+" : ""}${number(gap * 100)} pts`}</strong></div>
            <div><span>RISK BAND</span><strong>{item.candidate.riskBand}</strong></div>
            <div><span>UNCERTAINTY</span><strong>{percent(item.forecast.uncertainty)}</strong></div>
            <div><span>DATA QUALITY</span><strong>{percent(item.candidate.dataQuality)}</strong></div>
          </div>
          <p className="muted-note">Data captured {new Date(item.event.dataCapturedAt).toLocaleString()} · {item.event.source}</p>
        </section>
        <section className="panel decision-panel">
          <div className="eyebrow">POLICY DECISION</div>
          <h3 className={item.decision.decision === "include" ? "decision-yes" : "decision-no"}>{item.decision.decision === "include" ? "Included" : "Abstained"}</h3>
          <p>{item.decision.reason}</p>
          <dl className="detail-definition">
            <div><dt>Selected profile</dt><dd>{item.decision.profile}</dd></div>
            <div><dt>Risk score</dt><dd>{number(item.decision.riskScore)}</dd></div>
            <div><dt>Virtual allocation</dt><dd>{position ? `${number(position.virtualAllocation)} credits · ${position.status}` : "No position created"}</dd></div>
            <div><dt>Policy version</dt><dd>{item.decision.policyVersion}</dd></div>
            <div><dt>Model version</dt><dd>{item.forecast.modelVersion}</dd></div>
          </dl>
        </section>
        <section className="panel factors-panel">
          <div className="eyebrow">WHY THE MODEL ASSIGNED THIS PROBABILITY</div>
          <h3>Structured forecast factors</h3>
          <div className="factor-list">{item.forecast.factors.map((factor) => (
            <article key={factor.name}><i className={`factor-dot factor-${factor.direction}`} /><div><strong>{factor.name}</strong><p>{factor.description}</p></div><span>{factor.direction}</span></article>
          ))}</div>
        </section>
        <section className="panel context-panel">
          <div className="eyebrow">DATA &amp; RESOLUTION</div>
          <h3>Pre-event snapshot</h3>
          <dl className="detail-definition">
            <div><dt>Generated at</dt><dd>{new Date(item.forecast.generatedAt).toLocaleString()}</dd></div>
            <div><dt>Event starts</dt><dd>{new Date(item.event.startTime).toLocaleString()}</dd></div>
            <div><dt>Resolution time</dt><dd>{new Date(item.event.resolutionTime).toLocaleString()}</dd></div>
            <div><dt>Reference provider</dt><dd>{item.reference?.provider ?? "Unavailable"}</dd></div>
            <div><dt>Reference captured</dt><dd>{item.reference ? new Date(item.reference.capturedAt).toLocaleString() : "Unavailable"}</dd></div>
            <div><dt>Result</dt><dd>{resolution ? `${resolution.actualOutcome} · ${resolution.actualOutcome === item.candidate.outcome ? "Correct" : "Incorrect"}` : "Pending"}</dd></div>
          </dl>
          <p className="muted-note">Synthetic DEMO DATA. Model probability and policy rationale are independent.</p>
        </section>
      </div>
    </Frame>
  );
}
function Portfolio() {
  const { run } = useAgent();
  if (!run) return <Frame eyebrow="SIMULATION LEDGER" title="Allocation, kept transparent."><Empty/></Frame>;
  const positions = run.positions;
  const active = positions.filter((position) => position.status === "active");
  const resolved = positions.filter((position) => position.status === "resolved");
  const total = positions.reduce((sum, position) => sum + position.virtualAllocation, 0);
  return <Frame eyebrow="SIMULATION LEDGER" title="Allocation, kept transparent." subtitle="Virtual credits only · balances come from the current deterministic run.">
    <div className="stat-grid">
      <article className="stat-card dark-stat"><span>AVAILABLE</span><strong>{number(run.availableCredits)}</strong><small>virtual credits</small><b>SIMULATION</b></article>
      <article className="stat-card"><span>ALLOCATED</span><strong>{number(total)}</strong><small>across {positions.length} positions</small></article>
      <article className="stat-card"><span>ACTIVE</span><strong>{active.length}</strong><small>unresolved positions</small></article>
      <article className="stat-card"><span>RESOLVED</span><strong>{resolved.length}</strong><small>in this run</small></article>
    </div>
    <div className="section-heading"><div><div className="eyebrow">POSITION REGISTER</div><h2>By event</h2></div><Badge>DEMO DATA</Badge></div>
    {positions.length ? <div className="table-scroll ledger-table"><table><thead><tr><th>EVENT / OUTCOME</th><th>STATUS</th><th>RISK</th><th>MODEL PROBABILITY</th><th>VIRTUAL ALLOCATION</th><th>CREATED</th></tr></thead><tbody>{positions.map((position) => <tr key={position.id}>
      <td data-label="Event / outcome"><Link prefetch={false} className="table-event" href={`/forecast/${encodeURIComponent(`${position.eventId}::${position.outcome}`)}`}>{run.evaluated.find((item) => item.event.id === position.eventId)?.event.title ?? position.eventId}<small>{position.outcome}</small></Link></td>
      <td data-label="Status"><span className={`status-pill ${position.status}`}>{position.status}</span></td>
      <td data-label="Risk"><RiskPill>{position.riskProfile}</RiskPill></td>
      <td data-label="Model probability">{percent(position.probability)}</td>
      <td data-label="Virtual allocation">{number(position.virtualAllocation)} credits</td>
      <td data-label="Created">{date(position.createdAt)}</td>
    </tr>)}</tbody></table></div> : <div className="empty-inline">No positions were created by the current policy. Abstentions remain visible in <Link href="/forecasts">forecasts</Link>.</div>}
    <div className="allocation-note"><strong>Allocation method</strong><span>Position sizes and available credits are determined by the simulation policy. No real-world funds or transactions are used.</span></div>
  </Frame>;
}
function History() {
  const { run } = useAgent();
  const [category, setCategory] = useState("all");
  const [risk, setRisk] = useState("all");
  const [decision, setDecision] = useState("all");
  const [result, setResult] = useState("all");
  if (!run) return <Frame eyebrow="EVENT JOURNAL" title="A record of every decision."><Empty/></Frame>;
  const resolutions = new Map(run.resolutions.map((resolution) => [resolution.eventId, resolution.actualOutcome]));
  const filtered = run.evaluated.filter((item) => {
    const actual = resolutions.get(item.event.id);
    const outcome = actual === undefined ? "pending" : item.candidate.outcome === actual ? "correct" : "incorrect";
    return (category === "all" || item.event.category === category) && (risk === "all" || item.candidate.riskBand === risk) && (decision === "all" || item.decision.decision === decision) && (result === "all" || outcome === result);
  });
  const filters: { value: string; set: (value: string) => void; label: string; options: string[] }[] = [
    { value: category, set: setCategory, label: "Category", options: ["all", "sports", "weather"] },
    { value: risk, set: setRisk, label: "Risk", options: ["all", "low", "medium", "high", "very_high"] },
    { value: decision, set: setDecision, label: "Decision", options: ["all", "include", "abstain"] },
    { value: result, set: setResult, label: "Result", options: ["all", "pending", "correct", "incorrect"] },
  ];
  return <Frame eyebrow="EVENT JOURNAL" title="A record of every decision." subtitle="Includes model outcomes, policy choices, and resolved results for this run.">
    <div className="history-filters">{filters.map((filter) => <label key={filter.label}>{filter.label}<select value={filter.value} onChange={(event) => filter.set(event.target.value)}>{filter.options.map((option) => <option key={option} value={option}>{option === "all" ? "All" : option.replace("_", " ")}</option>)}</select></label>)}<span>{filtered.length} records</span></div>
    <div className="table-scroll ledger-table"><table><thead><tr><th>EVENT</th><th>CATEGORY</th><th>RISK</th><th>DECISION</th><th>MODEL OUTCOME</th><th>RESULT</th><th>RATIONALE</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.candidate.id}>
      <td data-label="Event"><Link prefetch={false} className="table-event" href={`/forecast/${encodeURIComponent(`${item.event.id}::${item.candidate.outcome}`)}`}>{item.event.title}<small>{date(item.event.startTime)}</small></Link></td>
      <td data-label="Category">{item.event.category}</td>
      <td data-label="Risk">{item.candidate.riskBand}</td>
      <td data-label="Decision"><span className={item.decision.decision === "include" ? "decision-yes" : "decision-no"}>{item.decision.decision}</span></td>
      <td data-label="Model outcome">{item.candidate.outcome} · {percent(item.candidate.probability)}</td>
      <td data-label="Result">{resolutions.has(item.event.id) ? (resolutions.get(item.event.id) === item.candidate.outcome ? "Correct" : "Incorrect") : "Pending"}</td>
      <td data-label="Rationale" className="rationale-cell">{item.decision.reason}</td>
    </tr>)}</tbody></table></div>
  </Frame>;
}
function Performance() {
  const { run } = useAgent();
  if (!run) return <Frame eyebrow="MODEL REVIEW" title="Measure the forecast, not the hype."><Empty/></Frame>;
  const summary = summarize(run);
  const groups = [...Object.entries(summary.byRisk), ...Object.entries(summary.byCategory)];
  return <Frame eyebrow="MODEL REVIEW" title="Measure the forecast, not the hype." subtitle="Evaluation uses this run’s actual resolutions. No seeded performance is presented as live." action={<Badge>DEMO DATA</Badge>}>
    <div className="performance-alert"><span>ⓘ</span><p>Scores are calculated only where this deterministic run has resolved outcomes. Small samples are descriptive, not proof of future accuracy.</p></div>
    <div className="section-heading"><div><div className="eyebrow">SCORING VIEW</div><h2>All forecasts vs. included</h2></div><span className="sample-count">{summary.resolved} resolved samples</span></div>
    <div className="score-grid">{[["All forecasts", summary.allForecasts], ["Policy included", summary.includedForecasts]].map(([label, value]) => { const data = value as typeof summary.allForecasts; return <article key={label as string} className="score-card"><span>{label as string}</span><div className="score-metrics"><div><strong>{data.accuracy === null ? "—" : percent(data.accuracy)}</strong><small>ACCURACY</small></div><div><strong>{data.brierScore === null ? "—" : data.brierScore.toFixed(3)}</strong><small>BRIER SCORE</small></div></div><div className="sample-count">n = {data.count} resolved</div><Calibration calibration={data.calibration}/></article>; })}</div>
    <div className="section-heading"><div><div className="eyebrow">SAMPLE COMPOSITION</div><h2>Where the data comes from</h2></div></div>
    <div className="breakdown-grid">{groups.map(([name, data], index) => <Breakdown key={`${index}-${name}`} title={name} data={data}/>)}</div>
    <div className="metric-notes"><strong>How to read these metrics</strong><p>Brier score is the mean squared error between forecast probabilities and resolved outcomes; lower is better. Calibration compares mean predicted probability with observed frequency for each probability range. Empty buckets are omitted; each bucket shows its sample size. Included forecasts are a policy-filtered subset of all evaluated forecasts.</p><p>Policy abstention: {summary.abstention.abstained} of {summary.abstention.denominator} selected-band candidates ({percent(summary.abstention.rate)}).</p></div>
  </Frame>;
}
function Calibration({ calibration }: { calibration: Array<{ label: string; predictedMean: number | null; observedFrequency: number | null; count: number }> }) {
  return <div className="calibration"><div className="calibration-head"><strong>CALIBRATION</strong><span>{calibration.reduce((n, row) => n + row.count, 0)} samples</span></div>{calibration.length ? calibration.map((row) => <div className="calibration-row" key={row.label}><span>{row.label}%</span><div className="calibration-track"><i style={{ left: `${(row.predictedMean ?? 0) * 100}%` }}/><b style={{ left: `${(row.observedFrequency ?? 0) * 100}%` }}/></div><span>{percent(row.predictedMean)} → {percent(row.observedFrequency)} <small>n={row.count}</small></span></div>) : <div className="no-samples">No resolved sample yet</div>}<div className="calibration-legend"><span><i/> predicted mean</span><span><b/> observed frequency</span></div></div>;
}
function Breakdown({ title, data }: { title: string; data: { evaluated: number; included: number; resolved: number; allForecasts: { accuracy: number | null; brierScore: number | null }; includedForecasts: { accuracy: number | null; brierScore: number | null } } }) {
  return <section className="panel breakdown"><div className="eyebrow">{title.toUpperCase()}</div><div className="breakdown-list"><div className="breakdown-counts"><span>{data.evaluated} evaluated</span><span>{data.included} included</span><span>{data.resolved} resolved</span></div><div><strong>All forecasts</strong><b>{data.allForecasts.accuracy === null ? "—" : percent(data.allForecasts.accuracy)}</b><small>accuracy</small><em>{data.allForecasts.brierScore === null ? "—" : data.allForecasts.brierScore.toFixed(3)} Brier</em></div><div><strong>Included</strong><b>{data.includedForecasts.accuracy === null ? "—" : percent(data.includedForecasts.accuracy)}</b><small>accuracy</small><em>{data.includedForecasts.brierScore === null ? "—" : data.includedForecasts.brierScore.toFixed(3)} Brier</em></div></div></section>;
}
function Landing() {
  const { run } = useAgent();
  const router = useRouter();
  const fixtureEvent = demoEvents[0];
  const preview = run?.evaluated.find((entry) => entry.event.id === fixtureEvent.id && entry.candidate.outcome === "Yes");
  const fixtureForecast = demoForecasts.find((forecast) => forecast.eventId === fixtureEvent.id);
  const previewEvent = preview?.event ?? fixtureEvent;
  const previewProbability = preview?.candidate.probability ?? fixtureForecast?.outcomes[0]?.probability ?? 0;
  const previewOutcome = preview?.candidate.outcome ?? fixtureForecast?.outcomes[0]?.outcome ?? previewEvent.outcomes[0];
  const previewUncertainty = preview?.forecast.uncertainty ?? fixtureForecast?.uncertainty ?? 0;
  function tryDemo() { router.push("/onboarding"); }
  return <div className="landing">
    <header className="landing-nav">
      <Link href="/" className="brand"><span className="brand-symbol">F</span><span>FIELDNOTE<small>FORECAST STUDIO</small></span></Link>
      <nav aria-label="Site navigation">{run && <Link href="/dashboard">Open workspace <span aria-hidden="true">↗</span></Link>}<Link href="/performance">Methodology</Link></nav>
      <button onClick={tryDemo} className="button button-dark">Configure setup <span aria-hidden="true">→</span></button>
    </header>
    <main>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><i/> FORECASTS, WITH THEIR WORK SHOWN</div>
          <h1>A clearer view<br/><em>of what might happen.</em></h1>
          <p>Fieldnote is a deterministic forecasting simulation: explore model estimates, set a risk policy, and see where it leads. No accounts. No real-world transactions.</p>
          <div className="hero-actions"><button onClick={tryDemo} className="button button-dark">Try the demo <span aria-hidden="true">→</span></button><Link href="/onboarding" className="quiet-link">Configure your setup <span aria-hidden="true">↗</span></Link></div>
          <div className="hero-caption"><span className="status-dot"/> PRIVATE BY DEFAULT <i/> SIMULATION ONLY</div>
        </div>
        <div className="signal-stage" role="img" aria-label={`Example forecast from demo data: ${previewEvent.title}, ${Math.round(previewProbability * 100)} percent probability for ${previewOutcome}.`}>
          <div className="signal-stage-head"><span>FIELDNOTE / SIGNAL STUDY 01</span><span>DEMO DATA · LOCAL</span></div>
          <div className="signal-orbit" aria-hidden="true"><div className="signal-dots"/><div className="signal-ring signal-ring-one"/><div className="signal-ring signal-ring-two"/><div className="signal-core"><span>MODEL<br/>ESTIMATE</span><strong>{Math.round(previewProbability * 100)}<small>%</small></strong></div><i className="signal-marker" style={{ left: `${50 + previewProbability * 28}%` }}/></div>
          <div className="signal-readout">
            <div className="signal-question"><span>{previewEvent.category.toUpperCase()} / FORECAST</span><strong>{previewEvent.title}</strong></div>
            <div className="signal-measure"><span>OUTCOME</span><strong>{previewOutcome}</strong></div>
            <div className="signal-measure"><span>UNCERTAINTY</span><strong>{percent(previewUncertainty)}</strong></div>
          </div>
          <div className="signal-axis"><span>0</span><i><b style={{ left: `${previewProbability * 100}%` }}/></i><span>100%</span></div>
          <div className="signal-stage-foot"><span>EXAMPLE FROM THE LOCAL FIXTURE</span><span>NOT A LIVE PREDICTION</span></div>
        </div>
      </section>
      <section className="landing-note">
        <div className="ledger-heading"><div className="eyebrow">A PRACTICAL MODEL, NOT A BLACK BOX</div><span>THREE STEPS / NO AUTOMATION CLAIMS</span></div>
        <div className="note-columns">
          <article><span>01 / OBSERVE</span><h2>Start with a question.</h2><p>Choose the topics and interests that shape a focused, reproducible simulation.</p></article>
          <article><span>02 / SET A POLICY</span><h2>Make your limits visible.</h2><p>Review candidates against your chosen risk level; see inclusion and abstention with a rationale.</p></article>
          <article><span>03 / REVIEW</span><h2>Measure what resolved.</h2><p>Calibration and Brier scores include sample sizes. Unresolved events are not counted as results.</p></article>
        </div>
      </section>
      <section className="landing-cta"><div><div className="eyebrow">YOUR SETUP STAYS IN THIS BROWSER</div><h2>Choose what to examine.<br/>Keep the assumptions in view.</h2></div><Link href="/onboarding" className="button button-light">Configure setup <span aria-hidden="true">→</span></Link></section>
    </main>
    <footer className="landing-footer"><span>FIELDNOTE / FORECAST STUDIO</span><span>DEMO DATA · SIMULATION ONLY · NO FINANCIAL ADVICE</span></footer>
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
