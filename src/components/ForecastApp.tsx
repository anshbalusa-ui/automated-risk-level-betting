"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgent } from "@/components/AgentProvider";
import type { EvaluatedCandidate, Preferences } from "@/lib/domain";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { MorphThinkingOrb } from "@/components/ui/morph-thinking-orb";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LandingExperience from "@/components/landing/LandingExperience";
import { summarize } from "@/lib/analytics";
import { WorkspaceEmptyState, WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { WorkspaceForecastList } from "@/components/workspace/WorkspaceForecasts";
import { WorkspaceOverview } from "@/components/workspace/WorkspaceOverview";
function BrandMark() {
  return <span className="brand-symbol" aria-hidden="true">
    <svg viewBox="0 0 24 24" role="presentation">
      <circle className="brand-ring" cx="12" cy="12" r="7.4" />
      <path className="brand-slash" d="M6.8 17.2 17.2 6.8" />
      <path className="brand-wave" d="M4.2 13.3c2.1-1.15 3.9-1.1 5.6.15 1.8 1.35 3.8 1.35 5.8-.05 1.45-1.05 2.8-1.15 4.2-.65" />
      <circle className="brand-pulse" cx="12" cy="12.1" r="1.25" />
    </svg>
  </span>;
}
const creditsFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const credits = (value: number) => `${creditsFormatter.format(value)} credits`;
const percent = (value: number | null | undefined) => typeof value === "number" ? `${(value * 100).toFixed(1)}%` : "N/A";
const date = (value: string) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const sportInterestOptions = [
  { label: "Basketball", value: "NBA", detail: "NBA" },
  { label: "Football", value: "NFL", detail: "NFL" },
  { label: "Baseball", value: "MLB", detail: "MLB" },
  { label: "Soccer", value: "Soccer", detail: "Soccer" },
  { label: "Hockey", value: "NHL", detail: "NHL" },
] as const;
const quickInterestValues = new Set<string>(sportInterestOptions.map((item) => item.value));

function useRoutePath() {
  const pathname = usePathname();
  const basePath = process.env.NEXT_PUBLIC_APP_BASE_PATH ?? "";
  const relativePath = basePath && pathname.startsWith(`${basePath}/`)
    ? pathname.slice(basePath.length)
    : pathname;
  return relativePath.replace(/\/$/, "") || "/";
}


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
    }, 600);

    scanTimeoutRef.current = window.setTimeout(() => {
      router.push("/forecasts");
    }, 2450);
  }
  if (isScanning) {
    return (
      <div className="onboard-wrap agent-thinking-page">
        <header className="onboard-header">
          <Link href="/" className="brand"><BrandMark/><span>RØGUE</span></Link>
          <Badge>FINDING PICKS</Badge>
        </header>
        <main className="agent-thinking-shell" aria-label="RØGUE preparing picks">
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
        <section className="onboard-card" aria-label="Configure your setup">
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
                  <span><strong>{risk === "low" ? "Low - 60%+" : risk === "medium" ? "Medium - 40-59%" : "High - 15-39%"}</strong></span>
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
  const { run } = useAgent();
  if (!run) return <WorkspaceShell eyebrow="WORKSPACE" title="Overview"><WorkspaceEmptyState /></WorkspaceShell>;
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
  return (
    <WorkspaceShell
      eyebrow={`Your setup / ${date(run.generatedAt)}`}
      title="Overview"
      subtitle={`${run.preferences.riskProfile.toUpperCase()} risk / ${(selectedSports.length ? selectedSports : ["Sports"]).join(" + ")} / ${run.preferences.mode === "auto-simulate" ? "Auto-simulate" : "Review"}`}
      action={<><Button asChild><Link href="/onboarding">Change setup <ArrowRight className="size-4" /></Link></Button><Button asChild variant="outline"><Link href="/forecasts">View forecasts</Link></Button></>}
    >
      <WorkspaceOverview run={run} featured={featured} />
    </WorkspaceShell>
  );
}

function Forecasts() {
  const { run, handledCandidateIds } = useAgent();
  if (!run) return <WorkspaceShell eyebrow="YOUR PICKS" title="Forecasts"><WorkspaceEmptyState /></WorkspaceShell>;
  const matching = run.evaluated.filter((item) =>
    item.event.category === "sports" &&
    item.event.metadata.historical !== true &&
    item.candidate.riskBand === run.preferences.riskProfile &&
    item.decision.decision === "include" &&
    !handledCandidateIds.includes(item.candidate.id),
  );
  return (
    <WorkspaceShell eyebrow="FORECASTS / DEMO DATA" title="Forecasts" subtitle={`${run.preferences.riskProfile.toUpperCase()} risk / ${matching.length} shown`} action={<Button asChild variant="outline"><Link href="/onboarding">Find more forecasts</Link></Button>}>
      <WorkspaceForecastList items={matching} run={run} title="Your forecasts" description="Open one to see the model, reference signal, evidence, and simulation decision." />
    </WorkspaceShell>
  );
}
function ForecastDetail({ id }: { id: string }) {
  const router = useRouter();
  const { run, addToSimulation, dismissPick } = useAgent();
  const [eventId, outcome] = decodeURIComponent(id).split("::");
  const item = run?.evaluated.find((entry) => entry.event.id === eventId && entry.candidate.outcome === outcome);
  if (!run || !item) return <WorkspaceShell eyebrow="FORECAST DETAIL" title="Forecast not found"><WorkspaceEmptyState title="This forecast is not in your snapshot" text="Go back to your forecasts and choose another one." /></WorkspaceShell>;

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
    <WorkspaceShell eyebrow={`${item.event.category.toUpperCase()} / FORECAST DETAILS`} title={item.event.title.replace(/^DEMO DATA: /, "")} action={<Button asChild variant="outline"><Link href="/forecasts">Back to forecasts <ArrowRight className="size-4" /></Link></Button>}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,.65fr)]">
        <Card>
          <CardHeader className="border-b">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Forecast</p>
                <CardTitle className="text-4xl tracking-tight">{item.candidate.outcome}</CardTitle>
                <CardDescription className="mt-2 max-w-xl">{item.event.description}</CardDescription>
              </div>
              <div className="text-right"><p className="text-xs text-muted-foreground">Model probability</p><p className="mt-1 font-mono text-4xl font-semibold tabular-nums tracking-tight">{percent(item.candidate.probability)}</p></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div><p className="text-xs text-muted-foreground">Reference</p><p className="mt-1 font-mono text-lg tabular-nums">{percent(item.candidate.referenceProbability)}</p></div>
              <div><p className="text-xs text-muted-foreground">Probability gap</p><p className="mt-1 font-mono text-lg tabular-nums">{item.candidate.probabilityGap === undefined ? "N/A" : `${item.candidate.probabilityGap >= 0 ? "+" : ""}${(item.candidate.probabilityGap * 100).toFixed(1)} pts`}</p></div>
              <div><p className="text-xs text-muted-foreground">Policy decision</p><Badge variant={item.decision.decision === "include" ? "default" : "secondary"} className="mt-1 capitalize">{item.decision.decision === "include" ? "Included" : "Abstained"}</Badge></div>
            </div>
            <dl className="grid gap-4 border-t pt-5 sm:grid-cols-4">
              <div><dt className="text-xs text-muted-foreground">Risk fit</dt><dd className="mt-1 text-sm font-medium">{item.decision.decision === "include" ? "Match" : "No match"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Risk band</dt><dd className="mt-1 text-sm font-medium capitalize">{item.candidate.riskBand.replace("_", " ")}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Starts</dt><dd className="mt-1 text-sm font-medium">{new Date(item.event.startTime).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Uncertainty</dt><dd className="mt-1 font-mono text-sm tabular-nums">{percent(item.forecast.uncertainty)}</dd></div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">{item.decision.decision === "include" ? "Why this forecast was included" : "Why this forecast was held back"}</CardTitle><CardDescription>Evidence supplied by the deterministic demo engine.</CardDescription></CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">{item.decision.reason}</p>
            <div className="mt-5 space-y-3 border-t pt-4">
              {factors.map((factor) => <div key={factor.name} className="flex gap-3"><span className={`mt-1.5 size-2 shrink-0 rounded-full ${factor.direction === "positive" ? "bg-foreground" : "bg-muted-foreground"}`} /><span><strong className="block text-sm font-medium">{factor.name}</strong><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{factor.description}</span></span></div>)}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">{position ? "Added to the simulation" : canSimulate ? "Add this forecast to the simulation?" : "This outcome was not included"}</CardTitle><CardDescription>{position ? `${credits(position.virtualAllocation)} from your virtual credits is allocated to this forecast.` : canSimulate ? `This allocates ${run.preferences.allocationPercent}% of your available credits, or ${credits(estimatedAllocation)}.` : item.decision.reason}</CardDescription></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {position ? <Button asChild><Link href="/portfolio">View portfolio</Link></Button> : canSimulate ? <Button onClick={acceptDemoPick}>Add to simulation</Button> : <Button asChild variant="outline"><Link href="/history">View decision history</Link></Button>}
            {(position || canSimulate) && <Button variant="outline" onClick={position ? () => router.push("/forecasts") : declineDemoPick}>{position ? "Back to forecasts" : "Skip"}</Button>}
          </CardContent>
        </Card>
      </div>
    </WorkspaceShell>
  );
}
function Portfolio() {
  const { run } = useAgent();
  if (!run) return <WorkspaceShell eyebrow="SIMULATION" title="Portfolio"><WorkspaceEmptyState /></WorkspaceShell>;
  const positions = run.positions;
  const active = positions.filter((position) => position.status === "active");
  const resolved = positions.filter((position) => position.status === "resolved");
  const total = positions.reduce((sum, position) => sum + position.virtualAllocation, 0);
  const stats = [
    { label: "Available credits", value: credits(run.availableCredits), hint: "Virtual credits" },
    { label: "Allocated", value: credits(total), hint: `Across ${positions.length} positions` },
    { label: "Active", value: String(active.length), hint: "Waiting for a result" },
    { label: "Resolved", value: String(resolved.length), hint: "Finished forecasts" },
  ];
  return (
    <WorkspaceShell eyebrow="VIRTUAL CREDITS" title="Portfolio" subtitle={`${run.preferences.allocationPercent}% of your available credits is allocated when you add a forecast`}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map((stat) => <Card key={stat.label}><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">{stat.label}</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold tabular-nums tracking-tight">{stat.value}</p><p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p></CardContent></Card>)}</div>
      <Card>
        <CardHeader><CardTitle>Your positions</CardTitle><CardDescription>Virtual allocations created by the simulation.</CardDescription></CardHeader>
        <CardContent className="p-0">
          {positions.length ? <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="border-y bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-6 py-3 font-medium">Event / outcome</th><th className="px-6 py-3 font-medium">Status</th><th className="px-6 py-3 font-medium">Risk</th><th className="px-6 py-3 font-medium">Confidence</th><th className="px-6 py-3 font-medium">Virtual credits</th><th className="px-6 py-3 font-medium">Created</th></tr></thead><tbody className="divide-y">{positions.map((position) => <tr key={position.id} className="transition-colors hover:bg-muted/50">
            <td className="px-6 py-4"><Link prefetch={false} className="font-medium hover:underline" href={`/forecast/${encodeURIComponent(`${position.eventId}::${position.outcome}`)}`}>{run.evaluated.find((item) => item.event.id === position.eventId)?.event.title?.replace(/^DEMO DATA: /, "") ?? position.eventId}<span className="mt-1 block text-xs text-muted-foreground">{position.outcome}</span></Link></td>
            <td className="px-6 py-4"><Badge variant={position.status === "active" ? "default" : "secondary"} className="capitalize">{position.status}</Badge></td>
            <td className="px-6 py-4 capitalize text-muted-foreground">{position.riskProfile}</td>
            <td className="px-6 py-4 font-mono tabular-nums">{percent(position.probability)}</td>
            <td className="px-6 py-4 font-mono tabular-nums">{credits(position.virtualAllocation)}</td>
            <td className="px-6 py-4 text-muted-foreground">{date(position.createdAt)}</td>
          </tr>)}</tbody></table></div> : <p className="p-6 text-sm text-muted-foreground">No positions yet. Browse <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/forecasts">forecasts</Link>.</p>}
        </CardContent>
      </Card>
    </WorkspaceShell>
  );
}
function History() {
  const { run } = useAgent();
  const [category, setCategory] = useState("all");
  const [risk, setRisk] = useState("all");
  const [decision, setDecision] = useState("all");
  const [result, setResult] = useState("all");
  if (!run) return <WorkspaceShell eyebrow="DECISION HISTORY" title="History"><WorkspaceEmptyState /></WorkspaceShell>;
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
  return (
    <WorkspaceShell eyebrow="DECISION HISTORY" title="History" action={<Button asChild variant="outline"><Link href="/performance">Performance <ArrowRight className="size-4" /></Link></Button>}>
      <Card>
        <CardHeader><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><CardTitle>Decision ledger</CardTitle><CardDescription>A record of what the agent decided and what happened later.</CardDescription></div><span className="text-sm text-muted-foreground">{filtered.length} records</span></div></CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{filters.map((filter) => <label key={filter.label} className="grid gap-1.5 text-xs font-medium text-muted-foreground">{filter.label}<select className="h-9 rounded-md border border-input bg-background px-3 text-sm font-normal capitalize text-foreground outline-none focus:ring-2 focus:ring-ring" value={filter.value} onChange={(event) => filter.set(event.target.value)}>{filter.options.map((option) => <option key={option} value={option}>{option === "all" ? "All" : option.replace("_", " ")}</option>)}</select></label>)}</div>
          <div className="overflow-x-auto rounded-lg border"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Event</th><th className="px-4 py-3 font-medium">Category</th><th className="px-4 py-3 font-medium">Risk</th><th className="px-4 py-3 font-medium">Decision</th><th className="px-4 py-3 font-medium">Allocation</th><th className="px-4 py-3 font-medium">Prediction</th><th className="px-4 py-3 font-medium">Result</th><th className="px-4 py-3 font-medium">Why</th></tr></thead><tbody className="divide-y">{filtered.map((item) => {
            const allocation = positions.get(item.candidate.id)?.virtualAllocation;
            const resolved = resolutions.has(item.event.id);
            const correct = resolved && resolutions.get(item.event.id) === item.candidate.outcome;
            return <tr key={item.candidate.id} className="align-top transition-colors hover:bg-muted/50">
              <td className="px-4 py-4"><Link prefetch={false} className="font-medium hover:underline" href={`/forecast/${encodeURIComponent(`${item.event.id}::${item.candidate.outcome}`)}`}>{item.event.title.replace(/^DEMO DATA: /, "")}<span className="mt-1 block text-xs text-muted-foreground">{date(item.event.startTime)}</span></Link></td>
              <td className="px-4 py-4 capitalize text-muted-foreground">{item.event.category}</td>
              <td className="px-4 py-4 capitalize text-muted-foreground">{item.candidate.riskBand.replace("_", " ")}</td>
              <td className="px-4 py-4"><Badge variant={item.decision.decision === "include" ? "default" : "secondary"} className="capitalize">{item.decision.decision}</Badge></td>
              <td className="px-4 py-4 text-muted-foreground">{allocation === undefined ? "No position" : credits(allocation)}</td>
              <td className="px-4 py-4 font-mono tabular-nums">{item.candidate.outcome} / {percent(item.candidate.probability)}</td>
              <td className="px-4 py-4"><Badge variant={!resolved ? "secondary" : correct ? "default" : "destructive"}>{!resolved ? "Pending" : correct ? "Correct" : "Incorrect"}</Badge></td>
              <td className="max-w-xs px-4 py-4 leading-relaxed text-muted-foreground">{item.decision.reason}</td>
            </tr>;
          })}</tbody></table></div>
        </CardContent>
      </Card>
    </WorkspaceShell>
  );
}

