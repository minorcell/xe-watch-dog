"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, ChevronDown, ChevronRight, LoaderCircle, Plus, RefreshCw, Trash2, Upload, X } from "lucide-react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Person, Repo, RepoDetail, SchedulerTask } from "@/lib/database";

/* ── Modal ──────────────────────────────────────────────────── */
function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button type="button" className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-label="关闭" />
      <div className="relative z-10 w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-lg border bg-card p-5 shadow-[0_16px_48px_rgb(0_0_0/15%)]">
        <h2 className="mb-4 text-sm font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  );
}

/* ── Main ───────────────────────────────────────────────────── */

type Tab = "settings" | "people";

export function AdminPanel() {
  const [tab, setTab] = useState<Tab>("settings");
  const [loading, setLoading] = useState(true);

  // Data
  const [repos, setRepos] = useState<Repo[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [tasks, setTasks] = useState<SchedulerTask[]>([]);

  // Action states
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const [expandedRepo, setExpandedRepo] = useState<string | null>(null);
  const [repoDetail, setRepoDetail] = useState<RepoDetail | null>(null);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; name: string } | null>(null);

  // People form
  const [personForm, setPersonForm] = useState<{ open: boolean; initial?: Person }>({ open: false });

  // Role edit
  const [roleEdit, setRoleEdit] = useState<{ open: boolean; githubRepo: string }>({ open: false, githubRepo: "" });
  const [roleMembers, setRoleMembers] = useState<{ githubId: string; role: string }[]>([]);
  const [newGithubId, setNewGithubId] = useState("");
  const [newRole, setNewRole] = useState("member");
  const [roleSaving, setRoleSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [rRes, pRes, tRes] = await Promise.all([
      fetch("/api/admin/repos"),
      fetch("/api/admin/people"),
      fetch("/api/admin/scheduler"),
    ]);
    if (rRes.ok) setRepos(await rRes.json());
    if (pRes.ok) setPeople(await pRes.json());
    if (tRes.ok) setTasks(await tRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Scheduler toggle
  async function toggleTask(name: string, enabled: boolean) {
    await fetch("/api/admin/scheduler", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, enabled: !enabled }) });
    await fetchData();
  }

  // Monitoring toggle
  async function toggleMonitor(githubRepo: string, current: boolean) {
    if (current) {
      await fetch("/api/admin/repos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "unmonitor", githubRepo }) });
    } else {
      await fetch("/api/admin/repos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "monitor", githubRepo }) });
    }
    await fetchData();
  }

  // Sync repos from GitHub
  async function syncRepos() {
    setSyncing(true);
    setSyncMsg("");
    const res = await fetch("/api/admin/repos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "sync" }) });
    const data = await res.json();
    setSyncMsg(res.ok ? `同步完成：新增 ${data.added}，更新 ${data.updated}` : (data.message ?? "同步失败"));
    if (res.ok) await fetchData();
    setSyncing(false);
  }

  // Import from YAML
  async function handleImport() {
    setImporting(true);
    setImportMsg("");
    const res = await fetch("/api/admin/import", { method: "POST" });
    const data = await res.json();
    setImportMsg(res.ok ? `导入完成：${data.repos} 个仓库，${data.people} 人` : (data.message ?? "导入失败"));
    if (res.ok) await fetchData();
    setImporting(false);
  }

  // Fetch repo detail for member editing
  async function loadRepoDetail(githubRepo: string) {
    const res = await fetch(`/api/admin/repos?detail=${encodeURIComponent(githubRepo)}`);
    if (res.ok) {
      const detail = await res.json() as RepoDetail;
      setRepoDetail(detail);
      setRoleMembers(detail.members.map((m) => ({ githubId: m.githubId, role: m.role })));
      setRoleEdit({ open: true, githubRepo });
    }
  }

  // Save role members
  async function saveRoleMembers() {
    setRoleSaving(true);
    await fetch("/api/admin/repo-members", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ githubRepo: roleEdit.githubRepo, members: roleMembers }),
    });
    setRoleSaving(false);
    setRoleEdit({ open: false, githubRepo: "" });
    await fetchData();
  }

  function addRoleMember() {
    if (!newGithubId.trim()) return;
    setRoleMembers((prev) => [...prev.filter((m) => m.githubId !== newGithubId.trim()), { githubId: newGithubId.trim(), role: newRole }]);
    setNewGithubId("");
  }

  function removeRoleMember(githubId: string) {
    setRoleMembers((prev) => prev.filter((m) => m.githubId !== githubId));
  }

  // People
  async function savePerson(githubId: string, realName: string) {
    await fetch("/api/admin/people", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ githubId, realName }) });
    setPersonForm({ open: false });
    await fetchData();
  }

  async function deletePerson(githubId: string) {
    await fetch(`/api/admin/people?githubId=${encodeURIComponent(githubId)}`, { method: "DELETE" });
    setDeleteTarget(null);
    await fetchData();
  }

  if (loading) {
    return <div className="mx-auto max-w-5xl py-16 text-center"><LoaderCircle className="mx-auto size-5 animate-spin text-muted-foreground" /><p className="mt-3 text-xs text-muted-foreground">加载中…</p></div>;
  }

  const monitoredRepos = repos.filter((r) => r.monitoringEnabled);
  const unmonitoredRepos = repos.filter((r) => !r.monitoringEnabled);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">系统设置</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">调度任务 · 监控仓库 · 人员库</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-muted p-1 w-fit">
        {[{ key: "settings" as Tab, label: "调度 & 仓库" }, { key: "people" as Tab, label: "人员库" }].map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)} className={`inline-flex h-7 items-center rounded-md px-3 text-xs font-medium transition-colors ${tab === t.key ? "bg-card text-foreground shadow-[0_1px_2px_rgb(0_0_0/4%)]" : "text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "settings" && (
        <>
          {/* ── Scheduler tasks ── */}
          <section className="mb-6 overflow-hidden rounded-lg border bg-card">
            <div className="border-b px-5 py-3"><h2 className="text-sm font-semibold">调度任务</h2></div>
            <div className="divide-y divide-border/50">
              {tasks.map((t) => (
                <div key={t.name} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-xs font-medium font-mono">{t.name}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{t.description}</p>
                  </div>
                  <button type="button" onClick={() => toggleTask(t.name, t.enabled)} className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-medium transition-colors ${t.enabled ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                    {t.enabled ? <Check className="size-3" /> : <X className="size-3" />}
                    {t.enabled ? "开启" : "关闭"}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* ── Repo list ── */}
          <section className="overflow-hidden rounded-lg border bg-card">
            <div className="flex items-center justify-between border-b px-5 py-3">
              <div>
                <h2 className="text-sm font-semibold">监控仓库</h2>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  <span className="text-emerald-600 dark:text-emerald-500 font-medium">{monitoredRepos.length} 个监控中</span>
                  <span className="mx-1">·</span>
                  <span className="text-muted-foreground">{unmonitoredRepos.length} 个未监控</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={handleImport} disabled={importing} className="inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-[11px] font-medium hover:bg-accent disabled:opacity-40">
                  {importing ? <LoaderCircle className="size-3 animate-spin" /> : <Upload className="size-3" />}YAML 导入
                </button>
                <button type="button" onClick={syncRepos} disabled={syncing} className="inline-flex h-7 items-center gap-1.5 rounded-md bg-foreground px-2.5 text-[11px] font-medium text-background hover:bg-foreground/90 disabled:opacity-40">
                  {syncing ? <LoaderCircle className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}从 GitHub 刷新
                </button>
              </div>
            </div>

            {(syncMsg || importMsg) && <div className="border-b px-5 py-2 text-[11px] text-emerald-600 dark:text-emerald-500 bg-emerald-500/5">{syncMsg || importMsg}</div>}

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead><tr className="border-b bg-muted/30">
                  <th className="h-8 w-8 px-3 text-[11px] font-medium text-muted-foreground first:pl-4" />
                  <th className="h-8 px-3 text-[11px] font-medium text-muted-foreground">仓库</th>
                  <th className="h-8 px-3 text-[11px] font-medium text-muted-foreground">描述</th>
                  <th className="h-8 px-3 text-[11px] font-medium text-muted-foreground">语言</th>
                  <th className="h-8 w-24 px-3 text-[11px] font-medium text-muted-foreground text-center">监控</th>
                  <th className="h-8 w-24 px-3 text-[11px] font-medium text-muted-foreground last:pr-4">操作</th>
                </tr></thead>
                <tbody>
                  {repos.length === 0 ? (
                    <tr><td colSpan={6} className="h-24 text-center text-xs text-muted-foreground">暂无仓库，点击「从 GitHub 刷新」同步</td></tr>
                  ) : [...monitoredRepos, ...unmonitoredRepos].map((r) => {
                    const isExpanded = expandedRepo === r.githubRepo;
                    return (<>
                      <tr key={r.githubRepo} className={`border-b border-border/50 ${isExpanded ? "bg-muted/10" : ""} ${!r.monitoringEnabled ? "opacity-50" : ""}`}>
                        <td className="h-10 px-3 first:pl-4">
                          <button type="button" onClick={() => { if (isExpanded) setExpandedRepo(null); else { setExpandedRepo(r.githubRepo); loadRepoDetail(r.githubRepo); } }} className="grid size-6 place-items-center rounded hover:bg-accent">{isExpanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}</button>
                        </td>
                        <td className="h-10 px-3 text-xs font-mono font-medium">{r.githubRepo.split("/")[1]}</td>
                        <td className="h-10 px-3 text-xs text-muted-foreground max-w-56 truncate">{r.description ?? "-"}</td>
                        <td className="h-10 px-3 text-[11px] text-muted-foreground">{r.language ?? "-"}</td>
                        <td className="h-10 px-3 text-center">
                          <button type="button" onClick={() => toggleMonitor(r.githubRepo, r.monitoringEnabled)} className={`inline-flex h-6 items-center gap-1 rounded px-2 text-[11px] font-medium transition-colors ${r.monitoringEnabled ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
                            {r.monitoringEnabled ? "监控中" : "未监控"}
                          </button>
                        </td>
                        <td className="h-10 px-3 last:pr-4">
                          <button type="button" onClick={() => { setDeleteTarget({ type: "repo", id: r.githubRepo, name: r.githubRepo }); }} className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="size-3" /></button>
                        </td>
                      </tr>
                      {isExpanded && repoDetail && repoDetail.githubRepo === r.githubRepo && (
                        <tr key={`${r.githubRepo}-detail`} className="border-b border-border/50 bg-muted/5">
                          <td colSpan={6} className="px-8 py-3">
                            <div className="grid gap-2 text-xs">
                              <p className="font-medium">成员</p>
                              {repoDetail.members.length === 0 && <p className="text-muted-foreground">暂无成员</p>}
                              {repoDetail.members.map((m) => (
                                <div key={m.githubId} className="flex items-center gap-3">
                                  <span className="text-[11px] font-medium uppercase w-12 text-muted-foreground">{roleLabel(m.role)}</span>
                                  <span className="font-medium">{m.realName ?? m.githubId}</span>
                                  <span className="text-muted-foreground font-mono">@{m.githubId}</span>
                                </div>
                              ))}
                              <button type="button" onClick={() => loadRepoDetail(r.githubRepo)} className="mt-1 text-[11px] text-primary hover:underline self-start">编辑成员</button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>);
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* ── People tab ── */}
      {tab === "people" && (
        <section className="overflow-hidden rounded-lg border bg-card">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <h2 className="text-sm font-semibold">人员库</h2>
            <button type="button" onClick={() => setPersonForm({ open: true })} className="inline-flex h-7 items-center gap-1 rounded-md border px-2.5 text-[11px] font-medium hover:bg-accent"><Plus className="size-3" />新增</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead><tr className="border-b bg-muted/30">
                <th className="h-8 px-3 text-[11px] font-medium text-muted-foreground first:pl-4">GitHub ID</th>
                <th className="h-8 px-3 text-[11px] font-medium text-muted-foreground">姓名</th>
                <th className="h-8 w-24 px-3 text-[11px] font-medium text-muted-foreground last:pr-4">操作</th>
              </tr></thead>
              <tbody>
                {people.length === 0 ? (
                  <tr><td colSpan={3} className="h-24 text-center text-xs text-muted-foreground">暂无人员</td></tr>
                ) : people.map((p) => (
                  <tr key={p.githubId} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                    <td className="h-9 px-3 text-xs font-mono first:pl-4">{p.githubId}</td>
                    <td className="h-9 px-3 text-xs">{p.realName ?? <span className="text-muted-foreground/50">未填写</span>}</td>
                    <td className="h-9 px-3 last:pr-4">
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => setPersonForm({ open: true, initial: p })} className="h-6 rounded px-1.5 text-[11px] hover:bg-accent">编辑</button>
                        <button type="button" onClick={() => setDeleteTarget({ type: "person", id: p.githubId, name: p.realName ?? p.githubId })} className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="size-3" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Modals */}
      <Modal open={personForm.open} title={`${personForm.initial ? "编辑" : "新增"}人员`} onClose={() => setPersonForm({ open: false })}>
        <PersonFormContent initial={personForm.initial} onSave={savePerson} onCancel={() => setPersonForm({ open: false })} />
      </Modal>

      <Modal open={roleEdit.open} title="编辑成员" onClose={() => setRoleEdit({ open: false, githubRepo: "" })}>
        <div className="grid gap-3">
          {roleMembers.map((m) => (
            <div key={m.githubId} className="flex items-center gap-2">
              <span className="text-xs font-mono flex-1">{m.githubId}</span>
              <select value={m.role} onChange={(e) => setRoleMembers((prev) => prev.map((x) => x.githubId === m.githubId ? { ...x, role: e.target.value } : x))} className="h-7 rounded-md border bg-transparent px-2 text-[11px] outline-none">
                {["mentor","assistant","lead","member"].map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
              </select>
              <button type="button" onClick={() => removeRoleMember(m.githubId)} className="grid size-6 place-items-center rounded text-muted-foreground hover:text-destructive"><X className="size-3" /></button>
            </div>
          ))}
          <div className="flex items-center gap-2 border-t pt-3">
            <input value={newGithubId} onChange={(e) => setNewGithubId(e.target.value)} placeholder="GitHub ID" className="h-7 flex-1 rounded-md border bg-transparent px-2 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring" />
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="h-7 rounded-md border bg-transparent px-2 text-[11px] outline-none">
              {["mentor","assistant","lead","member"].map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
            </select>
            <button type="button" onClick={addRoleMember} className="h-7 rounded-md bg-foreground px-2.5 text-[11px] font-medium text-background hover:bg-foreground/90">添加</button>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setRoleEdit({ open: false, githubRepo: "" })} className="h-8 rounded-md border px-3 text-xs font-medium hover:bg-accent">取消</button>
            <button type="button" onClick={saveRoleMembers} disabled={roleSaving} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-foreground px-3 text-xs font-medium text-background hover:bg-foreground/90 disabled:opacity-40">{roleSaving && <LoaderCircle className="size-3 animate-spin" />}保存</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={deleteTarget !== null} title="确认删除" description={`确定要删除「${deleteTarget?.name}」吗？`} confirmLabel="删除" variant="danger" onConfirm={async () => {
        if (!deleteTarget) return;
        if (deleteTarget.type === "person") await deletePerson(deleteTarget.id);
        if (deleteTarget.type === "repo") {
          await fetch("/api/admin/repos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "unmonitor", githubRepo: deleteTarget.id }) });
          await fetchData();
        }
        setDeleteTarget(null);
      }} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}

function roleLabel(role: string) {
  const m: Record<string, string> = { mentor: "导师", assistant: "助教", lead: "组长", member: "组员" };
  return m[role] ?? role;
}

function PersonFormContent({ initial, onSave, onCancel }: { initial?: Person; onSave: (githubId: string, realName: string) => void; onCancel: () => void }) {
  const [githubId, setGithubId] = useState(initial?.githubId ?? "");
  const [realName, setRealName] = useState(initial?.realName ?? "");
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (githubId.trim()) onSave(githubId.trim(), realName.trim()); }} className="grid gap-3">
      <label className="grid gap-1 text-[11px] font-medium">GitHub ID *<input value={githubId} onChange={(e) => setGithubId(e.target.value)} className="h-8 rounded-md border bg-transparent px-2.5 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring" required autoFocus disabled={!!initial} /></label>
      <label className="grid gap-1 text-[11px] font-medium">真实姓名<input value={realName} onChange={(e) => setRealName(e.target.value)} className="h-8 rounded-md border bg-transparent px-2.5 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring" /></label>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="h-8 rounded-md border px-3 text-xs font-medium hover:bg-accent">取消</button>
        <button type="submit" className="inline-flex h-8 items-center rounded-md bg-foreground px-3 text-xs font-medium text-background hover:bg-foreground/90">保存</button>
      </div>
    </form>
  );
}
