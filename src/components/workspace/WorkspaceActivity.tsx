import { Eye, ListChecks, ScanSearch, ShieldCheck, SkipForward } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AgentRun } from "@/lib/domain";

export function WorkspaceActivity({ run }: { run: AgentRun }) {
  const rows = [
    { label: "Games checked", detail: "Events evaluated in the current slate", value: run.activity.scanned, icon: ScanSearch },
    { label: "Sports matched", detail: "Events matching your interests", value: run.activity.relevant, icon: ShieldCheck },
    { label: "Risk band matched", detail: `Candidates in ${run.preferences.riskProfile} risk`, value: run.activity.bandMatched, icon: ListChecks },
    { label: "Predictions shown", detail: "Candidates that passed evidence policy", value: run.activity.included, icon: Eye },
    { label: "Skipped", detail: "Candidates held back by policy", value: run.activity.abstained, icon: SkipForward },
  ];
  return (
    <Card>
      <CardHeader><CardTitle>Agent activity</CardTitle><CardDescription>Latest decisions from the current run</CardDescription></CardHeader>
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
