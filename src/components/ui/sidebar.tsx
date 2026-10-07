"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { Slot } from "@radix-ui/react-slot";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type SidebarContextValue = {
  isMobile: boolean;
  open: boolean;
  setOpen: (value: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (value: boolean) => void;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within a SidebarProvider.");
  return context;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return isMobile;
}

function SidebarProvider({ className, style, defaultOpen = true, open: controlledOpen, onOpenChange, children, ...props }: React.ComponentProps<"div"> & { defaultOpen?: boolean; open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const isMobile = useIsMobile();
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const [openMobile, setOpenMobile] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = React.useCallback((value: boolean) => {
    if (onOpenChange) onOpenChange(value);
    else setInternalOpen(value);
  }, [onOpenChange]);
  const toggleSidebar = React.useCallback(() => (isMobile ? setOpenMobile((value) => !value) : setOpen(!open)), [isMobile, open, setOpen]);
  const context = React.useMemo(() => ({ isMobile, open, setOpen, openMobile, setOpenMobile, toggleSidebar }), [isMobile, open, setOpen, openMobile, toggleSidebar]);
  return <SidebarContext.Provider value={context}><div data-slot="sidebar-wrapper" style={{ "--sidebar-width": "16rem", ...style } as React.CSSProperties} className={cn("group/sidebar-wrapper flex min-h-svh w-full has-[[data-slot=sidebar][data-state=collapsed]]:bg-sidebar", className)} {...props}>{children}</div></SidebarContext.Provider>;
}

function Sidebar({ className, children, side = "left", variant = "sidebar", collapsible = "offcanvas", ...props }: React.ComponentProps<"aside"> & { side?: "left" | "right"; variant?: "sidebar" | "floating" | "inset"; collapsible?: "offcanvas" | "icon" | "none" }) {
  const { isMobile, open, openMobile, setOpenMobile } = useSidebar();
  if (collapsible === "none") {
    return <aside data-slot="sidebar" data-variant={variant} className={cn("flex h-full w-[var(--sidebar-width)] flex-col bg-sidebar text-sidebar-foreground", className)} {...props}>{children}</aside>;
  }
  if (isMobile) {
    return <Sheet open={openMobile} onOpenChange={setOpenMobile}><SheetContent data-slot="sidebar" data-variant={variant} data-state="expanded" side={side} className="w-[var(--sidebar-width)] max-w-[18rem] bg-sidebar p-0 text-sidebar-foreground [&>button]:text-sidebar-foreground">{children}</SheetContent></Sheet>;
  }
  const offcanvas = !open && collapsible === "offcanvas";
  const sidebarPosition = side === "left"
    ? { left: offcanvas ? "calc(var(--sidebar-width) * -1)" : "0px" }
    : { right: offcanvas ? "calc(var(--sidebar-width) * -1)" : "0px" };
  return <aside data-slot="sidebar" data-variant={variant} data-state={open ? "expanded" : "collapsed"} className={cn("group peer hidden w-[var(--sidebar-width)] shrink-0 text-sidebar-foreground md:block", offcanvas && "w-0", className)} {...props}><div className={cn("relative h-svh w-[var(--sidebar-width)] transition-[width] duration-200 ease-linear", offcanvas && "!w-0")}><div style={sidebarPosition} className={cn("fixed inset-y-0 z-10 hidden h-svh w-[var(--sidebar-width)] flex-col border-r bg-sidebar transition-[left,right] duration-200 ease-linear md:flex", offcanvas && "pointer-events-none")}>{children}</div></div></aside>;
}

function SidebarInset({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-inset" className={cn("relative flex min-h-svh min-w-0 flex-1 flex-col bg-background", className)} {...props} />;
}

function SidebarTrigger({ className, ...props }: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar();
  return <Button data-slot="sidebar-trigger" variant="ghost" size="icon" className={cn("size-9", className)} onClick={toggleSidebar} {...props}><Menu className="size-4" /><span className="sr-only">Toggle navigation</span></Button>;
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) { return <div data-slot="sidebar-header" className={cn("flex flex-col gap-2 p-2", className)} {...props} />; }
function SidebarContent({ className, ...props }: React.ComponentProps<"div">) { return <div data-slot="sidebar-content" className={cn("flex min-h-0 flex-1 flex-col gap-2 overflow-auto", className)} {...props} />; }
function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) { return <div data-slot="sidebar-footer" className={cn("flex flex-col gap-2 p-2", className)} {...props} />; }
function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) { return <div data-slot="sidebar-group" className={cn("relative flex w-full min-w-0 flex-col p-2", className)} {...props} />; }
function SidebarGroupLabel({ className, ...props }: React.ComponentProps<"div">) { return <div data-slot="sidebar-group-label" className={cn("flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70", className)} {...props} />; }
function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) { return <ul data-slot="sidebar-menu" className={cn("flex w-full min-w-0 flex-col gap-1", className)} {...props} />; }
function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) { return <li data-slot="sidebar-menu-item" className={cn("group/menu-item relative", className)} {...props} />; }

function SidebarMenuButton({ className, asChild = false, isActive = false, tooltip, ...props }: React.ComponentProps<"button"> & { asChild?: boolean; isActive?: boolean; tooltip?: string }) {
  const Comp = asChild ? Slot : "button";
  return <Comp data-slot="sidebar-menu-button" data-active={isActive} title={tooltip} className={cn("flex h-9 w-full items-center gap-3 overflow-hidden rounded-md px-3 text-left text-sm outline-none ring-sidebar-ring transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground", className)} {...props} />;
}

export { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar };
