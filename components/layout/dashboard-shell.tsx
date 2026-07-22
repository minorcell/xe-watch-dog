"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ChevronLeft, ChevronRight, Settings, Star } from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "watchdog-sidebar-collapsed";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) setCollapsed(stored === "1");
    setMounted(true);
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  if (!mounted) {
    return (
      <div className="flex h-dvh min-h-dvh overflow-hidden">
        <aside className="flex w-52 shrink-0 flex-col border-r border-border bg-sidebar" />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-12 shrink-0 items-center border-b border-border bg-background px-6" />
          <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh min-h-dvh overflow-hidden">
      <aside className={cn("flex shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-200", collapsed ? "w-12" : "w-52")}>
        {/* Brand */}
        {collapsed ? (
          <div className="flex h-12 shrink-0 items-center justify-center">
            <span className="grid size-6 place-items-center rounded-md bg-foreground text-background"><Activity className="size-3.5" /></span>
          </div>
        ) : (
          <div className="flex h-12 shrink-0 items-center gap-2.5 px-4">
            <span className="grid size-6 place-items-center rounded-md bg-foreground text-background"><Activity className="size-3.5" /></span>
            <span className="text-sm font-semibold tracking-tight">Watchdog</span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {/* Workpace */}
          <div>
            {!collapsed && <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-muted">Workpace</p>}
            <NavItem href="/dashboard" active={isActive("/dashboard") && !isActive("/dashboard/admin")} collapsed={collapsed} icon={Star} label="Star 看板" />
          </div>

          {/* System */}
          <div>
            {!collapsed && <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-muted">System</p>}
            <NavItem href="/dashboard/admin" active={isActive("/dashboard/admin")} collapsed={collapsed} icon={Settings} label="系统设置" />
          </div>
        </nav>

        {/* Footer */}
        <div className={cn("flex items-center border-t border-border px-2 py-2", collapsed ? "flex-col gap-2" : "justify-between")}>
          <LogoutButton />
          <ThemeToggle />
          <button type="button" onClick={toggle} className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/40" aria-label={collapsed ? "展开侧边栏" : "折叠侧边栏"}>
            {collapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center border-b border-border bg-background px-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">1024XEngineer</p>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6">{children}</main>
      </div>
    </div>
  );
}

function NavItem({ href, active, collapsed, icon: Icon, label }: { href: string; active: boolean; collapsed: boolean; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return collapsed ? (
    <Link href={href} title={label} className={cn("grid h-8 place-items-center rounded-md transition-colors", active ? "bg-sidebar-accent text-sidebar-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent")}>
      <Icon className="size-3.5" />
    </Link>
  ) : (
    <Link href={href} className={cn("flex h-8 items-center gap-2.5 rounded-md px-2.5 text-xs font-medium transition-colors", active ? "bg-sidebar-accent text-sidebar-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent")}>
      <Icon className="size-3.5" />
      {label}
    </Link>
  );
}
