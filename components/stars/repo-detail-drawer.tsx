"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, LoaderCircle, X } from "lucide-react";

import type { Repo } from "@/lib/database";

export function RepoDetailDrawer({
  repoFullName,
  open,
  onClose,
}: {
  repoFullName: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const [repo, setRepo] = useState<Repo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !repoFullName) return;
    setLoading(true);
    setError("");
    fetch(`/api/admin/repos?detail=${encodeURIComponent(repoFullName)}`)
      .then((res) => res.ok ? res.json() : Promise.reject(new Error("未找到")))
      .then(setRepo)
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
      <div className="relative z-10 flex h-full w-full max-w-[400px] flex-col border-l bg-card shadow-[0_0_48px_rgb(0_0_0/12%)]">
        <div className="flex h-12 shrink-0 items-center justify-between border-b px-5">
          <h2 className="text-sm font-semibold">仓库详情</h2>
          <button type="button" onClick={onClose} className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"><X className="size-3.5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="py-16 text-center"><LoaderCircle className="mx-auto size-5 animate-spin text-muted-foreground" /><p className="mt-2 text-xs text-muted-foreground">加载中…</p></div>
          ) : error ? (
            <div className="py-16 text-center"><p className="text-xs text-muted-foreground">{error}</p></div>
          ) : repo ? (
            <div className="grid gap-5">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">仓库</p>
                <Link href={`https://github.com/${repo.githubRepo}`} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium hover:text-primary">
                  {repo.githubRepo}<ExternalLink className="size-3 text-muted-foreground" />
                </Link>
                {repo.description && <p className="mt-1 text-xs text-muted-foreground">{repo.description}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {repo.language && <div><p className="text-[11px] text-muted-foreground">语言</p><p className="text-xs">{repo.language}</p></div>}
                <div><p className="text-[11px] text-muted-foreground">可见性</p><p className="text-xs">{repo.visibility}</p></div>
                <div><p className="text-[11px] text-muted-foreground">状态</p><p className="text-xs">{repo.archived ? "已归档" : "活跃"}</p></div>
                <div><p className="text-[11px] text-muted-foreground">监控</p><p className="text-xs">{repo.monitoringEnabled ? "是" : "否"}</p></div>
                {repo.homepageUrl && <div className="col-span-2"><p className="text-[11px] text-muted-foreground">Deploy URL</p><Link href={repo.homepageUrl} target="_blank" className="text-xs text-primary hover:underline">{repo.homepageUrl}</Link></div>}
              </div>

              {repo.topics && repo.topics.length > 0 && (
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Topics</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">{repo.topics.map((t) => <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[11px]">{t}</span>)}</div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
