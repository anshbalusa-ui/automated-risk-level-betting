"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAgent } from "@/components/AgentProvider";
import { LandingExperience } from "@/components/landing/LandingExperience";
import { summarize } from "@/lib/analytics";
import type { Category, EvaluatedCandidate, Preferences } from "@/lib/domain";

const nav = [{ href: "/dashboard", label: "Overview", mark: "01" }, { href: "/forecasts", label: "Forecasts", mark: "02" }, { href: "/portfolio", label: "Portfolio", mark: "03" }, { href: "/history", label: "History", mark: "04" }, { href: "/performance", label: "Performance", mark: "05" }];
const number = (value: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
const percent = (value: number | null | undefined) => typeof value === "number" ? `${(value * 100).toFixed(1)}%` : "—";
const date = (value: string) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const ForecastList = ({ items }: { items: EvaluatedCandidate[] }) => {
  const { run } = useAgent();
  if (!items.length) return <div className="empty-inline">No forecasts in this snapshot.</div>;
  return <div className="forecast-list">{items.map((entry) => {
    const resolved = run?.resolutions.some((resolution) => resolution.eventId === entry.event.id) ?? false;
    return <Link href={`/forecast/${encodeURIComponent(`${entry.event.id}::${entry.candidate.outcome}`)}`} prefetch={false} key={entry.candidate.id} className="forecast-row">
      <div className="event-category"><span className="category-symbol">{entry.event.category === "sports" ? "◉" : "☼"}</span><span>{entry.event.category}<small>{resolved ? "Resolved event" : entry.event.interests.join(" · ")}</small></span></div>
      <div className="forecast-name"><strong>{entry.event.title}</strong><small>{entry.event.description}</small></div>
      <div className="forecast-outcome"><span>{entry.candidate.outcome}</span><strong>{percent(entry.candidate.probability)}</strong></div>
      <div className="decision-cell"><span className={entry.decision.decision === "include" ? "decision-yes" : "decision-no"}>{entry.decision.decision === "include" ? "Included" : "Abstained"}</span><small>{entry.decision.reason}</small></div>
      <div className="row-arrow">↗</div>
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
          <Link key={item.href} href={item.href} className={`nav-link ${pathname.startsWith(item.href) ? "active" : ""}`}>
            <span className="nav-index">{item.mark}</span>{item.label}
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
          <span className="crumb">SIMULATION / {nav.find((item) => pathname.startsWith(item.href))?.label.toUpperCase() ?? "WORKSPACE"}</span>
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
function Empty({ title = "Your workspace is ready when you are", text = "Choose a few preferences to create a deterministic demo run." }: { title?: string; text?: string }) { return <section className="empty-state"><span className="empty-glyph">✳</span><h2>{title}</h2><p>{text}</p><Link className="button button-dark" href="/onboarding">Set up your agent <span>→</span></Link></section>; }
function Badge({ children }: { children: React.ReactNode }) { return <span className="badge">{children}</span>; }
function RiskPill({ children }: { children: string }) { return <span className={`risk-pill risk-${children.toLowerCase().replaceAll(" ", "-")}`}>{children}</span>; }

function Onboard() {
  const router = useRouter(); const { preferences, savePreferences, startAgent, hydrated } = useAgent();
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
  function finish() { savePreferences(form); startAgent(form); router.push("/dashboard"); }
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
                  <span className="choice-icon">{category === "sports" ? "◉" : "☼"}</span>
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
            <h2>Ready to run.</h2>
            <p className="section-copy">A summary before your local simulation starts.</p>
            <div className="review-list">
              <div><span>Categories</span><strong>{form.categories.length ? form.categories.join(" + ") : "None selected"}</strong></div>
              <div><span>Interests</span><strong>{form.interests.join(" · ") || "All events in selected categories"}</strong></div>
              <div><span>Risk profile</span><strong>{form.riskProfile} · {form.riskProfile === "low" ? "60%+" : form.riskProfile === "medium" ? "40–59%" : "15–39%"}</strong></div>
              <div><span>Mode</span><strong>{form.mode === "auto-simulate" ? "Auto-simulate" : "Review"}</strong></div>
              <div><span>Virtual credits</span><strong>{number(form.initialBankroll)} credits</strong></div>
            </div>
            <p className="notice">DEMO DATA · This run is generated on this device. No account or real-world transaction is involved.</p>
          </>}
          <div className="onboard-actions">
            <button className="button button-quiet" onClick={() => step === 0 ? router.push("/") : setStep(step - 1)}>{step === 0 ? "Back to home" : "← Back"}</button>
            {step < 3
              ? <button className="button button-dark" disabled={step === 0 && form.categories.length === 0} onClick={() => setStep(step + 1)}>Continue <span>→</span></button>
              : <button className="button button-dark" disabled={form.categories.length === 0} onClick={finish}>Start agent <span>→</span></button>}
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
 return <Frame eyebrow={date(run.generatedAt).toUpperCase()} title="A clear view, at a glance." subtitle="A deterministic snapshot of the questions your agent explored." action={<Link href="/onboarding" className="button button-outline">Adjust setup ↗</Link>}><div className="stat-grid"><article className="stat-card dark-stat"><span>VIRTUAL BALANCE</span><strong>{number(run.availableCredits)}</strong><small>credits · from {number(run.initialBankroll)} initial</small><b>SIMULATION</b></article><article className="stat-card"><span>SCANNED</span><strong>{run.activity.scanned}</strong><small>{run.activity.relevant} relevant events</small></article><article className="stat-card"><span>INCLUDED</span><strong>{run.activity.included}</strong><small>{abstained} abstained by policy</small></article><article className="stat-card"><span>ACTIVE POSITIONS</span><strong>{active.length}</strong><small>{resolved.length} resolved in this run</small></article></div><div className="section-heading"><div><div className="eyebrow">CURRENT OPPORTUNITIES</div><h2>Recent forecasts</h2></div><Link href="/forecasts" className="text-link">View all forecasts ↗</Link></div>{featured.length ? <ForecastList items={featured}/> : <div className="empty-inline">No upcoming candidates in the selected risk band. Open the full register to review this run.</div>}<div className="dashboard-bottom"><section className="panel"><div className="eyebrow">RUN SNAPSHOT</div><h3>From scan to decision</h3><div className="pipeline"><span>Events scanned <b>{run.activity.scanned}</b></span><i/><span>Relevant <b>{run.activity.relevant}</b></span><i/><span>Included <b>{run.activity.included}</b></span></div><div className="meter"><i style={{ width: `${run.activity.scanned ? Math.round(run.activity.included / run.activity.scanned * 100) : 0}%` }}/></div><p>{abstained} forecasts were abstained under your current policy.</p></section><section className="panel"><div className="eyebrow">YOUR SETUP</div><h3>{run.preferences.riskProfile} · {run.preferences.mode === "auto-simulate" ? "Auto-simulate" : "Review"}</h3><p>{run.preferences.categories.join(" + ")} · {run.preferences.interests.join(" / ") || "No interests selected"}</p><Link className="text-link" href="/onboarding">Edit preferences ↗</Link></section></div></Frame>;
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
    {positions.length ? <div className="table-scroll"><table><thead><tr><th>EVENT / OUTCOME</th><th>STATUS</th><th>RISK</th><th>MODEL PROBABILITY</th><th>VIRTUAL ALLOCATION</th><th>CREATED</th></tr></thead><tbody>{positions.map((position) => <tr key={position.id}><td><Link prefetch={false} className="table-event" href={`/forecast/${encodeURIComponent(`${position.eventId}::${position.outcome}`)}`}>{run.evaluated.find((item) => item.event.id === position.eventId)?.event.title ?? position.eventId}<small>{position.outcome}</small></Link></td><td><span className={`status-pill ${position.status}`}>{position.status}</span></td><td><RiskPill>{position.riskProfile}</RiskPill></td><td>{percent(position.probability)}</td><td>{number(position.virtualAllocation)} credits</td><td>{date(position.createdAt)}</td></tr>)}</tbody></table></div> : <div className="empty-inline">No positions were created by the current policy. Abstentions remain visible in <Link href="/forecasts">forecasts</Link>.</div>}
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
    <div className="table-scroll"><table><thead><tr><th>EVENT</th><th>CATEGORY</th><th>RISK</th><th>DECISION</th><th>MODEL OUTCOME</th><th>RESULT</th><th>RATIONALE</th></tr></thead><tbody>{filtered.map((item)=><tr key={item.candidate.id}><td><Link prefetch={false} className="table-event" href={`/forecast/${encodeURIComponent(`${item.event.id}::${item.candidate.outcome}`)}`}>{item.event.title}<small>{date(item.event.startTime)}</small></Link></td><td>{item.event.category}</td><td>{item.candidate.riskBand}</td><td><span className={item.decision.decision==="include"?"decision-yes":"decision-no"}>{item.decision.decision}</span></td><td>{item.candidate.outcome} · {percent(item.candidate.probability)}</td><td>{resolutions.has(item.event.id) ? (resolutions.get(item.event.id) === item.candidate.outcome ? "Correct" : "Incorrect") : "Pending"}</td><td className="rationale-cell">{item.decision.reason}</td></tr>)}</tbody></table></div>
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
function RouteContent() {
  const pathname = useRoutePath();
  if (pathname === "/") return <LandingExperience />;
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
