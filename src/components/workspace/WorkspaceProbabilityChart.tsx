"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { AgentRun } from "@/lib/domain";

const workspaceChartConfig = {
  model: { label: "Model", color: "var(--chart-1)" },
  reference: { label: "Reference", color: "var(--chart-2)" },
} satisfies ChartConfig;

function conciseLabel(title: string, outcome: string) {
  const clean = title.replace(/^DEMO DATA:\s*/i, "").replace(/\s+—\s+.*/, "");
  const short = clean.length > 18 ? `${clean.slice(0, 18).trim()}...` : clean;
  return `${short} / ${outcome}`;
}

export function workspaceChartData(run: AgentRun) {
  return run.evaluated
    .filter((item) => item.event.category === "sports" && item.event.metadata.historical !== true)
    .slice(0, 10)
    .map((item) => ({
      label: conciseLabel(item.event.title, item.candidate.outcome),
      model: Math.round(item.candidate.probability * 1000) / 10,
      reference: typeof item.candidate.referenceProbability === "number" ? Math.round(item.candidate.referenceProbability * 1000) / 10 : null,
    }));
}

export function WorkspaceProbabilityChart({ run }: { run: AgentRun }) {
  const data = workspaceChartData(run);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Model comparison</CardTitle>
        <CardDescription>Model probability compared with the reference estimate across the current slate.</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length ? (
          <ChartContainer config={workspaceChartConfig} className="h-[320px] w-full">
            <AreaChart data={data} margin={{ left: 4, right: 10, top: 8 }} accessibilityLayer>
              <defs>
                <linearGradient id="workspaceModelGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-model)" stopOpacity={0.24} />
                  <stop offset="100%" stopColor="var(--color-model)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={9} minTickGap={24} tickFormatter={(value: string) => value.length > 14 ? `${value.slice(0, 14)}...` : value} />
              <YAxis domain={[0, 100]} tickLine={false} axisLine={false} width={42} tickFormatter={(value: number) => `${value}%`} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Area dataKey="reference" name="Reference" type="monotone" stroke="var(--color-reference)" strokeDasharray="4 4" fill="none" strokeWidth={2} connectNulls={false} />
              <Area dataKey="model" name="Model" type="monotone" stroke="var(--color-model)" fill="url(#workspaceModelGradient)" strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        ) : <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">No current sports forecasts are available for comparison.</p>}
      </CardContent>
    </Card>
  );
}
