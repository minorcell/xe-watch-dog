"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, LoaderCircle, X } from "lucide-react";

import type { RepoDetail } from "@/lib/database";

const ROLE_LABELS: Record<string, string> = {
  mentor: "导师",
  assistant: "助教",
  lead: "组长",
  member: "组员",
};

export function RepoDetailDrawer({
  repoFullName,
  open,
  onClose,
}: {
  repoFullName: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<RepoDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !repoFullName) return;
    setLoading(true);
    setError("");
    fetch(`/api/admin/repos?detail=${encodeURIComponent(repoFullName)}`)
      .then((res) => {
        if (!res.ok) throw new Error("未找到仓库信息");
        return res.json();
      })
      .then((data) => setDetail(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [open, repoFullName]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} aria-label="关闭详情" />
      <div className="relative z-10 flex h-full w-full max-w-[420px] flex-col border-l bg-card shadow-[0_0_48px_rgb(0_0_0/12%)]">
        <div className="flex h-12 shrink-0 items-center justify-between border-b px-5">
          <h2 className="text-sm font-semibold">仓库详情</h2>
          <button type="button" onClick={onClose} className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"><X className="size-3.5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="py-16 text-center"><LoaderCircle className="mx-auto size-5 animate-spin text-muted-foreground" /><p className="mt-2 text-xs text-muted-foreground">加载中…</p></div>
          ) : error ? (
            <div className="py-16 text-center"><p className="text-xs text-muted-foreground">{error}</p></div>
          ) : detail ? (
            <div className="grid gap-5">
              {/* Repo */}
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">仓库</p>
                <Link href={`https://github.com/${detail.githubRepo}`} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium hover:text-primary">
                  {detail.githubRepo}
                  <ExternalLink className="size-3 text-muted-foreground" />
                </Link>
                {detail.description && <p className="mt-1 text-xs text-muted-foreground">{detail.description}</p>}
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-3">
                {detail.language && <div><p className="text-[11px] text-muted-foreground">语言</p><p className="text-xs">{detail.language}</p></div>}
                <div><p className="text-[11px] text-muted-foreground">可见性</p><p className="text-xs">{detail.visibility}</p></div>
                {detail.homepageUrl && <div className="col-span-2"><p className="text-[11px] text-muted-foreground">Deploy URL</p><Link href={detail.homepageUrl} target="_blank" className="text-xs text-primary hover:underline">{detail.homepageUrl}</Link></div>}
              </div>

              {/* Topics */}
              {detail.topics && detail.topics.length > 0 && (
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Topics</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">{detail.topics.map((t) => <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[11px]">{t}</span>)}</div>
                </div>
              )}

              {/* Members */}
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">成员 ({detail.members.length} 人)</p>
                <ul className="mt-1.5 grid gap-0.5">
                  {detail.members.map((m) => (
                    <li key={`${m.githubId}-${m.role}`} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted/30">
                      <span className={`text-[10px] font-medium uppercase tracking-wider w-10 shrink-0 ${m.role === "mentor" ? "text-primary" : "text-muted-foreground"}`}>{ROLE_LABELS[m.role] ?? m.role}</span>
                      <span className="font-medium">{m.realName}</span>
                      <Link href={`https://github.com/${m.githubId}`} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary font-mono">@{m.githubId}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
