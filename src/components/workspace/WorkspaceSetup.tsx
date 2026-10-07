import Link from "next/link";
import { Settings2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AgentRun } from "@/lib/domain";

export function WorkspaceSetup({ run }: { run: AgentRun }) {
  const interests = run.preferences.interests.length ? run.preferences.interests.join(" / ") : "All sports";
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div><CardTitle>Configuration</CardTitle><CardDescription>How the agent is configured</CardDescription></div>
          <Button asChild variant="ghost" size="icon" aria-label="Change preferences"><Link href="/onboarding"><Settings2 className="size-4" /></Link></Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-xs text-muted-foreground">Interests</p><p className="mt-1 font-medium">{interests}</p></div>
          <div><p className="text-xs text-muted-foreground">Risk level</p><Badge variant="secondary" className="mt-1 capitalize">{run.preferences.riskProfile}</Badge></div>
          <div><p className="text-xs text-muted-foreground">Mode</p><p className="mt-1 font-medium capitalize">{run.preferences.mode.replace("-", " ")}</p></div>
          <div><p className="text-xs text-muted-foreground">Per-pick allocation</p><p className="mt-1 font-medium tabular-nums">{run.preferences.allocationPercent}% virtual credits</p></div>
        </div>
      </CardContent>
    </Card>
  );
}