function Performance() {
  const { run } = useAgent();
  if (!run) return <WorkspaceShell eyebrow="DEMO DATA" title="Performance"><WorkspaceEmptyState /></WorkspaceShell>;
  const summary = summarize(run);
  const scores = [
    { label: "Included forecasts", data: summary.includedForecasts },
    { label: "All forecasts", data: summary.allForecasts },
  ];
  return (
    <WorkspaceShell eyebrow="DEMO DATA / ANALYTICS" title="Performance" subtitle="Resolved fictional outcomes only. These metrics do not demonstrate real-world predictive ability." action={<Button asChild variant="outline"><Link href="/history">View history</Link></Button>}>
      <Card className="border-l-4 border-l-primary">
        <CardContent className="flex gap-3 pt-6"><Info className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" /><p className="text-sm leading-relaxed text-muted-foreground">Calibration and accuracy use resolved demo outcomes. Pending events are excluded; small samples can vary substantially.</p></CardContent>
      </Card>
      <p className="text-sm text-muted-foreground">{summary.resolved} resolved candidate forecasts / {summary.abstention.abstained} of {summary.abstention.denominator} selected-band candidates abstained.</p>
      <div className="grid gap-6 lg:grid-cols-2">
        {scores.map(({ label, data }) => <Card key={label}>
          <CardHeader><CardTitle className="text-lg">{label}</CardTitle><CardDescription>{data.count} resolved candidates</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-4"><div><p className="text-2xl font-semibold tabular-nums">{percent(data.accuracy)}</p><p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">Accuracy</p></div><div><p className="text-2xl font-semibold tabular-nums">{data.brierScore === null ? "N/A" : data.brierScore.toFixed(3)}</p><p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">Brier score</p></div></div>
            <div className="space-y-3 border-t pt-4">
              <div className="flex justify-between text-xs text-muted-foreground"><span>Model probability</span><span>Observed frequency</span></div>
              {data.calibration.map((bucket) => <div key={bucket.label} className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 text-xs"><span className="font-mono tabular-nums text-muted-foreground">{bucket.label.replace("–", "-")}%</span><div className="relative h-2 rounded-full bg-secondary">{bucket.predictedMean !== null && <i className="absolute top-1/2 z-10 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" style={{ left: `${bucket.predictedMean * 100}%` }} />}{bucket.observedFrequency !== null && <b className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background" style={{ left: `${bucket.observedFrequency * 100}%` }} />}</div><span className="whitespace-nowrap text-right text-muted-foreground">{bucket.count ? `${percent(bucket.predictedMean)} / ${percent(bucket.observedFrequency)}` : "No samples"}</span></div>)}
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-primary" />Model</span><span className="flex items-center gap-1.5"><i className="size-2 rounded-full border-2 border-primary bg-background" />Observed</span></div>
          </CardContent>
        </Card>)}
      </div>
      <Card><CardContent className="pt-6"><details><summary className="cursor-pointer text-sm font-medium">How these metrics are calculated</summary><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Included accuracy is the share of included candidates whose outcome occurred. All-forecast accuracy uses the 50% decision threshold. Brier score averages squared probability error; lower is better. Calibration groups forecasts by probability band and compares predicted probability with observed frequency. All numbers use deterministic demo data, not live results.</p></details></CardContent></Card>
    </WorkspaceShell>
  );
}

function RouteContent() {
  const pathname = useRoutePath();
  const { hydrated } = useAgent();
  if (pathname !== "/" && pathname !== "/onboarding" && !hydrated) {
    return <WorkspaceShell eyebrow="DEMO DATA" title="Restoring your snapshot"><p className="text-sm text-muted-foreground" role="status">Loading this browser’s local simulation.</p></WorkspaceShell>;
  }
  if (pathname === "/") return <LandingExperience/>;
  if (pathname === "/onboarding") return <Onboard/>;
  if (pathname === "/dashboard") return <Dashboard/>;
  if (pathname === "/forecasts") return <Forecasts/>;
  if (pathname.startsWith("/forecast/") || pathname.startsWith("/forecasts/")) return <ForecastDetail id={pathname.split("/").at(-1) ?? ""}/>;
  if (pathname === "/portfolio") return <Portfolio/>;
  if (pathname === "/history") return <History/>;
  if (pathname === "/performance") return <Performance/>;
  return <WorkspaceShell eyebrow="WORKSPACE" title="Page not found"><WorkspaceEmptyState title="This page isn’t here" text="Use the workspace navigation to find your way." /></WorkspaceShell>;
}
export default function ForecastApp() { return <RouteContent/>; }
