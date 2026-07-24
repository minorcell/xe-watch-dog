"use client";

import { useEffect, useState } from "react";
import { Clock, LoaderCircle } from "lucide-react";

import { Pagination } from "@/components/ui/pagination";
import type { SyncRun } from "@/lib/database";

type SchedulerStatus = {
  run: SyncRun | null;
  mode: "vercel" | "self-hosted";
  schedule: string;
  timezone: string;
};

type SyncRunPage = {
  items: SyncRun[];
  total: number;
  page: number;
  pageSize: number;
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

function formatDate(date: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(date));
}

function duration(run: SyncRun) {
  if (!run.finishedAt) return "进行中";
  const seconds = Math.max(0, (new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000);
  return seconds < 1 ? "< 1 秒" : `${seconds.toFixed(1)} 秒`;
}

function triggerLabel(trigger: SyncRun["trigger"]) {
  return {
    manual: "手动",
    "vercel-cron": "Vercel Cron",
    "internal-cron": "内置 node-cron",
  }[trigger];
}

function statusLabel(status: SyncRun["status"]) {
  return {
    running: "运行中",
    completed: "已完成",
    failed: "失败",
  }[status];
}

function statusClass(status: SyncRun["status"]) {
  return {
    running: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-500",
    completed: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500",
    failed: "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-500",
  }[status];
}

function runStatus(run: SyncRun | null) {
  if (!run) return "尚未执行";
  return statusLabel(run.status);
}

export function SchedulerPanel() {
  const [status, setStatus] = useState<SchedulerStatus | null>(null);
  const [history, setHistory] = useState<SyncRunPage | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([
      fetch("/api/admin/github-sync-runs/latest"),
      fetch(`/api/admin/github-sync-runs?page=${page}&pageSize=${pageSize}`),
    ]).then(async ([statusResponse, historyResponse]) => {
      if (!active) return;
      if (!statusResponse.ok || !historyResponse.ok) {
        setError("调度记录加载失败");
        return;
      }
      const [nextStatus, nextHistory] = await Promise.all([
        statusResponse.json() as Promise<SchedulerStatus>,
        historyResponse.json() as Promise<SyncRunPage>,
      ]);
      if (!active) return;
      setStatus(nextStatus);
      setHistory(nextHistory);
      setError(null);
    }).catch(() => {
      if (active) setError("调度记录加载失败");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [page, pageSize]);

  if (!status || !history) {
    return (
      <div className="py-16 text-center">
        {error ? <p className="text-xs text-red-600 dark:text-red-500">{error}</p> : <LoaderCircle className="mx-auto size-5 animate-spin text-muted-foreground" />}
        {!error && <p className="mt-3 text-xs text-muted-foreground">加载中…</p>}
      </div>
    );
  }

  const mode = status.mode === "vercel" ? "Vercel Cron" : "内置 node-cron";

  return (
    <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={loading}>
      {error && (
        <p className="mb-3 rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-600 dark:text-red-500">
          {error}
        </p>
      )}
      <section className="rounded-lg border bg-card p-5">
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
      </section>

      <section className="mt-4 overflow-hidden rounded-lg border bg-card">
        <div className="border-b px-5 py-3">
          <h3 className="text-sm font-semibold">近期调度记录</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">按执行时间倒序排列</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b bg-muted/30">
                <th scope="col" className="h-8 px-3 pl-4 text-[11px] font-medium text-muted-foreground">执行时间</th>
                <th scope="col" className="h-8 px-3 text-[11px] font-medium text-muted-foreground">触发方式</th>
                <th scope="col" className="h-8 px-3 text-[11px] font-medium text-muted-foreground">状态</th>
                <th scope="col" className="h-8 px-3 text-[11px] font-medium text-muted-foreground">采集结果</th>
                <th scope="col" className="h-8 px-3 pr-4 text-[11px] font-medium text-muted-foreground">耗时</th>
              </tr>
            </thead>
            <tbody>
              {history.items.length === 0 ? (
                <tr><td colSpan={5} className="h-24 text-center text-xs text-muted-foreground">暂无调度记录</td></tr>
              ) : history.items.map((run) => (
                <tr key={run.id} className="border-b border-border/50 last:border-0">
                  <td className="h-10 whitespace-nowrap px-3 pl-4 text-xs tabular-nums">{formatDate(run.startedAt)}</td>
                  <td className="h-10 whitespace-nowrap px-3 text-xs">{triggerLabel(run.trigger)}</td>
                  <td className="h-10 px-3 text-xs">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusClass(run.status)}`}>{statusLabel(run.status)}</span>
                  </td>
                  <td className="h-10 px-3 text-xs text-muted-foreground">
                    {run.status === "completed" ? `${run.snapshotCount ?? 0} / ${run.repositoryCount ?? 0}` : run.status === "failed" ? (run.errorCode ?? "同步失败") : "-"}
                  </td>
                  <td className="h-10 whitespace-nowrap px-3 pr-4 text-xs tabular-nums text-muted-foreground">{duration(run)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          pageSize={pageSize}
          total={history.total}
          onPageChange={(nextPage) => {
            if (nextPage === page) return;
            setLoading(true);
            setPage(nextPage);
          }}
          onPageSizeChange={(size) => {
            if (size === pageSize) return;
            setLoading(true);
            setPageSize(size);
            setPage(1);
          }}
        />
      </section>
    </div>
  );
}
