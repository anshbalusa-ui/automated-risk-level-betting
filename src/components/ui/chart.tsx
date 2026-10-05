"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@/lib/utils";

const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = {
  [key: string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & ({ color?: string; theme?: never } | { color?: never; theme: Record<keyof typeof THEMES, string> });
};

type ChartContextProps = { config: ChartConfig };
const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) throw new Error("useChart must be used within a <ChartContainer />");
  return context;
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;
  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = "Chart";

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(([, item]) => item.theme || item.color);
  if (!colorConfig.length) return null;
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(([theme, prefix]) => `${prefix} [data-chart=${id}] {\n${colorConfig
            .map(([key, item]) => {
              const color = item.theme?.[theme as keyof typeof item.theme] ?? item.color;
              return color ? `  --color-${key}: ${color};` : "";
            })
            .join("\n")}\n}`)
          .join("\n"),
      }}
    />
  );
};

const ChartTooltip = RechartsPrimitive.Tooltip;

type ChartTooltipContentProps = React.ComponentProps<"div"> & Partial<RechartsPrimitive.TooltipContentProps> & {
  hideLabel?: boolean;
  hideIndicator?: boolean;
  indicator?: "line" | "dot" | "dashed";
  nameKey?: string;
  labelKey?: string;
};

const ChartTooltipContent = React.forwardRef<HTMLDivElement, ChartTooltipContentProps>(
  ({ active, payload, className, indicator = "dot", hideLabel = false, hideIndicator = false, label, labelFormatter, formatter, color, nameKey, labelKey, ...props }, ref) => {
    const { config } = useChart();
    if (!active || !payload?.length) return null;
    const item = payload[0];
    const key = `${labelKey ?? item.dataKey ?? item.name ?? "value"}`;
    const itemConfig = getPayloadConfigFromPayload(config, item, key);
    const tooltipLabel = hideLabel ? null : labelFormatter ? labelFormatter(label, payload) : itemConfig?.label ?? label;
    return (
      <div ref={ref} className={cn("grid min-w-32 gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl", className)} {...props}>
        {tooltipLabel ? <div className="font-medium">{tooltipLabel}</div> : null}
        <div className="grid gap-1.5">
          {payload.map((entry, index) => {
            const entryKey = `${nameKey ?? entry.name ?? entry.dataKey ?? "value"}`;
            const entryConfig = getPayloadConfigFromPayload(config, entry, entryKey);
            const indicatorColor = color ?? entry.color ?? "currentColor";
            return (
              <div key={`${entry.dataKey ?? entry.name ?? "value"}-${index}`} className="flex w-full items-center gap-2">
                {!hideIndicator && <div className={cn("shrink-0 rounded-[2px]", indicator === "dot" && "size-2.5", indicator === "line" && "h-0.5 w-3", indicator === "dashed" && "h-0 w-3 border-t border-dashed")} style={{ backgroundColor: indicator === "dashed" ? "transparent" : indicatorColor, borderColor: indicatorColor }} />}
                {formatter ? formatter(entry.value, entry.name, entry, index, entry.payload) : <><span className="text-muted-foreground">{entryConfig?.label ?? entry.name}</span><span className="ml-auto font-mono font-medium tabular-nums text-foreground">{typeof entry.value === "number" ? `${entry.value.toFixed(1)}%` : entry.value ?? "—"}</span></>}
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);
ChartTooltipContent.displayName = "ChartTooltip";

const ChartLegend = RechartsPrimitive.Legend;

type ChartLegendContentProps = React.ComponentProps<"div"> & Pick<RechartsPrimitive.DefaultLegendContentProps, "payload" | "verticalAlign"> & { hideIcon?: boolean; nameKey?: string };

const ChartLegendContent = React.forwardRef<HTMLDivElement, ChartLegendContentProps>(
  ({ className, hideIcon = false, payload, verticalAlign = "bottom", nameKey }, ref) => {
    const { config } = useChart();
  if (!payload?.length) return null;
  return (
    <div ref={ref} className={cn("flex items-center justify-center gap-4", verticalAlign === "top" ? "pb-3" : "pt-3", className)}>
      {payload.map((item) => {
        const key = `${nameKey ?? item.dataKey ?? "value"}`;
        const itemConfig = getPayloadConfigFromPayload(config, item, key);
        return (
          <div key={`${item.value}`} className="flex items-center gap-1.5 [&>svg]:size-3 [&>svg]:text-muted-foreground">
            {itemConfig?.icon && !hideIcon ? <itemConfig.icon /> : <div className="size-2 shrink-0 rounded-[2px]" style={{ backgroundColor: item.color }} />}
            {itemConfig?.label ?? item.value}
          </div>
        );
      })}
    </div>
  );
});
ChartLegendContent.displayName = "ChartLegend";

function getPayloadConfigFromPayload(config: ChartConfig, payload: unknown, key: string) {
  if (typeof payload !== "object" || payload === null) return undefined;
  const record = payload as Record<string, unknown>;
  const nested = typeof record.payload === "object" && record.payload !== null ? record.payload as Record<string, unknown> : undefined;
  const configKey = typeof record[key] === "string" ? record[key] as string : typeof nested?.[key] === "string" ? nested[key] as string : key;
  return config[configKey] ?? config[key];
}

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartStyle };
