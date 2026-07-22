"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  LoaderCircle,
  Plus,
  Trash2,
  Upload,
  UserRound,
  Users,
} from "lucide-react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { OrgGroup, OrgPerson, OrgProject } from "@/lib/database";

type Tab = "projects" | "people" | "groups";

/* ── Inline form modal ───────────────────────────────────────── */

function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
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

/* ── Project form ────────────────────────────────────────────── */

function ProjectForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: OrgProject;
  onSave: (name: string, topic: string) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [topic, setTopic] = useState(initial?.topic ?? "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) onSave(name.trim(), topic.trim());
      }}
      className="grid gap-3"
    >
      <label className="grid gap-1 text-[11px] font-medium">
        项目名称 *
        <input value={name} onChange={(e) => setName(e.target.value)} className="h-8 rounded-md border bg-transparent px-2.5 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring" required autoFocus />
      </label>
      <label className="grid gap-1 text-[11px] font-medium">
        主题描述
        <input value={topic} onChange={(e) => setTopic(e.target.value)} className="h-8 rounded-md border bg-transparent px-2.5 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring" />
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="h-8 rounded-md border px-3 text-xs font-medium hover:bg-accent">取消</button>
        <button type="submit" disabled={saving || !name.trim()} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-foreground px-3 text-xs font-medium text-background hover:bg-foreground/90 disabled:opacity-40">
          {saving && <LoaderCircle className="size-3 animate-spin" />}
          {initial ? "保存" : "创建"}
        </button>
      </div>
    </form>
  );
}

/* ── Person form ─────────────────────────────────────────────── */

function PersonForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: OrgPerson;
  onSave: (name: string, githubId: string) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [githubId, setGithubId] = useState(initial?.githubId ?? "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) onSave(name.trim(), githubId.trim());
      }}
      className="grid gap-3"
    >
      <label className="grid gap-1 text-[11px] font-medium">
        姓名 *
        <input value={name} onChange={(e) => setName(e.target.value)} className="h-8 rounded-md border bg-transparent px-2.5 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring" required autoFocus />
      </label>
      <label className="grid gap-1 text-[11px] font-medium">
        GitHub ID
        <input value={githubId} onChange={(e) => setGithubId(e.target.value)} className="h-8 rounded-md border bg-transparent px-2.5 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="例如 minorcell" />
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="h-8 rounded-md border px-3 text-xs font-medium hover:bg-accent">取消</button>
        <button type="submit" disabled={saving || !name.trim()} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-foreground px-3 text-xs font-medium text-background hover:bg-foreground/90 disabled:opacity-40">
          {saving && <LoaderCircle className="size-3 animate-spin" />}
          {initial ? "保存" : "创建"}
        </button>
      </div>
    </form>
  );
}

/* ── Group form ──────────────────────────────────────────────── */

function GroupForm({
  initial,
  projects,
  people,
  onSave,
  onCancel,
  saving,
}: {
  initial?: OrgGroup;
  projects: OrgProject[];
  people: OrgPerson[];
  onSave: (data: { projectId: number; mentorId: number; assistantId: number; githubRepo: string; githubTeam: string; memberIds: number[] }) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [projectId, setProjectId] = useState(String(initial?.projectId ?? projects[0]?.id ?? ""));
  const [mentorId, setMentorId] = useState(String(initial?.mentorId ?? ""));
  const [assistantId, setAssistantId] = useState(String(initial?.assistantId ?? ""));
  const [githubRepo, setGithubRepo] = useState(initial?.githubRepo ?? "");
  const [githubTeam, setGithubTeam] = useState(initial?.githubTeam ?? "");
  const [memberIds, setMemberIds] = useState<Set<number>>(new Set(initial?.memberIds ?? []));

  function toggleMember(id: number) {
    setMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (projectId && mentorId && assistantId && githubRepo.trim()) {
          onSave({
            projectId: Number(projectId),
            mentorId: Number(mentorId),
            assistantId: Number(assistantId),
            githubRepo: githubRepo.trim(),
            githubTeam: githubTeam.trim(),
            memberIds: [...memberIds],
          });
        }
      }}
      className="grid gap-3"
    >
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1 text-[11px] font-medium">
          项目 *
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring" required>
            <option value="">选择项目</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.topic}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-[11px] font-medium">
          GitHub Team
          <input value={githubTeam} onChange={(e) => setGithubTeam(e.target.value)} className="h-8 rounded-md border bg-transparent px-2.5 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring" />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1 text-[11px] font-medium">
          导师 *
          <select value={mentorId} onChange={(e) => setMentorId(e.target.value)} className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring" required>
            <option value="">选择导师</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.name} {p.githubId ? `(${p.githubId})` : ""}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-[11px] font-medium">
          助教 *
          <select value={assistantId} onChange={(e) => setAssistantId(e.target.value)} className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring" required>
            <option value="">选择助教</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.name} {p.githubId ? `(${p.githubId})` : ""}</option>)}
          </select>
        </label>
      </div>
      <label className="grid gap-1 text-[11px] font-medium">
        GitHub 仓库 URL *
        <input value={githubRepo} onChange={(e) => setGithubRepo(e.target.value)} className="h-8 rounded-md border bg-transparent px-2.5 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="https://github.com/1024XEngineer/..." required />
      </label>
      <fieldset className="grid gap-1">
        <legend className="text-[11px] font-medium">组员</legend>
        <div className="max-h-32 overflow-y-auto rounded-md border p-2 grid gap-0.5">
          {people.map((p) => (
            <label key={p.id} className="flex items-center gap-2 rounded px-2 py-1 text-xs hover:bg-accent cursor-pointer">
              <input type="checkbox" checked={memberIds.has(p.id)} onChange={() => toggleMember(p.id)} className="size-3.5" />
              {p.name} {p.githubId ? <span className="text-muted-foreground">({p.githubId})</span> : null}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="h-8 rounded-md border px-3 text-xs font-medium hover:bg-accent">取消</button>
        <button type="submit" disabled={saving} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-foreground px-3 text-xs font-medium text-background hover:bg-foreground/90 disabled:opacity-40">
          {saving && <LoaderCircle className="size-3 animate-spin" />}
          {initial ? "保存" : "创建"}
        </button>
      </div>
    </form>
  );
}

/* ── Main admin panel ────────────────────────────────────────── */

const TABS: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "projects", label: "项目", icon: Building2 },
  { key: "people", label: "人员", icon: UserRound },
  { key: "groups", label: "小组", icon: Users },
];

