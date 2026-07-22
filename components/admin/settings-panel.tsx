"use client";

import { useState } from "react";
import { Monitor, Timer } from "lucide-react";

import { MonitoringPanel } from "@/components/admin/monitoring-panel";
import { SchedulerPanel } from "@/components/admin/scheduler-panel";

type Tab = "monitoring" | "scheduler";

const TABS: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "monitoring", label: "监控仓库", icon: Monitor },
  { key: "scheduler", label: "调度任务", icon: Timer },
];

export function SettingsPanel() {
  const [tab, setTab] = useState<Tab>("monitoring");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold tracking-tight">系统设置</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">监控仓库、调度任务与人员管理</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-muted p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`inline-flex h-7 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors ${tab === t.key ? "bg-card text-foreground shadow-[0_1px_2px_rgb(0_0_0/4%)]" : "text-muted-foreground hover:text-foreground"}`}
          >
            <t.icon className="size-3" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "monitoring" && <MonitoringPanel />}
      {tab === "scheduler" && <SchedulerPanel />}
    </div>
  );
}
