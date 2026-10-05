import { BarChart3, Coins, ListChecks, ScanSearch } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AgentRun } from "@/lib/domain";

const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

export function WorkspaceStats({ run }: { run: AgentRun }) {
  const stats = [
    { label: "Games checked", value: number.format(run.activity.scanned), hint: "Current agent scan", icon: ScanSearch },
    { label: "Matched sports", value: number.format(run.activity.relevant), hint: "From the current slate", icon: BarChart3 },
    { label: "Predictions shown", value: number.format(run.activity.included), hint: `${run.activity.abstained} skipped`, icon: ListChecks },
    { label: "Available credits", value: number.format(run.availableCredits), hint: "Virtual demo credits", icon: Coins },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(({ label, value, hint, icon: Icon }) => (
        <Card key={label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">{label}</CardTitle>
            <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
