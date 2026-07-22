import type { Metadata } from "next";
import { AlertTriangle, CalendarClock, Database, FolderGit2, Star, TrendingUp } from "lucide-react";

import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { StatTiles } from "@/components/dashboard/stat-tiles";
import { RefreshButton } from "@/components/stars/refresh-button";
import { RangeSelector } from "@/components/stars/range-selector";
import { formatSnapshotDate, resolveDateRange } from "@/lib/date-range";
import { getStarDashboardData } from "@/lib/stars";

export const metadata: Metadata = {
  title: "Star 看板",
  description: "GitHub 仓库 Star 趋势图表、排行榜与快照管理",
};

type DashboardPageProps = {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>;
};

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

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const range = resolveDateRange(await searchParams);
  const data = await getStarDashboardData(range);
  const hasGrowthData = data.leaderboard.some((repository) => repository.growth !== null);

  return (
    <div className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Star 看板</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              已配置仓库的 Star 趋势与最新快照排行
            </p>
          </div>
          <div className="flex items-center gap-3">
            <RangeSelector value={range} />
            <RefreshButton disabled={!data.databaseConfigured} />
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

        {data.failedRepositoryCount > 0 ? (
          <div
            className="mb-4 flex items-center gap-2.5 rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-600 dark:text-red-500"
            role="alert"
          >
            <AlertTriangle className="size-3.5 shrink-0" />
            <p>
              最近一次采集中有 {data.failedRepositoryCount} 个仓库未写入快照，请检查仓库名称或 Token
              的访问权限。
            </p>
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
            label="已有快照"
            value={String(data.successfulRepositoryCount)}
            sub={`/ ${data.repositoryCount}`}
          />
          <StatTile
            icon={CalendarClock}
            label="最近快照"
            value={formatSnapshotDate(data.lastSnapshotAt)}
          />
        </StatTiles>

        {/* Chart + Table (linked via shared filter state) */}
        <DashboardClient
          chartData={data.chartData}
          chartRepositories={data.chartRepositories}
          leaderboard={data.leaderboard}
          rangeLabel={range.label}
        />
    </div>
  );
}
