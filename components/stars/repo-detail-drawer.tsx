"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, LoaderCircle, UserRound, X } from "lucide-react";

import type { OrgGroup } from "@/lib/database";

export function RepoDetailDrawer({
  repoFullName,
  open,
  onClose,
}: {
  repoFullName: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const [group, setGroup] = useState<OrgGroup | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !repoFullName) return;
    setLoading(true);
    setError("");
    fetch(`/api/admin/groups/detail?repo=${encodeURIComponent(repoFullName)}`)
      .then((res) => {
        if (!res.ok) throw new Error("未找到组织信息");
        return res.json();
      })
      .then((data) => setGroup(data))
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
      {/* Backdrop */}
      <button type="button" className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} aria-label="关闭详情" />

      {/* Drawer */}
      <div className="relative z-10 flex h-full w-full max-w-[420px] flex-col border-l bg-card shadow-[0_0_48px_rgb(0_0_0/12%)]">
        {/* Header */}
        <div className="flex h-12 shrink-0 items-center justify-between border-b px-5">
          <h2 className="text-sm font-semibold">仓库详情</h2>
          <button type="button" onClick={onClose} className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">
            <X className="size-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="py-16 text-center">
              <LoaderCircle className="mx-auto size-5 animate-spin text-muted-foreground" />
              <p className="mt-2 text-xs text-muted-foreground">加载中…</p>
            </div>
          ) : error ? (
            <div className="py-16 text-center">
              <p className="text-xs text-muted-foreground">{error}</p>
              <p className="mt-1 text-[11px] text-muted-foreground/60">该仓库可能尚未在组织管理中配置</p>
            </div>
          ) : group ? (
            <div className="grid gap-5">
              {/* Repo info */}
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">仓库</p>
                <Link href={`https://github.com/${repoFullName}`} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium hover:text-primary">
                  {repoFullName}
                  <ExternalLink className="size-3 text-muted-foreground" />
                </Link>
              </div>

              {/* Project */}
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">项目</p>
                <p className="mt-1 text-sm font-medium">{group.projectName}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{group.projectTopic}</p>
              </div>

              {/* GitHub Team */}
              {group.githubTeam && (
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">GitHub Team</p>
                  <p className="mt-1 text-xs font-mono text-muted-foreground">{group.githubTeam}</p>
                </div>
              )}

              {/* Mentor */}
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">导师</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <UserRound className="size-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium">{group.mentorName}</span>
                  {group.mentorGithubId && (
                    <Link href={`https://github.com/${group.mentorGithubId}`} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-primary font-mono">
                      @{group.mentorGithubId}
                    </Link>
                  )}
                </div>
              </div>

              {/* Assistant */}
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">助教</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <UserRound className="size-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium">{group.assistantName}</span>
                  {group.assistantGithubId && (
                    <Link href={`https://github.com/${group.assistantGithubId}`} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-primary font-mono">
                      @{group.assistantGithubId}
                    </Link>
                  )}
                </div>
              </div>

              {/* Members */}
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                  组员 ({group.memberNames.length} 人)
                </p>
                <ul className="mt-1.5 grid gap-1">
                  {group.memberNames.map((name, idx) => {
                    const memberId = group.memberIds[idx];
                    // Find member github ID from the names/IDs (we don't have them separately in OrgGroup)
                    return (
                      <li key={idx} className="flex items-center gap-2 rounded-md px-2 py-1 text-xs hover:bg-muted/30">
                        <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                        <span>{name}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
