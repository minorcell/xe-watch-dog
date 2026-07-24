"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, CalendarClock, Database, FolderGit2, Star, TrendingUp } from "lucide-react";

import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { StatTiles } from "@/components/dashboard/stat-tiles";
import { RefreshButton } from "@/components/stars/refresh-button";
import { RangeSelector } from "@/components/stars/range-selector";
import { formatSnapshotDate, resolveDateRange, resolveGranularity } from "@/lib/date-range";
import type { StarDashboardData } from "@/lib/stars";

async function requestDashboard(
  range: ReturnType<typeof resolveDateRange>,
  granularity: ReturnType<typeof resolveGranularity>,
) {
  const params = new URLSearchParams();
  if (range.preset) params.set("preset", String(range.preset));
  else {
    params.set("from", range.from);
    params.set("to", range.to);
  }
  params.set("granularity", granularity);
  const response = await fetch(`/api/stars/dashboard?${params.toString()}`);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? "加载失败");
  }
  return await response.json() as StarDashboardData;
}

function StatTile({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold tabular-nums leading-snug">
          {value}
          {sub ? (
            <span className="ml-1 text-xs font-normal text-muted-foreground">{sub}</span>
          ) : null}
        </p>
      </div>
    </div>
  );
}

export function DashboardPageClient() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<StarDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const preset = searchParams.get("preset") ?? undefined;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const granularity = useMemo(() => resolveGranularity(searchParams.get("granularity")), [searchParams]);
  const range = useMemo(() => resolveDateRange({ preset, from, to }), [preset, from, to]);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      setData(await requestDashboard(range, granularity));
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    }
  }, [granularity, range]);

  useEffect(() => {
    let active = true;
    void requestDashboard(range, granularity)
      .then((result) => {
        if (active) {
          setData(result);
          setError(null);
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "加载失败");
      });
    return () => { active = false; };
  }, [granularity, range]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <p className="text-sm text-muted-foreground">{error}</p>
        <button
          type="button"
          onClick={fetchData}
          className="inline-flex h-8 items-center rounded-md bg-foreground px-3 text-xs font-medium text-background hover:bg-foreground/90"
        >
          重试
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
      </div>
    );
  }

  const hasGrowthData = data.leaderboard.some((r) => r.growth !== null);

  return (
    <div className="mx-auto w-full">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Star 看板</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            已配置仓库的 Star 趋势与最新快照排行
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <RangeSelector value={range} granularity={granularity} />
          <RefreshButton disabled={!data.databaseConfigured} onRefresh={fetchData} />
        </div>
      </div>

      {/* Warnings */}
      {!data.databaseConfigured ? (
        <div
          className="mb-4 flex items-center gap-2.5 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-600 dark:text-amber-500"
          role="status"
        >
          <Database className="size-3.5 shrink-0" />
          <p>
            快照存储尚未配置。配置{" "}
            <code className="rounded bg-amber-500/10 px-1 py-px font-mono text-[11px]">
              DATABASE_URL
            </code>{" "}
            后即可采集并查看仓库数据。
          </p>
        </div>
      ) : null}

      {data.latestRun?.status === "failed" ? (
        <div
          className="mb-4 flex items-center gap-2.5 rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-600 dark:text-red-500"
          role="alert"
        >
          <AlertTriangle className="size-3.5 shrink-0" />
          <p>
            最近一次 GitHub 同步失败：{data.latestRun.errorMessage ?? "请检查 GitHub Token、网络和数据库状态"}
          </p>
        </div>
      ) : null}

      {data.staleRepositoryCount > 0 ? (
        <div className="mb-4 flex items-center gap-2.5 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-600 dark:text-amber-500" role="status">
          <AlertTriangle className="size-3.5 shrink-0" />
          <p>{data.staleRepositoryCount} 个仓库当前仅有历史快照。</p>
        </div>
      ) : null}

      {/* Stat tiles */}
      <StatTiles>
        <StatTile
          icon={Star}
          label="当前 Star 总数"
          value={data.totalStars.toLocaleString("zh-CN")}
        />
        <StatTile
          icon={TrendingUp}
          label={range.label + "增长"}
          value={
            hasGrowthData
              ? `${data.totalGrowth >= 0 ? "+" : ""}${data.totalGrowth.toLocaleString("zh-CN")}`
              : "-"
          }
        />
        <StatTile
          icon={FolderGit2}
          label="最近成功批次"
          value={String(data.successfulRepositoryCount)}
          sub={`/ ${data.repositoryCount}`}
        />
        <StatTile
          icon={CalendarClock}
          label="最近快照"
          value={formatSnapshotDate(data.lastSnapshotAt)}
        />
      </StatTiles>

      {/* Chart + Table */}
      <DashboardClient
        chartData={data.chartData}
        chartRepositories={data.chartRepositories}
        leaderboard={data.leaderboard}
        rangeLabel={range.label}
        granularity={granularity}
      />
    </div>
  );
}
