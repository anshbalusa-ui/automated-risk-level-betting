"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Bell, Search } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { useAgent } from "@/components/AgentProvider";

export function WorkspaceShell({ children, eyebrow, title, subtitle, action }: { children: ReactNode; eyebrow: string; title: string; subtitle?: string; action?: ReactNode }) {
  const { run } = useAgent();
  return (
    <div className="workspace-theme min-h-svh bg-background text-foreground">
      <SidebarProvider>
        <WorkspaceSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
            <SidebarTrigger aria-label="Toggle navigation" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{title}</p>
              <p className="hidden truncate text-xs text-muted-foreground sm:block">RØGUE simulation workspace</p>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <span className="mr-2 hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex"><span className={`size-1.5 rounded-full ${run ? "bg-emerald-500" : "bg-muted-foreground"}`} />{run ? "Ready" : "Setup required"}</span>
              <Button variant="ghost" size="icon" aria-label="Search" title="Search is not available in the demo"><Search className="size-4" /></Button>
              <Button variant="ghost" size="icon" aria-label="Notifications" title="Notifications are not available in the demo"><Bell className="size-4" /></Button>
              <Avatar className="ml-1 size-8" aria-label="RØGUE demo profile"><AvatarFallback className="text-xs font-semibold">R</AvatarFallback></Avatar>
            </div>
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
          <footer className="border-t px-4 py-4 text-center text-xs text-muted-foreground sm:px-6">DEMO DATA · SIMULATION ONLY · VIRTUAL CREDITS</footer>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

export function WorkspaceEmptyState({ title = "Start with your setup", text = "Choose sports and a risk level to create a deterministic demo run." }: { title?: string; text?: string }) {
  return <section className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed bg-card p-8 text-center"><h2 className="text-xl font-semibold tracking-tight">{title}</h2><p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{text}</p><Button asChild className="mt-5"><Link href="/onboarding">Set up RØGUE</Link></Button></section>;
}
