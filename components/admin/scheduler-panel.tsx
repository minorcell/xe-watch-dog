"use client";

import { useEffect, useState } from "react";
import { Clock, LoaderCircle } from "lucide-react";

import type { SyncRun } from "@/lib/database";

type SchedulerStatus = {
  run: SyncRun | null;
  mode: "vercel" | "self-hosted";
  schedule: string;
  timezone: string;
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  return `${Math.floor(hours / 24)} 天前`;
}

function runStatus(run: SyncRun | null) {
  if (!run) return "尚未执行";
  if (run.status === "running") return "运行中";
  if (run.status === "failed") return "失败";
  return "已完成";
}

export function SchedulerPanel() {
  const [status, setStatus] = useState<SchedulerStatus | null>(null);

  useEffect(() => {
    let active = true;
    void fetch("/api/admin/github-sync-runs/latest").then(async (response) => {
      if (active && response.ok) setStatus(await response.json());
    });
    return () => { active = false; };
  }, []);

  if (!status) {
    return <div className="py-16 text-center"><LoaderCircle className="mx-auto size-5 animate-spin text-muted-foreground" /><p className="mt-3 text-xs text-muted-foreground">加载中…</p></div>;
  }

  const mode = status.mode === "vercel" ? "Vercel Cron" : "内置 node-cron";

  return (
    <div className="rounded-lg border bg-card p-5">
      <h3 className="mb-4 flex items-center gap-2 text-xs font-semibold">
        <Clock className="size-3.5 text-muted-foreground" />
        GitHub 同步
      </h3>
      <div className="grid gap-3 text-xs">
        <div className="flex justify-between"><span className="text-muted-foreground">调度模式</span><span>{mode}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Cron</span><span className="font-mono">{status.schedule}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">时区</span><span className="font-mono">{status.timezone}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">最近状态</span><span>{runStatus(status.run)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">上次执行</span><span>{status.run ? timeAgo(status.run.startedAt) : "尚未执行"}</span></div>
        {status.run?.status === "completed" && (
          <div className="flex justify-between"><span className="text-muted-foreground">采集结果</span><span>{status.run.snapshotCount ?? 0} / {status.run.repositoryCount ?? 0}</span></div>
        )}
        {status.run?.status === "failed" && status.run.errorMessage && (
          <p className="border-t pt-3 text-red-600 dark:text-red-500">{status.run.errorMessage}</p>
        )}
      </div>
    </div>
  );
}
