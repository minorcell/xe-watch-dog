"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, LoaderCircle, TrendingUp, X } from "lucide-react";

import type { Repository } from "@/lib/database";

type ChartPoint = Record<string, string | number | null>;

function Sparkline({ data, repository }: { data: ChartPoint[]; repository: string }) {
  const points = useMemo(() => data
    .map((point) => typeof point[repository] === "number" ? point[repository] as number : null)
    .filter((value): value is number => value !== null), [data, repository]);

  if (points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const width = 280;
  const height = 48;
  const padding = 2;
  const path = points.map((value, index) => {
    const x = padding + (index / (points.length - 1)) * (width - padding * 2);
    const y = padding + (1 - (value - min) / range) * (height - padding * 2);
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const gradientId = `spark-${repository.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <div className="mt-3 rounded-lg border bg-muted/20 p-3">
      <div className="mb-2 flex items-center gap-1.5">
        <TrendingUp className="size-3 text-muted-foreground" />
        <span className="text-[11px] font-medium">Star 趋势</span>
        <span className="ml-auto text-[10px] text-muted-foreground">{points[0]} → {points.at(-1)}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-12 w-full">
        <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" /><stop offset="100%" stopColor="var(--primary)" stopOpacity="0" /></linearGradient></defs>
        <path d={`${path} L${width - padding},${height - padding} L${padding},${height - padding} Z`} fill={`url(#${gradientId})`} />
        <path d={path} fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

type RepositoryResult = {
  id: number | null;
  repository: Repository | null;
  error: string;
};

export function RepoDetailModal({
  repositoryId,
  repositoryFullName,
  chartData,
  open,
  onClose,
}: {
  repositoryId: number | null;
  repositoryFullName?: string;
  chartData?: ChartPoint[];
  open: boolean;
  onClose: () => void;
}) {
  const [result, setResult] = useState<RepositoryResult>({ id: null, repository: null, error: "" });

  useEffect(() => {
    if (!open || repositoryId === null) return;
    let active = true;
    void fetch(`/api/admin/repositories/${repositoryId}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("未找到")))
      .then((repository) => { if (active) setResult({ id: repositoryId, repository, error: "" }); })
      .catch((error) => { if (active) setResult({ id: repositoryId, repository: null, error: error.message }); });
    return () => { active = false; };
  }, [open, repositoryId]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;
  const loading = result.id !== repositoryId;
  const repository = result.id === repositoryId ? result.repository : null;
  const error = result.id === repositoryId ? result.error : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="仓库详情">
      <button type="button" className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-label="关闭" />
      <div className="relative z-10 w-full max-w-md rounded-lg border bg-card p-5 shadow-[0_16px_48px_rgb(0_0_0/15%)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">仓库详情</h2>
          <button type="button" onClick={onClose} className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"><X className="size-3.5" /></button>
        </div>

        {loading ? (
          <div className="py-12 text-center"><LoaderCircle className="mx-auto size-5 animate-spin text-muted-foreground" /><p className="mt-2 text-xs text-muted-foreground">加载中…</p></div>
        ) : error ? (
          <div className="py-12 text-center"><p className="text-xs text-muted-foreground">{error}</p></div>
        ) : repository ? (
          <div className="grid gap-4">
            <div>
              <Link href={repository.htmlUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium hover:text-primary">
                {repository.fullName}<ExternalLink className="size-3 text-muted-foreground" />
              </Link>
              {repository.description && <p className="mt-1 text-xs text-muted-foreground">{repository.description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {repository.language && <div><p className="text-[11px] text-muted-foreground">语言</p><p className="text-xs">{repository.language}</p></div>}
              <div><p className="text-[11px] text-muted-foreground">可见性</p><p className="text-xs">{repository.visibility}</p></div>
              <div><p className="text-[11px] text-muted-foreground">状态</p><p className="text-xs">{repository.unavailableAt ? "当前不可见" : repository.archived ? "已归档" : "活跃"}</p></div>
              {repository.homepageUrl && <div className="col-span-2"><p className="text-[11px] text-muted-foreground">Deploy URL</p><Link href={repository.homepageUrl} target="_blank" className="text-xs text-primary hover:underline">{repository.homepageUrl}</Link></div>}
            </div>

            {repository.topics.length > 0 && (
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Topics</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">{repository.topics.map((topic) => <span key={topic} className="rounded-full bg-muted px-2 py-0.5 text-[11px]">{topic}</span>)}</div>
              </div>
            )}

            {chartData && repositoryFullName && <Sparkline data={chartData} repository={repositoryFullName} />}
          </div>
        ) : null}
      </div>
    </div>
  );
}
