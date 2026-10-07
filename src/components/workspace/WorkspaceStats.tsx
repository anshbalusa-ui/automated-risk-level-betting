import { BarChart3, Coins, ListChecks, ScanSearch } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AgentRun } from "@/lib/domain";

const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

export function WorkspaceStats({ run }: { run: AgentRun }) {
  const stats = [
    { label: "Events scanned", value: number.format(run.activity.scanned), hint: "In this run", icon: ScanSearch },
    { label: "Relevant events", value: number.format(run.activity.relevant), hint: "Match your interests", icon: BarChart3 },
    { label: "Included outcomes", value: number.format(run.activity.included), hint: `${run.activity.abstained} held back`, icon: ListChecks },
    { label: "Available credits", value: number.format(run.availableCredits), hint: "Virtual balance", icon: Coins },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
      {stats.map(({ label, value, hint, icon: Icon }) => (
        <Card key={label}>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4 pb-2 sm:p-6 sm:pb-3">
            <CardTitle className="text-xs leading-tight sm:text-sm">{label}</CardTitle>
            <Icon className="size-4 shrink-0 text-muted-foreground sm:size-5" aria-hidden="true" />
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xl font-semibold tabular-nums tracking-tight sm:text-2xl">{value}</p>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground sm:text-xs">{hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
