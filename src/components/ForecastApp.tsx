"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAgent } from "@/components/AgentProvider";
import { summarize } from "@/lib/analytics";
import { defaultPreferences, runAgent } from "@/lib/agent";
import type { Category, EvaluatedCandidate, Preferences } from "@/lib/domain";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
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
const number = (value: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
const percent = (value: number | null | undefined) => typeof value === "number" ? `${(value * 100).toFixed(1)}%` : "—";
const date = (value: string) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const ForecastList = ({ items }: { items: EvaluatedCandidate[] }) => {
  const { run } = useAgent();
  if (!items.length) return <div className="empty-inline">No matching demo picks for this risk level.</div>;
  return <div className="forecast-list">{items.map((entry) => {
    const resolved = run?.resolutions.some((resolution) => resolution.eventId === entry.event.id) ?? false;
    return <Link href={`/forecast/${encodeURIComponent(`${entry.event.id}::${entry.candidate.outcome}`)}`} prefetch={false} key={entry.candidate.id} className="forecast-row pick-row">
      <div className="event-category"><span className="category-symbol"><Icon name={entry.event.category} /></span><span>{entry.event.category}<small>{resolved ? "Resolved" : date(entry.event.startTime)}</small></span></div>
      <div className="forecast-name"><strong>{entry.event.title.replace(/^DEMO DATA: /, "")}</strong><small>{entry.event.description}</small></div>
      <div className="forecast-outcome"><span>PICK</span><strong>{entry.candidate.outcome}</strong></div>
      <div className="forecast-gap"><span>MODEL</span><strong>{percent(entry.candidate.probability)}</strong></div>
      <div className="decision-cell"><span className={entry.decision.decision === "include" ? "decision-yes" : "decision-no"}>{entry.decision.decision === "include" ? "Available" : "Skipped"}</span><small>{entry.candidate.riskBand.replace("_", " ")} risk</small></div>
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
        <Link href="/" className="brand"><span className="brand-symbol">F</span><span>FIELDNOTE</span></Link>
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
            <Link href="/onboarding" className="avatar-link" aria-label="Edit setup">↗</Link>
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
  function showPicks() {
    const next = { ...form, mode: "review" as const };
    setForm(next);
    savePreferences(next);
    startAgent(next);
    router.push("/forecasts");
  }
  return (
    <div className="onboard-wrap">
      <header className="onboard-header">
        <Link href="/" className="brand"><span className="brand-symbol">F</span><span>FIELDNOTE</span></Link>
        <Badge>DEMO DATA</Badge>
      </header>
      <div className="onboard-layout">
        <aside className="onboard-aside"><h1>Set your<br />preferences.</h1></aside>
        <section className="onboard-card" aria-label="Configure your agent">
          <div className="eyebrow">STEP {String(step + 1).padStart(2, "0")} / 03</div>

          {step === 0 && <>
            <h2>Pick your topics.</h2>
            <div className="option-grid" role="group" aria-label="Categories">
              {(["sports", "weather"] as const).map((category) => (
                <button key={category} type="button" className={`choice-card ${form.categories.includes(category) ? "selected" : ""}`} aria-pressed={form.categories.includes(category)} onClick={() => toggleCategory(category)}>
                  <span className="choice-icon"><Icon name={category} /></span>
                  <strong>{category === "sports" ? "Sports" : "Weather"}</strong>
                  <small>{category === "sports" ? "NBA matchup predictions" : "Local forecast scenarios"}</small>
                  <i>{form.categories.includes(category) ? "✓" : "+"}</i>
                </button>
              ))}
            </div>
          </>}

          {step === 1 && <>
            <h2>Add your interests.</h2>
            <label className="field-label" htmlFor="team">TEAM OR PLACE</label>
            <input id="team" className="text-input" value={form.interests[0] ?? ""} onChange={(event) => setForm((current) => ({ ...current, interests: event.target.value.trim() ? [event.target.value] : [] }))} placeholder="Warriors or San Francisco" />
            <div className="hint">Keep it simple. This filters the demo slate.</div>
            <div className="preset-row">
              <button type="button" onClick={() => setForm((current) => ({ ...current, interests: ["NBA", "Warriors", "San Francisco"] }))}>Use demo defaults</button>
            </div>
          </>}

          {step === 2 && <>
            <h2>Choose your risk.</h2>
            <p className="section-copy">This decides which demo picks make the cut.</p>
            <div className="choice-stack" role="group" aria-label="Risk profile">
              {(["low", "medium", "high"] as const).map((risk) => (
                <button type="button" key={risk} onClick={() => setForm((current) => ({ ...current, riskProfile: risk }))} aria-pressed={form.riskProfile === risk} className={`risk-choice ${form.riskProfile === risk ? "selected" : ""}`}>
                  <span><strong>{risk === "low" ? "Low · 60%+" : risk === "medium" ? "Medium · 40–59%" : "High · 15–39%"}</strong></span>
                </button>
              ))}
            </div>
            <p className="notice">Simulation only. No real-money transactions.</p>
          </>}

          <div className="onboard-actions">
            <button className="button button-quiet" onClick={() => step === 0 ? router.push("/") : setStep(step - 1)}>{step === 0 ? "Back to home" : "← Back"}</button>
            {step < 2
              ? <LiquidButton disabled={step === 0 && form.categories.length === 0} onClick={() => setStep(step + 1)}>Continue <span>→</span></LiquidButton>
              : <LiquidButton onClick={showPicks}>See picks <span>→</span></LiquidButton>}
          </div>
        </section>
      </div>
    </div>
  );
}
function Dashboard() {
 const { run } = useAgent(); if (!run) return <Frame eyebrow="WORKSPACE" title="Overview"><Empty/></Frame>;
 const abstained = run.activity.abstained;
 const upcoming = run.evaluated.filter((item) => Date.parse(item.event.startTime) > Date.parse(run.generatedAt) && item.candidate.riskBand === run.preferences.riskProfile);
 const preferred = [
   upcoming.find((item) => item.event.category === "sports" && item.decision.decision === "include"),
   upcoming.find((item) => item.event.category === "weather" && item.decision.decision === "include"),
   upcoming.find((item) => item.decision.decision === "abstain" && /uncertainty/i.test(item.decision.reason)),
 ].filter((item): item is EvaluatedCandidate => item !== undefined);
 const featured = [...preferred, ...upcoming.filter((item) => !preferred.includes(item))].slice(0, 3);
 return <Frame eyebrow={`AGENT SNAPSHOT · ${date(run.generatedAt).toUpperCase()}`} title="Overview" subtitle={`${run.preferences.riskProfile.toUpperCase()} RISK · ${run.preferences.categories.join(" + ").toUpperCase()} · ${run.preferences.mode === "auto-simulate" ? "AUTO-SIMULATE" : "REVIEW"}`} action={<Link href="/onboarding" className="button button-outline">Edit setup <Icon name="arrow" /></Link>}>
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
  const { run } = useAgent();
  if (!run) return <Frame eyebrow="PICKS" title="Your picks"><Empty /></Frame>;
  const matching = run.evaluated.filter((item) =>
    item.event.metadata.historical !== true &&
    item.candidate.riskBand === run.preferences.riskProfile &&
    item.decision.decision === "include"
  );
  return (
    <Frame eyebrow="DEMO PICKS" title="Your picks" subtitle={`${run.preferences.riskProfile.toUpperCase()} RISK · ${matching.length} AVAILABLE`} action={<Link href="/onboarding" className="button button-outline">Change risk</Link>}>
      <p className="picks-intro">Tap a pick to see the matchup, what the prediction means, and the short reasoning behind it.</p>
      <ForecastList items={matching} />
    </Frame>
  );
}
function ForecastDetail({ id }: { id: string }) {
  const router = useRouter();
  const { run, addToSimulation } = useAgent();
  const [eventId, outcome] = decodeURIComponent(id).split("::");
  const item = run?.evaluated.find((entry) => entry.event.id === eventId && entry.candidate.outcome === outcome);
  if (!run || !item) return <Frame eyebrow="PICK DETAIL" title="Pick not found"><Empty title="This pick is not in your snapshot" text="Go back to your demo picks and choose another one." /></Frame>;

  const position = run.positions.find((entry) => entry.candidateId === item.candidate.id);
  const canSimulate = item.decision.decision === "include" && !position;
  const factors = item.forecast.factors.slice(0, 2);

  function acceptDemoPick() {
    if (!canSimulate) return;
    addToSimulation(item.candidate.id);
  }

  return (
    <Frame eyebrow={`${item.event.category.toUpperCase()} / DEMO PICK`} title={item.event.title.replace(/^DEMO DATA: /, "")} action={<Link href="/forecasts" className="button button-outline">← Picks</Link>}>
      <div className="pick-detail-shell">
        <section className="panel pick-summary-card">
          <div className="pick-summary-top">
            <div>
              <div className="eyebrow">WHAT YOU'RE PICKING</div>
              <h2>{item.candidate.outcome}</h2>
              <p>{item.event.description}</p>
            </div>
            <div className="pick-probability"><span>MODEL</span><strong>{percent(item.candidate.probability)}</strong></div>
          </div>

          <div className="pick-meta">
            <span><b>Risk</b>{item.candidate.riskBand.replace("_", " ")}</span>
            <span><b>Starts</b>{new Date(item.event.startTime).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
            <span><b>Uncertainty</b>{percent(item.forecast.uncertainty)}</span>
          </div>
        </section>

        <section className="panel pick-reason-card">
          <div className="eyebrow">QUICK READ</div>
          <h3>Why it made your list</h3>
          <p className="pick-reason">{item.decision.reason}</p>
          <div className="pick-factors">
            {factors.map((factor) => <div key={factor.name}><i className={`factor-dot factor-${factor.direction}`} /><span><strong>{factor.name}</strong><small>{factor.description}</small></span></div>)}
          </div>
        </section>

        <section className="panel pick-action-card">
          <div>
            <div className="eyebrow">SIMULATION ONLY</div>
            <h3>{position ? "Added to your demo." : "Want to add this pick?"}</h3>
            <p>{position ? `${number(position.virtualAllocation)} virtual credits are attached to this simulated position.` : "Add it to your virtual portfolio, or skip it and keep browsing."}</p>
          </div>
          <div className="pick-actions">
            {position
              ? <Link href="/portfolio" className="button button-dark">View portfolio</Link>
              : <LiquidButton onClick={acceptDemoPick}>Add to simulation <span>→</span></LiquidButton>}
            <button type="button" className="button button-outline" onClick={() => router.push("/forecasts")}>{position ? "Back to picks" : "Skip"}</button>
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
  return <Frame eyebrow="SIMULATION" title="Portfolio" subtitle="Virtual credits only.">
    <div className="stat-grid">
      <article className="stat-card dark-stat"><span>AVAILABLE</span><strong>{number(run.availableCredits)}</strong><small>virtual credits</small></article>
      <article className="stat-card"><span>ALLOCATED</span><strong>{number(total)}</strong><small>across {positions.length} positions</small></article>
      <article className="stat-card"><span>ACTIVE</span><strong>{active.length}</strong><small>unresolved positions</small></article>
      <article className="stat-card"><span>RESOLVED</span><strong>{resolved.length}</strong><small>in this run</small></article>
    </div>
    <div className="section-heading"><div><h2>Positions</h2></div></div>
    {positions.length ? <div className="table-scroll ledger-table"><table><thead><tr><th>EVENT / OUTCOME</th><th>STATUS</th><th>RISK</th><th>MODEL PROBABILITY</th><th>VIRTUAL ALLOCATION</th><th>CREATED</th></tr></thead><tbody>{positions.map((position) => <tr key={position.id}>
      <td data-label="Event / outcome"><Link prefetch={false} className="table-event" href={`/forecast/${encodeURIComponent(`${position.eventId}::${position.outcome}`)}`}>{run.evaluated.find((item) => item.event.id === position.eventId)?.event.title ?? position.eventId}<small>{position.outcome}</small></Link></td>
      <td data-label="Status"><span className={`status-pill ${position.status}`}>{position.status}</span></td>
      <td data-label="Risk"><RiskPill>{position.riskProfile}</RiskPill></td>
      <td data-label="Model probability">{percent(position.probability)}</td>
      <td data-label="Virtual allocation">{number(position.virtualAllocation)} credits</td>
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
    { value: category, set: setCategory, label: "Category", options: ["all", "sports", "weather"] },
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
      <td data-label="Allocation">{allocation === undefined ? "No position" : `${number(allocation)} credits`}</td>
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
  const { run } = useAgent();
  const router = useRouter();
  const sports = landingSports;
  const featured = sports[0];
  const secondary = sports[1] ?? featured;
  const signalGap = (featured.candidate.probabilityGap ?? 0) * 100;
  function tryDemo() { router.push("/onboarding"); }

  return <div className="landing">
    <header className="landing-nav">
      <Link href="/" className="brand"><span className="brand-symbol">F</span><span>FIELDNOTE</span></Link>
      <nav aria-label="Landing navigation">
        <a href="#signal">Signal</a>
        <a href="#how-it-works">How it works</a>
      </nav>
      {run
        ? <Link href="/dashboard" className="button button-outline">Open workspace <span aria-hidden="true">↗</span></Link>
        : <LiquidButton size="sm" variant="outline" onClick={tryDemo}>Try demo <span aria-hidden="true">→</span></LiquidButton>}
    </header>

    <main>
      <section className="hero" id="signal">
        <div className="hero-copy">
          <div className="landing-kicker">FIELDNOTE / SPORTS SIGNALS</div>
          <h1>Set your risk.<br/><em>Find the signal.</em></h1>
          <p>Choose how selective the agent should be. It scans the sports slate and surfaces only the signals that fit.</p>
          <div className="hero-actions">
            <LiquidButton size="lg" onClick={tryDemo}>Try demo <span aria-hidden="true">→</span></LiquidButton>
            <a className="landing-secondary" href="#how-it-works">See how it works <span aria-hidden="true">↓</span></a>
          </div>
        </div>

        <div className="signal-landscape" role="img" aria-label="Abstract sports signal landscape showing matchup, risk and signal strength">
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

          <div className="signal-fragment signal-fragment-a">
            <span>SPORTS / NBA</span>
            <strong>{featured.event.title.replace(/^DEMO DATA: /, "")}</strong>
          </div>
          <div className="signal-fragment signal-fragment-b">
            <span>RISK</span>
            <strong>MEDIUM</strong>
            <small>40–59%</small>
          </div>
          <div className="signal-fragment signal-fragment-c">
            <span>SIGNAL</span>
            <strong>{signalGap >= 0 ? "+" : ""}{number(signalGap)} pts</strong>
          </div>
          <div className="signal-fragment signal-fragment-d">
            <span>NEXT SCAN</span>
            <strong>{secondary.event.title.replace(/^DEMO DATA: /, "")}</strong>
          </div>
        </div>

        <div className="hero-caption">DEMO DATA · SIMULATION ONLY · NO REAL TRANSACTIONS</div>
      </section>

      <section className="landing-risk" id="how-it-works">
        <div className="landing-section-heading">
          <span>01 / RISK</span>
          <h2>One setting changes what makes it through.</h2>
        </div>
        <div className="risk-spectrum" aria-label="Risk bands">
          <div className="risk-band risk-band-low"><span>LOW</span><strong>60–100%</strong></div>
          <div className="risk-band risk-band-medium"><span>MEDIUM</span><strong>40–59%</strong><i>ACTIVE</i></div>
          <div className="risk-band risk-band-high"><span>HIGH</span><strong>15–39%</strong></div>
        </div>
        <div className="decision-rail" aria-hidden="true">
          <span>SCAN</span><i/><span>QUALIFY</span><i/><span>INCLUDE / ABSTAIN</span>
        </div>
      </section>

      <section className="landing-close">
        <div>
          <span>TRY THE DEMO</span>
          <h2>Set your risk. See what survives the filter.</h2>
          <p>Explore fictional sports scenarios with virtual credits only.</p>
        </div>
        <LiquidButton size="lg" onClick={tryDemo}>Try demo <span aria-hidden="true">→</span></LiquidButton>
      </section>
    </main>

    <footer className="landing-footer"><span>FIELDNOTE</span><span>SIMULATION ONLY</span></footer>
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
