"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Activity, Building2, ChevronLeft, ChevronRight, Star } from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const STORAGE_KEY = "watchdog-sidebar-collapsed";
const SIDEBAR_WIDTH = "w-52";
const SIDEBAR_COLLAPSED_WIDTH = "w-12";

export function DashboardShell({ children }: { children: React.ReactNode }) {
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

  // Prevent hydration flash — render nothing until mounted
  if (!mounted) {
    return (
      <div className="flex h-dvh min-h-dvh overflow-hidden">
        <aside className={`flex ${SIDEBAR_WIDTH} shrink-0 flex-col border-r border-border bg-sidebar`} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-12 shrink-0 items-center border-b border-border bg-background px-6" />
          <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh min-h-dvh overflow-hidden">
      {/* ── Sidebar ── */}
      <aside
        className={`flex shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-200 ${
          collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH
        }`}
      >
        {/* Brand */}
        {collapsed ? (
          <div className="flex h-12 shrink-0 items-center justify-center">
            <span className="grid size-6 place-items-center rounded-md bg-foreground text-background">
              <Activity className="size-3.5" />
            </span>
          </div>
        ) : (
          <div className="flex h-12 shrink-0 items-center gap-2.5 px-4">
            <span className="grid size-6 place-items-center rounded-md bg-foreground text-background">
              <Activity className="size-3.5" />
            </span>
            <span className="text-sm font-semibold tracking-tight">Watchdog</span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-2 py-3" aria-label="主导航">
          {collapsed ? (
            <>
              <Link href="/dashboard" className="grid h-8 place-items-center rounded-md bg-sidebar-accent text-sidebar-foreground transition-colors hover:bg-sidebar-accent" title="Star 看板">
                <Star className="size-3.5" />
              </Link>
              <Link href="/dashboard/admin" className="grid h-8 place-items-center rounded-md text-sidebar-foreground transition-colors hover:bg-sidebar-accent" title="组织管理">
                <Building2 className="size-3.5" />
              </Link>
            </>
          ) : (
            <>
              <Link href="/dashboard" className="flex h-8 items-center gap-2.5 rounded-md bg-sidebar-accent px-2.5 text-xs font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent">
                <Star className="size-3.5" />Star 看板
              </Link>
              <Link href="/dashboard/admin" className="flex h-8 items-center gap-2.5 rounded-md px-2.5 text-xs font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent">
                <Building2 className="size-3.5" />组织管理
              </Link>
            </>
          )}
        </nav>

        {/* Footer */}
        <div
          className={`flex items-center border-t border-border px-2 py-2 ${
            collapsed ? "flex-col gap-2" : "justify-between"
          }`}
        >
          <LogoutButton />
          <ThemeToggle />
          <button
            type="button"
            onClick={toggle}
            className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={collapsed ? "展开侧边栏" : "折叠侧边栏"}
            title={collapsed ? "展开侧边栏" : "折叠侧边栏"}
          >
            {collapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            1024XEngineer
          </p>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
