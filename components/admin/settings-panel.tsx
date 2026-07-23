"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Monitor, Timer } from "lucide-react";

const MonitoringPanel = dynamic(() => import("@/components/admin/monitoring-panel").then((m) => ({ default: m.MonitoringPanel })), {
  loading: () => <div className="py-16 flex justify-center"><div className="size-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" /></div>,
});

const SchedulerPanel = dynamic(() => import("@/components/admin/scheduler-panel").then((m) => ({ default: m.SchedulerPanel })), {
  loading: () => <div className="py-16 flex justify-center"><div className="size-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" /></div>,
});

type Tab = "monitoring" | "scheduler";

const TABS: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "monitoring", label: "监控仓库", icon: Monitor },
  { key: "scheduler", label: "同步调度", icon: Timer },
];

export function SettingsPanel() {
  const [tab, setTab] = useState<Tab>("monitoring");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold tracking-tight">系统设置</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">管理监控仓库与 GitHub 同步</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-muted p-1 w-fit" role="tablist" aria-label="设置面板">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`inline-flex h-7 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors ${tab === t.key ? "bg-card text-foreground shadow-[0_1px_2px_rgb(0_0_0/4%)]" : "text-muted-foreground hover:text-foreground"}`}
          >
            <t.icon className="size-3" aria-hidden="true" />
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15, ease: "easeOut" as const }}
        >
          {tab === "monitoring" ? <MonitoringPanel /> : <SchedulerPanel />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
