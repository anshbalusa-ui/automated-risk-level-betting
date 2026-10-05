import Link from "next/link";
import { ArrowUpRight, CircleDot, CloudSun } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AgentRun, EvaluatedCandidate } from "@/lib/domain";

const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const percent = (value: number | undefined) => typeof value === "number" ? `${number.format(value * 100)}%` : "—";
const date = (value: string) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export function WorkspaceForecastList({ items, run, title = "Current forecasts", description = "Events that passed through the agent's current setup." }: { items: EvaluatedCandidate[]; run: AgentRun; title?: string; description?: string }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader>
      <CardContent className="p-0">
        {items.length ? <div className="divide-y">
          {items.map((entry) => {
            const resolved = run.resolutions.some((resolution) => resolution.eventId === entry.event.id);
            const include = entry.decision.decision === "include";
            const Icon = entry.event.category === "sports" ? CircleDot : CloudSun;
            return <Link href={`/forecast/${encodeURIComponent(`${entry.event.id}::${entry.candidate.outcome}`)}`} prefetch={false} key={entry.candidate.id} className="group flex items-center gap-3 px-6 py-4 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"><Icon className="size-4" aria-hidden="true" /></span>
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{entry.event.title.replace(/^DEMO DATA: /, "")}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{entry.event.category} · {resolved ? "Resolved" : date(entry.event.startTime)} · {entry.candidate.outcome}</span></span>
              <span className="hidden min-w-20 text-right sm:block"><span className="block text-xs text-muted-foreground">Model</span><span className="font-mono text-sm tabular-nums">{percent(entry.candidate.probability)}</span></span>
              <span className="hidden min-w-20 text-right md:block"><span className="block text-xs text-muted-foreground">Reference</span><span className="font-mono text-sm tabular-nums">{percent(entry.candidate.referenceProbability)}</span></span>
              <Badge variant={include ? "default" : "secondary"}>{include ? "Included" : "Skipped"}</Badge>
              <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>;
          })}
        </div> : <p className="p-6 text-sm text-muted-foreground">No forecasts match this setup.</p>}
      </CardContent>
    </Card>
  );
}
