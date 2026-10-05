import Link from "next/link";
import { Settings2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { AgentRun } from "@/lib/domain";

export function WorkspaceSetup({ run }: { run: AgentRun }) {
  const sports = run.preferences.interests.length ? run.preferences.interests.join(" · ") : "All sports";
  const matchRate = run.activity.scanned ? Math.round((run.activity.bandMatched / run.activity.scanned) * 100) : 0;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div><CardTitle>Current setup</CardTitle><CardDescription>Your active agent preferences</CardDescription></div>
          <Button asChild variant="ghost" size="icon" aria-label="Change setup"><Link href="/onboarding"><Settings2 className="size-4" /></Link></Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-xs text-muted-foreground">Sports</p><p className="mt-1 font-medium">{sports}</p></div>
          <div><p className="text-xs text-muted-foreground">Risk</p><Badge variant="secondary" className="mt-1 capitalize">{run.preferences.riskProfile}</Badge></div>
          <div><p className="text-xs text-muted-foreground">Mode</p><p className="mt-1 font-medium capitalize">{run.preferences.mode.replace("-", " ")}</p></div>
          <div><p className="text-xs text-muted-foreground">Per-pick allocation</p><p className="mt-1 font-medium tabular-nums">{run.preferences.allocationPercent}% virtual credits</p></div>
        </div>
        <div className="border-t pt-4">
          <div className="mb-2 flex items-center justify-between text-xs"><span className="text-muted-foreground">Slate match rate</span><span className="font-medium tabular-nums">{matchRate}%</span></div>
          <Progress value={matchRate} aria-label={`Slate match rate ${matchRate}%`} />
          <p className="mt-2 text-xs text-muted-foreground">{run.activity.bandMatched} of {run.activity.scanned} scanned games fit the selected risk band.</p>
        </div>
      </CardContent>
    </Card>
  );
}
