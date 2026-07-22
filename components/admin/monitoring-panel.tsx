"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, LoaderCircle, RefreshCw, Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pagination } from "@/components/ui/pagination";
import { Switch } from "@/components/ui/switch";
import type { Repo } from "@/lib/database";

export function MonitoringPanel() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [total, setTotal] = useState(0);
  const [monitoredCount, setMonitoredCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [toggling, setToggling] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{ githubRepo: string } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/admin/repos?page=${page}&pageSize=${pageSize}`);
    if (res.ok) {
      const data = await res.json();
      setRepos(data.items ?? data);
      setTotal(data.total ?? (data.items ? data.items.length : data.length));
      setMonitoredCount(data.monitoredCount ?? 0);
    }
    setLoading(false);
  }, [page, pageSize]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function toggleMonitor(githubRepo: string, current: boolean) {
    setToggling((prev) => new Set(prev).add(githubRepo));
    await fetch("/api/admin/repos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: current ? "unmonitor" : "monitor", githubRepo }),
    });
    setRepos((prev) => prev.map((r) => r.githubRepo === githubRepo ? { ...r, monitoringEnabled: !current } : r));
    setToggling((prev) => { const next = new Set(prev); next.delete(githubRepo); return next; });
  }

  async function syncRepos() {
    setSyncing(true); setSyncMsg("");
    setPage(1);
    const res = await fetch("/api/admin/repos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "sync" }) });
    const data = await res.json();
    setSyncMsg(res.ok ? `新增 ${data.added}，更新 ${data.updated}` : (data.message ?? "同步失败"));
    if (res.ok) {
      const r = await fetch(`/api/admin/repos?page=1&pageSize=${pageSize}`);
      if (r.ok) { const d = await r.json(); setRepos(d.items ?? d); setTotal(d.total ?? (d.items ? d.items.length : d.length)); setMonitoredCount(d.monitoredCount ?? 0); }
    }
    setSyncing(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await fetch("/api/admin/repos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "unmonitor", githubRepo: deleteTarget.githubRepo }) });
    setDeleteTarget(null);
    setRepos((prev) => prev.filter((r) => r.githubRepo !== deleteTarget.githubRepo));
  }

  // Client-side sort: monitored first
  const sorted = useMemo(() => {
    const monitored = repos.filter((r) => r.monitoringEnabled);
    const unmonitored = repos.filter((r) => !r.monitoringEnabled);
    return [...monitored, ...unmonitored];
  }, [repos]);

  if (loading) {
    return <div className="py-16 text-center"><LoaderCircle className="mx-auto size-5 animate-spin text-muted-foreground" /><p className="mt-3 text-xs text-muted-foreground">加载中…</p></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground">
          从 GitHub 同步仓库列表，开启监控后纳入 Star 采集
          <span className="mx-1.5 text-border">|</span>
          共 {total} 个仓库
          <span className="ml-1 text-emerald-600 dark:text-emerald-500 font-medium">{monitoredCount} 个监控中</span>
        </p>
        <button type="button" onClick={syncRepos} disabled={syncing} className="inline-flex h-7 items-center gap-1.5 rounded-md bg-foreground px-2.5 text-[11px] font-medium text-background hover:bg-foreground/90 disabled:opacity-40">
          {syncing ? <LoaderCircle className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}从 GitHub 刷新
        </button>
      </div>

      {syncMsg && <div className="mb-3 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-[11px] text-emerald-600 dark:text-emerald-500">{syncMsg}</div>}

      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead><tr className="border-b bg-muted/30">
              <th className="h-8 px-3 text-[11px] font-medium text-muted-foreground first:pl-4">仓库</th>
              <th className="h-8 px-3 text-[11px] font-medium text-muted-foreground">描述</th>
              <th className="h-8 px-3 text-[11px] font-medium text-muted-foreground w-16">语言</th>
              <th className="h-8 w-24 px-3 text-[11px] font-medium text-muted-foreground text-center">监控</th>
              <th className="h-8 w-12 px-3 text-[11px] font-medium text-muted-foreground last:pr-4" />
            </tr></thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr><td colSpan={5} className="h-24 text-center text-xs text-muted-foreground">暂无仓库，点击"从 GitHub 刷新"</td></tr>
              ) : sorted.map((r) => (
                <tr key={r.githubRepo} className={`border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors ${!r.monitoringEnabled ? "opacity-50" : ""}`}>
                  <td className="h-10 px-3 text-xs font-mono font-medium first:pl-4">
                    <Link href={`https://github.com/${r.githubRepo}`} target="_blank" rel="noreferrer" className="hover:text-primary inline-flex items-center gap-1">
                      {r.githubRepo.split("/")[1]}<ExternalLink className="size-3 text-muted-foreground" />
                    </Link>
                  </td>
                  <td className="h-10 px-3 text-xs text-muted-foreground max-w-72 truncate">{r.description ?? "-"}</td>
                  <td className="h-10 px-3 text-[11px] text-muted-foreground">{r.language ?? "-"}</td>
                  <td className="h-10 px-3 text-center">
                    <div className="flex justify-center">
                      <Switch checked={r.monitoringEnabled} loading={toggling.has(r.githubRepo)} onCheckedChange={() => toggleMonitor(r.githubRepo, r.monitoringEnabled)} aria-label={`监控 ${r.githubRepo}`} size="default" />
                    </div>
                  </td>
                  <td className="h-10 px-3 last:pr-4">
                    <button type="button" onClick={() => setDeleteTarget({ githubRepo: r.githubRepo })} className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="size-3" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
      </div>

      <ConfirmDialog open={deleteTarget !== null} title="确认删除" description={`确定要删除「${deleteTarget?.githubRepo}」吗？历史快照数据会保留。`} confirmLabel="删除" variant="danger" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
