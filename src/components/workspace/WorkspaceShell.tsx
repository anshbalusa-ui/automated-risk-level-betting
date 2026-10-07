"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { useAgent } from "@/components/AgentProvider";
import GatewayFlow from "@/components/ui/gateway-flow";

export function WorkspaceShell({ children, eyebrow, title, subtitle, action }: { children: ReactNode; eyebrow: string; title: string; subtitle?: string; action?: ReactNode }) {
  const { run } = useAgent();
  return (
    <div className="workspace-theme relative isolate min-h-svh bg-background text-foreground">
      <div className="workspace-shell-gateway" aria-hidden="true">
        <GatewayFlow className="workspace-shell-gateway-canvas" speed={0.35} density={0.42} opacity={0.52} style={{ mixBlendMode: "screen" }} />
      </div>
      <div className="workspace-shell-content relative z-10 flex min-h-svh">
        <SidebarProvider className="bg-transparent">
        <WorkspaceSidebar />
        <SidebarInset className="bg-transparent">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
            <SidebarTrigger aria-label="Toggle navigation" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{title}</p>
              <p className="hidden truncate text-xs text-muted-foreground sm:block">Simulation workspace</p>
            </div>
            <span className="ml-auto hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex"><span className={`size-1.5 rounded-full ${run ? "bg-foreground" : "bg-muted-foreground"}`} />{run ? "Ready" : "Preferences required"}</span>
          </header>

          <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div className="min-w-0">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{eyebrow}</p>
                <h1 className="truncate text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
                {subtitle ? <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{subtitle}</p> : null}
              </div>
              {action ? <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div> : null}
            </div>
            {children}
          </main>
          <footer className="border-t px-4 py-4 text-center text-xs text-muted-foreground sm:px-6">DEMO DATA / SIMULATION ONLY / VIRTUAL CREDITS</footer>
        </SidebarInset>
      </SidebarProvider>
    </div>
      </div>
  );
}

export function WorkspaceLoadingState({ title = "Restoring your workspace", text = "Loading this browser’s local simulation." }: { title?: string; text?: string }) {
  return (
    <section className="relative isolate flex min-h-72 overflow-hidden rounded-xl border border-dashed bg-card p-8 text-center">
      <div className="pointer-events-none absolute inset-0 opacity-35" aria-hidden="true">
        <GatewayFlow className="h-full w-full" speed={0.42} density={0.48} opacity={0.7} style={{ mixBlendMode: "screen" }} />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-card/60 via-card/82 to-card" aria-hidden="true" />
      <div className="relative z-10 m-auto" role="status" aria-live="polite">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">GATEWAY FLOW / LOADING</p>
        <h2 className="mt-3 text-xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
      </div>
    </section>
  );
}

export function WorkspaceEmptyState({ title = "Start with your selections", text = "Choose sports and a risk level to create a deterministic demo run." }: { title?: string; text?: string }) {
  return (
    <section className="relative isolate flex min-h-72 overflow-hidden rounded-xl border border-dashed bg-card p-8 text-center">
      <div className="pointer-events-none absolute inset-0 opacity-45" aria-hidden="true">
        <GatewayFlow className="h-full w-full" speed={0.55} density={0.58} opacity={0.7} />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-card/65 via-card/85 to-card" aria-hidden="true" />
      <div className="relative z-10 m-auto flex flex-col items-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">GATEWAY FLOW / AWAITING SELECTION</p>
        <h2 className="mt-3 text-xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{text}</p>
        <Button asChild className="mt-5"><Link href="/onboarding">Choose preferences</Link></Button>
      </div>
    </section>
  );
}
