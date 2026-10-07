import type { AgentRun, EvaluatedCandidate } from "@/lib/domain";

import GatewayFlow from "@/components/ui/gateway-flow";
import { WorkspaceActivity } from "@/components/workspace/WorkspaceActivity";
import { WorkspaceForecastList } from "@/components/workspace/WorkspaceForecasts";
import { WorkspaceSetup } from "@/components/workspace/WorkspaceSetup";
import { WorkspaceSignalChart } from "@/components/workspace/WorkspaceSignalChart";
import { WorkspaceStats } from "@/components/workspace/WorkspaceStats";

export function WorkspaceOverview({ run, featured }: { run: AgentRun; featured: EvaluatedCandidate[] }) {
  return <>
    <WorkspaceStats run={run} />
    <section className="relative isolate min-h-[14rem] overflow-hidden rounded-xl border border-border bg-card sm:min-h-[18rem]">
      <div className="absolute inset-0 opacity-55" aria-hidden="true">
        <GatewayFlow
          className="h-full w-full"
          speed={0.7}
          density={0.75}
          opacity={0.6}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-card via-card/75 to-transparent" aria-hidden="true" />
      <div className="relative z-10 flex min-h-[14rem] flex-col justify-between gap-5 p-5 sm:min-h-[18rem] sm:gap-8 sm:p-8">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">SYSTEM LAYER / GATEWAY FLOW</p>
          <h2 className="mt-3 max-w-md text-xl font-semibold tracking-tight sm:text-3xl">Routing signals into the workspace.</h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground sm:mt-3">A live routing field sits behind the forecast slate, making the handoff from signal to decision visible without adding another control surface.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <span className="rounded-full border border-border bg-background/70 px-3 py-1.5">Live canvas</span>
          <span className="rounded-full border border-border bg-background/70 px-3 py-1.5">Demo only</span>
          <span className="rounded-full border border-border bg-background/70 px-3 py-1.5">No execution</span>
        </div>
      </div>
    </section>
    <WorkspaceSignalChart run={run} />
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <WorkspaceSetup run={run} />
      <WorkspaceActivity run={run} />
    </div>
    <WorkspaceForecastList items={featured} run={run} />
  </>;
}
