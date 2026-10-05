import type { AgentRun, EvaluatedCandidate } from "@/lib/domain";

import { WorkspaceActivity } from "@/components/workspace/WorkspaceActivity";
import { WorkspaceForecastList } from "@/components/workspace/WorkspaceForecasts";
import { WorkspaceSetup } from "@/components/workspace/WorkspaceSetup";
import { WorkspaceSignalChart } from "@/components/workspace/WorkspaceSignalChart";
import { WorkspaceStats } from "@/components/workspace/WorkspaceStats";

export function WorkspaceOverview({ run, featured }: { run: AgentRun; featured: EvaluatedCandidate[] }) {
  return <>
    <WorkspaceStats run={run} />
    <WorkspaceSignalChart run={run} />
    <div className="grid gap-6 lg:grid-cols-2"><WorkspaceSetup run={run} /><WorkspaceActivity run={run} /></div>
    <WorkspaceForecastList items={featured} run={run} />
  </>;
}
