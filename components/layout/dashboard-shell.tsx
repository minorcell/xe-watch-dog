import Link from "next/link";
import { Activity, FolderGit2, Star } from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh md:grid md:h-dvh md:max-h-dvh md:grid-cols-[240px_minmax(0,1fr)] md:overflow-hidden">
      <aside className="hidden h-full min-h-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-20 shrink-0 items-center gap-3 px-5">
          <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_8px_20px_rgb(37_99_235/18%)]">
            <Activity className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold leading-tight">Watchdog</p>
            <p className="mt-0.5 text-[11px] text-sidebar-muted">Repository signals</p>
          </div>
        </div>

        <div className="mx-3 flex items-center gap-3 rounded-xl border border-sidebar-border bg-background/70 px-3 py-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-foreground text-background">
            <FolderGit2 className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">1024XEngineer</p>
            <p className="mt-0.5 text-[11px] text-sidebar-muted">GitHub Organization</p>
          </div>
        </div>

        <nav className="min-h-0 flex-1 px-3 py-6" aria-label="主导航">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-muted">Workspace</p>
          <Link
            href="/dashboard"
            className="flex h-11 items-center gap-3 rounded-xl bg-sidebar-accent px-3 text-sm font-medium text-primary shadow-[inset_0_0_0_1px_rgb(37_99_235/6%)] transition-colors hover:bg-accent"
          >
            <Star className="size-4" />
            Star 看板
          </Link>
        </nav>

        <div className="shrink-0 border-t border-sidebar-border p-3">
          <LogoutButton />
        </div>
      </aside>

      <div className="min-w-0 md:flex md:min-h-0 md:flex-col">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b bg-card/90 px-4 backdrop-blur-xl md:static md:h-20 md:px-8">
          <div className="flex items-center gap-3 md:hidden">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Activity className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold leading-tight">Watchdog</p>
              <p className="text-[10px] text-muted-foreground">1024XEngineer</p>
            </div>
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">GitHub intelligence</p>
          </div>
          <div className="md:hidden">
            <LogoutButton />
          </div>
        </header>
        <main className="min-w-0 px-4 py-6 md:min-h-0 md:flex-1 md:overflow-y-auto md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
