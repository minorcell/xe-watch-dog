"use client";

import { useCallback, useEffect, useState } from "react";
import { LoaderCircle, RefreshCw, Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Switch } from "@/components/ui/switch";
import type { Repo } from "@/lib/database";

export function MonitoringPanel() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ githubRepo: string } | null>(null);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/admin/repos");
    if (res.ok) setRepos(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function toggleMonitor(githubRepo: string, current: boolean) {
    // Optimistic update
    setRepos((prev) => prev.map((r) => r.githubRepo === githubRepo ? { ...r, monitoringEnabled: !current } : r));
    await fetch("/api/admin/repos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: current ? "unmonitor" : "monitor", githubRepo }),
    });
  }

  async function syncRepos() {
    setSyncing(true); setSyncMsg("");
    const res = await fetch("/api/admin/repos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "sync" }) });
    const data = await res.json();
    setSyncMsg(res.ok ? `新增 ${data.added}，更新 ${data.updated}` : (data.message ?? "同步失败"));
    if (res.ok) await fetchData();
    setSyncing(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await fetch("/api/admin/repos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "unmonitor", githubRepo: deleteTarget.githubRepo }) });
    setDeleteTarget(null);
    setRepos((prev) => prev.filter((r) => r.githubRepo !== deleteTarget.githubRepo));
  }

  if (loading) {
    return <div className="py-16 text-center"><LoaderCircle className="mx-auto size-5 animate-spin text-muted-foreground" /><p className="mt-3 text-xs text-muted-foreground">加载中…</p></div>;
  }

  const monitored = repos.filter((r) => r.monitoringEnabled);
  const unmonitored = repos.filter((r) => !r.monitoringEnabled);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground">
          从 GitHub 同步仓库列表，开启监控后纳入 Star 采集
          <span className="ml-2 text-emerald-600 dark:text-emerald-500 font-medium">{monitored.length} 个监控中</span>
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
              {repos.length === 0 ? (
                <tr><td colSpan={5} className="h-24 text-center text-xs text-muted-foreground">暂无仓库，点击"从 GitHub 刷新"</td></tr>
              ) : [...monitored, ...unmonitored].map((r) => (
                <tr key={r.githubRepo} className={`border-b border-border/50 last:border-0 ${!r.monitoringEnabled ? "opacity-50" : ""}`}>
                  <td className="h-10 px-3 text-xs font-mono font-medium first:pl-4">{r.githubRepo}</td>
                  <td className="h-10 px-3 text-xs text-muted-foreground max-w-72 truncate">{r.description ?? "-"}</td>
                  <td className="h-10 px-3 text-[11px] text-muted-foreground">{r.language ?? "-"}</td>
                  <td className="h-10 px-3 text-center">
                    <div className="flex justify-center">
                      <Switch checked={r.monitoringEnabled} onCheckedChange={() => toggleMonitor(r.githubRepo, r.monitoringEnabled)} aria-label={`监控 ${r.githubRepo}`} size="default" />
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
      </div>

      <ConfirmDialog open={deleteTarget !== null} title="确认删除" description={`确定要删除「${deleteTarget?.githubRepo}」吗？历史快照数据会保留。`} confirmLabel="删除" variant="danger" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
