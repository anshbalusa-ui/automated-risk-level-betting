"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { BriefcaseBusiness, History, LayoutDashboard, Settings2, TrendingUp } from "lucide-react";

import { BrandMark } from "@/components/BrandMark";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navigation: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/forecasts", label: "Forecasts", icon: TrendingUp },
  { href: "/portfolio", label: "Portfolio", icon: BriefcaseBusiness },
  { href: "/history", label: "History", icon: History },
];

function currentPath(pathname: string) {
  const basePath = process.env.NEXT_PUBLIC_APP_BASE_PATH ?? "";
  const path = basePath && pathname.startsWith(basePath) ? pathname.slice(basePath.length) : pathname;
  return path.replace(/\/$/, "") || "/";
}

export function WorkspaceSidebar() {
  const pathname = currentPath(usePathname());
  return (
    <Sidebar className="workspace-sidebar border-r bg-sidebar">
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-3 rounded-md px-2 py-1.5 outline-none ring-sidebar-ring transition-colors hover:bg-sidebar-accent focus-visible:ring-2">
          <BrandMark />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold tracking-tight">RØGUE</span>
            <span className="block truncate text-xs text-sidebar-foreground/60">Simulation workspace</span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigate</SidebarGroupLabel>
          <SidebarMenu>
            {navigation.map(({ href, label, icon: Icon }) => {
              const active = href === "/forecasts"
                ? pathname === href || pathname.startsWith("/forecast/")
                : pathname === href || pathname.startsWith(`${href}/`);
              return (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton asChild isActive={active} tooltip={label}>
                    <Link href={href} aria-current={active ? "page" : undefined}>
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="rounded-lg border bg-sidebar-accent/40 p-3">
          <p className="mb-3 text-xs leading-relaxed text-sidebar-foreground/65">Simulation only. Virtual credits stay in this browser.</p>
          <SidebarMenuButton asChild className="h-8 justify-center border border-sidebar-border bg-sidebar text-xs hover:bg-sidebar-accent">
            <Link href="/onboarding"><Settings2 className="size-3.5" aria-hidden="true" />Edit preferences</Link>
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
