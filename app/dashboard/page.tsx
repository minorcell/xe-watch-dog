import type { Metadata } from "next";
import { AlertTriangle, CalendarClock, Database, FolderGit2, Star, TrendingUp } from "lucide-react";

import { RangeSelector } from "@/components/stars/range-selector";
import { RefreshButton } from "@/components/stars/refresh-button";
import { StarChart } from "@/components/stars/star-chart";
import { StarTable } from "@/components/stars/star-table";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { formatSnapshotDate, resolveDateRange } from "@/lib/date-range";
import { getStarDashboardData } from "@/lib/stars";

export const metadata: Metadata = {
  title: "Star 看板",
};

type DashboardPageProps = {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const range = resolveDateRange(await searchParams);
  const data = await getStarDashboardData(range);
  const hasGrowthData = data.leaderboard.some((repository) => repository.growth !== null);

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">Overview</p>
          <h1 className="text-3xl font-semibold tracking-tight">Star 看板</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">已配置仓库的 Star 趋势与最新快照排行</p>
        </div>
        <RefreshButton disabled={!data.databaseConfigured} />
      </div>

      {!data.databaseConfigured ? (
        <div className="mb-5 flex gap-3 rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950" role="status">
          <Database className="mt-0.5 size-4 shrink-0" />
          <p>快照存储尚未配置。配置 <code className="font-mono text-xs">DATABASE_URL</code> 后即可采集并查看仓库数据。</p>
        </div>
      ) : null}

      {data.failedRepositoryCount > 0 ? (
        <div className="mb-5 flex gap-3 rounded-lg border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-900" role="alert">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>最近一次采集中有 {data.failedRepositoryCount} 个仓库未写入快照，请检查仓库名称或 Token 的访问权限。</p>
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Star 摘要">
        <Card className="border-border/70">
          <CardHeader className="flex-row items-center justify-between gap-4 pb-2">
            <CardDescription>当前 Star 总数</CardDescription>
            <span className="grid size-9 place-items-center rounded-lg bg-blue-50 text-blue-600"><Star className="size-4" /></span>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{data.totalStars.toLocaleString("zh-CN")}</p>
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader className="flex-row items-center justify-between gap-4 pb-2">
            <CardDescription>{range.label}增长</CardDescription>
            <span className="grid size-9 place-items-center rounded-lg bg-emerald-50 text-emerald-600"><TrendingUp className="size-4" /></span>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{hasGrowthData ? `${data.totalGrowth >= 0 ? "+" : ""}${data.totalGrowth.toLocaleString("zh-CN")}` : "-"}</p>
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader className="flex-row items-center justify-between gap-4 pb-2">
            <CardDescription>已有快照</CardDescription>
            <span className="grid size-9 place-items-center rounded-lg bg-cyan-50 text-cyan-700"><FolderGit2 className="size-4" /></span>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{data.successfulRepositoryCount}<span className="ml-1 text-sm font-normal text-muted-foreground">/ {data.repositoryCount}</span></p>
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader className="flex-row items-center justify-between gap-4 pb-2">
            <CardDescription>最近快照</CardDescription>
            <span className="grid size-9 place-items-center rounded-lg bg-amber-50 text-amber-700"><CalendarClock className="size-4" /></span>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold tabular-nums">{formatSnapshotDate(data.lastSnapshotAt)}</p>
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 overflow-hidden rounded-lg border border-border/80 bg-card shadow-[0_10px_30px_rgb(15_23_42/3%)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b px-5 py-4 md:px-6">
          <div>
            <h2 className="font-semibold">Star 趋势</h2>
            <p className="mt-1 text-xs text-muted-foreground">按当前 Star 数展示排名前 5 的仓库</p>
          </div>
          <RangeSelector value={range} />
        </div>
        <div className="px-3 py-5 md:px-6">
          <StarChart data={data.chartData} repositories={data.chartRepositories} />
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-lg border border-border/80 bg-card shadow-[0_10px_30px_rgb(15_23_42/3%)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b px-5 py-4 md:px-6">
          <div>
            <h2 className="font-semibold">仓库排行榜</h2>
            <p className="mt-1 text-xs text-muted-foreground">当前 Star、周期增长与仓库状态</p>
          </div>
        </div>
        <StarTable data={data.leaderboard} range={range.label} />
      </section>
    </div>
  );
}