export function AdminPanel() {
  const [tab, setTab] = useState<Tab>("groups");
  const [projects, setProjects] = useState<OrgProject[]>([]);
  const [people, setPeople] = useState<OrgPerson[]>([]);
  const [groups, setGroups] = useState<OrgGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<OrgProject | OrgPerson | OrgGroup | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<{ type: Tab; id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Import state
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [pRes, ppRes, gRes] = await Promise.all([
      fetch("/api/admin/projects"),
      fetch("/api/admin/people"),
      fetch("/api/admin/groups"),
    ]);
    if (pRes.ok) setProjects(await pRes.json());
    if (ppRes.ok) setPeople(await ppRes.json());
    if (gRes.ok) setGroups(await gRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openNew() { setEditing(null); setFormOpen(true); }
  function closeForm() { setFormOpen(false); setEditing(null); }

  async function handleSave(...args: unknown[]) {
    setSaving(true);
    let url = `/api/admin/${tab}`;
    let method = "POST";
    let body: Record<string, unknown> = {};

    if (tab === "projects") {
      const [name, topic] = args as [string, string];
      body = { name, topic };
      if (editing) { url += `/${(editing as OrgProject).id}`; method = "PUT"; }
    } else if (tab === "people") {
      const [name, githubId] = args as [string, string];
      body = { name, githubId };
      if (editing) { url += `/${(editing as OrgPerson).id}`; method = "PUT"; }
    } else if (tab === "groups") {
      const [data] = args as [{ projectId: number; mentorId: number; assistantId: number; githubRepo: string; githubTeam: string; memberIds: number[] }];
      body = data;
      if (editing) { url += `/${(editing as OrgGroup).id}`; method = "PUT"; }
    }

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) {
      closeForm();
      await fetchData();
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const url = `/api/admin/${deleteTarget.type}/${deleteTarget.id}`;
    const res = await fetch(url, { method: "DELETE" });
    if (res.ok) {
      setDeleteTarget(null);
      await fetchData();
    }
    setDeleting(false);
  }

  async function handleImport() {
    setImporting(true);
    setImportMsg("");
    const res = await fetch("/api/admin/import", { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setImportMsg(`导入完成：${data.projects} 个项目，${data.people} 人，${data.groups} 个小组`);
      await fetchData();
    } else {
      setImportMsg(data.message ?? "导入失败");
    }
    setImporting(false);
  }

  const TabIcon = TABS.find((t) => t.key === tab)?.icon ?? Building2;

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl py-16 text-center">
        <LoaderCircle className="mx-auto size-5 animate-spin text-muted-foreground" />
        <p className="mt-3 text-xs text-muted-foreground">加载组织数据…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">组织管理</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">管理项目、人员与小组结构</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleImport}
            disabled={importing}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium hover:bg-accent disabled:opacity-40"
          >
            {importing ? <LoaderCircle className="size-3 animate-spin" /> : <Upload className="size-3" />}
            从 YAML 导入
          </button>
          <button
            type="button"
            onClick={openNew}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-foreground px-3 text-xs font-medium text-background hover:bg-foreground/90"
          >
            <Plus className="size-3" />
            新增
          </button>
        </div>
      </div>

      {importMsg && (
        <div className="mb-4 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-500">
          {importMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg bg-muted p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`inline-flex h-7 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors ${
              tab === t.key ? "bg-card text-foreground shadow-[0_1px_2px_rgb(0_0_0/4%)]" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="size-3" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="overflow-x-auto">
          {tab === "projects" && (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="h-8 w-16 px-3 text-[11px] font-medium text-muted-foreground first:pl-4">ID</th>
                  <th className="h-8 px-3 text-[11px] font-medium text-muted-foreground">名称</th>
                  <th className="h-8 px-3 text-[11px] font-medium text-muted-foreground">主题</th>
                  <th className="h-8 w-24 px-3 text-[11px] font-medium text-muted-foreground last:pr-4">操作</th>
                </tr>
              </thead>
              <tbody>
                {projects.length === 0 ? (
                  <tr><td colSpan={4} className="h-24 text-center text-xs text-muted-foreground">暂无项目，点击"从 YAML 导入"或"新增"</td></tr>
                ) : projects.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="h-10 px-3 text-xs text-muted-foreground font-mono first:pl-4">{p.id}</td>
                    <td className="h-10 px-3 text-xs font-medium">{p.name}</td>
                    <td className="h-10 px-3 text-xs text-muted-foreground max-w-80 truncate">{p.topic}</td>
                    <td className="h-10 px-3 last:pr-4">
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => { setEditing(p); setFormOpen(true); }} className="h-7 rounded px-2 text-[11px] hover:bg-accent">编辑</button>
                        <button type="button" onClick={() => setDeleteTarget({ type: "projects", id: p.id, name: p.name })} className="grid size-7 place-items-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="size-3" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === "people" && (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="h-8 w-16 px-3 text-[11px] font-medium text-muted-foreground first:pl-4">ID</th>
                  <th className="h-8 px-3 text-[11px] font-medium text-muted-foreground">姓名</th>
                  <th className="h-8 px-3 text-[11px] font-medium text-muted-foreground">GitHub ID</th>
                  <th className="h-8 w-24 px-3 text-[11px] font-medium text-muted-foreground last:pr-4">操作</th>
                </tr>
              </thead>
              <tbody>
                {people.length === 0 ? (
                  <tr><td colSpan={4} className="h-24 text-center text-xs text-muted-foreground">暂无人员</td></tr>
                ) : people.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="h-10 px-3 text-xs text-muted-foreground font-mono first:pl-4">{p.id}</td>
                    <td className="h-10 px-3 text-xs font-medium">{p.name}</td>
                    <td className="h-10 px-3 text-xs text-muted-foreground font-mono">{p.githubId || "-"}</td>
                    <td className="h-10 px-3 last:pr-4">
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => { setEditing(p); setFormOpen(true); }} className="h-7 rounded px-2 text-[11px] hover:bg-accent">编辑</button>
                        <button type="button" onClick={() => setDeleteTarget({ type: "people", id: p.id, name: p.name })} className="grid size-7 place-items-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="size-3" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === "groups" && (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="h-8 w-12 px-3 text-[11px] font-medium text-muted-foreground first:pl-4">ID</th>
                  <th className="h-8 px-3 text-[11px] font-medium text-muted-foreground">项目</th>
                  <th className="h-8 px-3 text-[11px] font-medium text-muted-foreground">导师</th>
                  <th className="h-8 px-3 text-[11px] font-medium text-muted-foreground">助教</th>
                  <th className="h-8 px-3 text-[11px] font-medium text-muted-foreground">仓库</th>
                  <th className="h-8 px-3 text-[11px] font-medium text-muted-foreground">组员</th>
                  <th className="h-8 w-24 px-3 text-[11px] font-medium text-muted-foreground last:pr-4">操作</th>
                </tr>
              </thead>
              <tbody>
                {groups.length === 0 ? (
                  <tr><td colSpan={7} className="h-24 text-center text-xs text-muted-foreground">暂无小组，点击"从 YAML 导入"或"新增"</td></tr>
                ) : groups.map((g) => (
                  <tr key={g.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="h-10 px-3 text-xs text-muted-foreground font-mono first:pl-4">{g.id}</td>
                    <td className="h-10 px-3 text-xs">{g.projectName}</td>
                    <td className="h-10 px-3 text-xs">{g.mentorName}</td>
                    <td className="h-10 px-3 text-xs">{g.assistantName}</td>
                    <td className="h-10 px-3 text-xs text-muted-foreground font-mono max-w-48 truncate">{g.githubRepo.split("/").slice(-2).join("/")}</td>
                    <td className="h-10 px-3 text-xs text-muted-foreground">{g.memberNames.length} 人</td>
                    <td className="h-10 px-3 last:pr-4">
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => { setEditing(g); setFormOpen(true); }} className="h-7 rounded px-2 text-[11px] hover:bg-accent">编辑</button>
                        <button type="button" onClick={() => setDeleteTarget({ type: "groups", id: g.id, name: `${g.projectName} / ${g.githubRepo.split("/").pop()}` })} className="grid size-7 place-items-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="size-3" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Form modal */}
      <Modal open={formOpen} title={`${editing ? "编辑" : "新增"}${TABS.find((t) => t.key === tab)?.label ?? ""}`} onClose={closeForm}>
        {tab === "projects" && <ProjectForm initial={editing as OrgProject | undefined} onSave={handleSave as (name: string, topic: string) => void} onCancel={closeForm} saving={saving} />}
        {tab === "people" && <PersonForm initial={editing as OrgPerson | undefined} onSave={handleSave as (name: string, githubId: string) => void} onCancel={closeForm} saving={saving} />}
        {tab === "groups" && <GroupForm initial={editing as OrgGroup | undefined} projects={projects} people={people} onSave={handleSave as (data: { projectId: number; mentorId: number; assistantId: number; githubRepo: string; githubTeam: string; memberIds: number[] }) => void} onCancel={closeForm} saving={saving} />}
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="确认删除"
        description={`确定要删除「${deleteTarget?.name}」吗？此操作不可撤销。${deleteTarget?.type === "projects" ? "删除项目会同时删除其下所有小组。" : deleteTarget?.type === "people" ? "若此人是导师/助教，可能影响关联的小组。" : "删除小组会同时移除所有组员关联。"}`}
        confirmLabel={deleting ? "删除中…" : "删除"}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
