import { Eye, ListChecks, ScanSearch, ShieldCheck, SkipForward } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AgentRun } from "@/lib/domain";

export function WorkspaceActivity({ run }: { run: AgentRun }) {
  const rows = [
    { label: "Events scanned", detail: "Events checked in this run", value: run.activity.scanned, icon: ScanSearch },
    { label: "Relevant events", detail: "Events matching your interests", value: run.activity.relevant, icon: ShieldCheck },
    { label: "Risk-band matches", detail: `Outcomes in the ${run.preferences.riskProfile} band`, value: run.activity.bandMatched, icon: ListChecks },
    { label: "Included outcomes", detail: "Outcomes that passed the evidence checks", value: run.activity.included, icon: Eye },
    { label: "Held back", detail: "Outcomes the policy did not include", value: run.activity.abstained, icon: SkipForward },
  ];
  return (
    <Card>
      <CardHeader><CardTitle>What the agent found</CardTitle><CardDescription>Results from this run</CardDescription></CardHeader>
      <CardContent>
        <ol className="flex flex-col divide-y">
          {rows.map(({ label, detail, value, icon: Icon }) => (
            <li key={label} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"><Icon className="size-4" aria-hidden="true" /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{label}</span><span className="block truncate text-xs text-muted-foreground">{detail}</span></span>
              <Badge variant={label === "Predictions shown" ? "default" : "secondary"} className="tabular-nums">{value}</Badge>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
