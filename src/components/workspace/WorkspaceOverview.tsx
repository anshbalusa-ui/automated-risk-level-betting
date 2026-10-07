import type { AgentRun, EvaluatedCandidate } from "@/lib/domain";

import { WorkspaceForecastList } from "@/components/workspace/WorkspaceForecasts";
import { WorkspaceSetup } from "@/components/workspace/WorkspaceSetup";
import { WorkspaceProbabilityChart } from "@/components/workspace/WorkspaceProbabilityChart";
import { WorkspaceStats } from "@/components/workspace/WorkspaceStats";

export function WorkspaceOverview({ run, featured }: { run: AgentRun; featured: EvaluatedCandidate[] }) {
  return <>
    <WorkspaceStats run={run} />
    <WorkspaceForecastList
      items={featured}
      run={run}
      title="Start with a forecast"
      description="Open a pick to review the evidence and decide whether to simulate it."
    />
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <WorkspaceSetup run={run} />
      <WorkspaceProbabilityChart run={run} />
    </div>
  </>;
}
