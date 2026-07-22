"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle, Clock, LoaderCircle, XCircle } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import type { SchedulerTask } from "@/lib/database";

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  return `${Math.floor(hours / 24)} 天前`;
}

export function SchedulerPanel() {
  const [tasks, setTasks] = useState<SchedulerTask[]>([]);
  const [lastRun, setLastRun] = useState<{ tasks: { name: string; ok: boolean; message: string }[]; ranAt: string; mode?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    const [tRes, lRes] = await Promise.all([
      fetch("/api/admin/scheduler"),
      fetch("/api/admin/scheduler/last-run"),
    ]);
    if (tRes.ok) setTasks(await tRes.json());
    if (lRes.ok) setLastRun(await lRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function toggle(name: string, current: boolean) {
    setToggling((prev) => new Set(prev).add(name));
    await fetch("/api/admin/scheduler", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, enabled: !current }),
    });
    setTasks((prev) => prev.map((t) => t.name === name ? { ...t, enabled: !current } : t));
    setToggling((prev) => { const next = new Set(prev); next.delete(name); return next; });
  }

  if (loading) {
    return <div className="py-16 text-center"><LoaderCircle className="mx-auto size-5 animate-spin text-muted-foreground" /><p className="mt-3 text-xs text-muted-foreground">加载中…</p></div>;
  }

  const mode = lastRun?.mode === "vercel" ? "Vercel Cron" : "内置 node-cron";

  return (
    <div className="grid gap-6">
      {/* Task list */}
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="divide-y divide-border/50">
          {tasks.map((t) => (
            <div key={t.name} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-xs font-medium font-mono">{t.name}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{t.description}</p>
              </div>
              <Switch checked={t.enabled} loading={toggling.has(t.name)} onCheckedChange={() => toggle(t.name, t.enabled)} aria-label={t.description} size="default" />
            </div>
          ))}
        </div>
      </div>

      {/* Run status */}
      <div className="rounded-lg border bg-card p-5">
        <h3 className="text-xs font-semibold mb-3 flex items-center gap-2">
          <Clock className="size-3.5 text-muted-foreground" />
          运行状态
        </h3>

        <div className="grid gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">调度模式</span>
            <span className="font-mono">{mode}</span>
          </div>

          {lastRun ? (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">上次执行</span>
                <span>{timeAgo(lastRun.ranAt)}</span>
              </div>
              {lastRun.tasks.map((t) => (
                <div key={t.name} className="flex items-center justify-between pl-3 border-l-2 border-border/50">
                  <span className="text-muted-foreground font-mono text-[11px]">{t.name}</span>
                  <span className={`inline-flex items-center gap-1 text-[11px] ${t.ok ? "text-emerald-600 dark:text-emerald-500" : "text-destructive"}`}>
                    {t.ok ? <CheckCircle className="size-3" /> : <XCircle className="size-3" />}
                    {t.message}
                  </span>
                </div>
              ))}
            </>
          ) : (
            <p className="text-muted-foreground">尚未执行过调度任务</p>
          )}
        </div>
      </div>
    </div>
  );
}
