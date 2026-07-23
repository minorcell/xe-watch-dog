"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ExternalLink, LoaderCircle, RefreshCw } from "lucide-react";

import { Pagination } from "@/components/ui/pagination";
import { RepoDetailModal } from "@/components/stars/repo-detail-modal";
import { Switch } from "@/components/ui/switch";
import type { Repository, SyncRun } from "@/lib/database";

function timeAgo(date: string | null) {
  if (!date) return null;
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  return `${Math.floor(hours / 24)} 天前`;
}

type Message = { text: string; error: boolean } | null;

export function MonitoringPanel() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [total, setTotal] = useState(0);
  const [monitoredCount, setMonitoredCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const [lastRun, setLastRun] = useState<SyncRun | null>(null);
  const [toggling, setToggling] = useState<Set<number>>(new Set());
  const [selectedRepository, setSelectedRepository] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const loadPage = useCallback(async (nextPage: number, nextPageSize: number) => {
    const response = await fetch(`/api/admin/repositories?page=${nextPage}&pageSize=${nextPageSize}`);
    if (!response.ok) return;
    const data = await response.json();
    setRepositories(data.items);
    setTotal(data.total);
    setMonitoredCount(data.monitoredCount);
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.all([
      fetch(`/api/admin/repositories?page=${page}&pageSize=${pageSize}`),
      fetch("/api/admin/github-sync-runs/latest"),
    ]).then(async ([repositoriesResponse, runResponse]) => {
      if (!active) return;
      if (repositoriesResponse.ok) {
        const data = await repositoriesResponse.json();
        setRepositories(data.items);
        setTotal(data.total);
        setMonitoredCount(data.monitoredCount);
      }
      if (runResponse.ok) {
        const data = await runResponse.json();
        setLastRun(data.run ?? null);
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, [page, pageSize]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  async function toggleMonitoring(repository: Repository) {
    setToggling((current) => new Set(current).add(repository.githubId));
    try {
      const response = await fetch(`/api/admin/repositories/${repository.githubId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monitoringEnabled: !repository.monitoringEnabled }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setMessage({ text: body?.message ?? "更新监控设置失败", error: true });
        return;
      }
      setRepositories((current) => current.map((item) => item.githubId === repository.githubId
        ? { ...item, monitoringEnabled: !repository.monitoringEnabled }
        : item));
      setMonitoredCount((current) => repository.monitoringEnabled ? current - 1 : current + 1);
    } finally {
      setToggling((current) => {
        const next = new Set(current);
        next.delete(repository.githubId);
        return next;
      });
    }
  }

  async function syncRepositories() {
    setSyncing(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/github-sync-runs", { method: "POST" });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage({ text: data?.message ?? "GitHub 同步失败", error: true });
        return;
      }
      setPage(1);
      setLastRun(data);
      await loadPage(1, pageSize);
      setMessage({
        text: `同步 ${data.repositoryCount} 个仓库，写入 ${data.snapshotCount} 条快照`,
        error: false,
      });
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return <div className="py-16 text-center"><LoaderCircle className="mx-auto size-5 animate-spin text-muted-foreground" /><p className="mt-3 text-xs text-muted-foreground">加载中…</p></div>;
  }

  const relativeTime = timeAgo(lastRun?.finishedAt ?? null);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          共 {total} 个仓库
          <span className="ml-1.5 font-medium text-emerald-600 dark:text-emerald-500">{monitoredCount} 个监控中</span>
          {relativeTime && <span className="ml-2 text-muted-foreground/60">· 上次同步 {relativeTime}</span>}
        </p>
        <button type="button" onClick={syncRepositories} disabled={syncing} className="inline-flex h-7 items-center gap-1.5 rounded-md bg-foreground px-2.5 text-[11px] font-medium text-background hover:bg-foreground/90 disabled:opacity-40">
          {syncing ? <LoaderCircle className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}同步 GitHub
        </button>
      </div>

      {message && (
        <div className={`mb-3 rounded-md border px-3 py-1.5 text-[11px] ${message.error ? "border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-500" : "border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-500"}`}>
          {message.text}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead><tr className="border-b bg-muted/30">
              <th scope="col" className="h-8 px-3 text-[11px] font-medium text-muted-foreground first:pl-4">仓库</th>
              <th scope="col" className="h-8 px-3 text-[11px] font-medium text-muted-foreground">描述</th>
              <th scope="col" className="h-8 w-16 px-3 text-[11px] font-medium text-muted-foreground">语言</th>
              <th scope="col" className="h-8 w-24 px-3 text-[11px] font-medium text-muted-foreground">可用性</th>
              <th scope="col" className="h-8 w-24 px-3 text-center text-[11px] font-medium text-muted-foreground last:pr-4">监控</th>
            </tr></thead>
            <tbody>
              {repositories.length === 0 ? (
                <tr><td colSpan={5} className="h-32 text-center text-xs text-muted-foreground">
                  <p className="font-medium">还没有仓库数据</p>
                  <p className="mt-1 text-[11px]">点击右上角「同步 GitHub」获取组织仓库</p>
                </td></tr>
              ) : repositories.map((repository) => (
                <tr
                  key={repository.githubId}
                  className={`cursor-pointer border-b border-border/50 transition-colors last:border-0 hover:bg-muted/30 ${!repository.monitoringEnabled ? "opacity-50" : ""}`}
                  onClick={() => setSelectedRepository(repository.githubId)}
                >
                  <td className="h-10 px-3 text-xs font-medium first:pl-4">
                    <Link href={repository.htmlUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono hover:text-primary" onClick={(event) => event.stopPropagation()}>
                      {repository.fullName.split("/")[1]}<ExternalLink className="size-3 text-muted-foreground" />
                    </Link>
                  </td>
                  <td className="h-10 max-w-72 truncate px-3 text-xs text-muted-foreground">{repository.description ?? "-"}</td>
                  <td className="h-10 px-3 text-[11px] text-muted-foreground">{repository.language ?? "-"}</td>
                  <td className="h-10 px-3 text-[11px] text-muted-foreground">
                    {repository.unavailableAt ? "当前不可见" : "可用"}
                  </td>
                  <td className="h-10 px-3 text-center last:pr-4" onClick={(event) => event.stopPropagation()}>
                    <div className="flex justify-center">
                      <Switch checked={repository.monitoringEnabled} loading={toggling.has(repository.githubId)} onCheckedChange={() => toggleMonitoring(repository)} aria-label={`监控 ${repository.fullName}`} size="default" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} />
      </div>

      <RepoDetailModal repositoryId={selectedRepository} open={selectedRepository !== null} onClose={() => setSelectedRepository(null)} />
    </div>
  );
}
