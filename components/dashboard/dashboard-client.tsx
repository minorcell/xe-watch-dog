"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

import { StarTable } from "@/components/stars/star-table";
import type { SnapshotGranularity } from "@/lib/date-range";
import type { StarDashboardData } from "@/lib/stars";

const StarChart = dynamic(() => import("@/components/stars/star-chart").then((m) => ({ default: m.StarChart })), {
  ssr: false,
  loading: () => <div className="h-72 grid place-items-center"><div className="size-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" /></div>,
});

const RepoDetailModal = dynamic(() => import("@/components/stars/repo-detail-modal").then((m) => ({ default: m.RepoDetailModal })), {
  ssr: false,
});

const MAX_CHART_SERIES = 20;

export function DashboardClient({
  chartData,
  chartRepositories,
  leaderboard,
  rangeLabel,
  granularity,
}: {
  chartData: StarDashboardData["chartData"];
  chartRepositories: string[];
  leaderboard: StarDashboardData["leaderboard"];
  rangeLabel: string;
  granularity: SnapshotGranularity;
}) {
  const [query, setQuery] = useState("");
  const [visibility, setVisibility] = useState("all");
  const [selectedRepo, setSelectedRepo] = useState<{ githubId: number; fullName: string } | null>(null);

  const filteredLeaderboard = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return leaderboard.filter((row) => {
      const matchesQuery =
        !normalizedQuery ||
        row.fullName.toLowerCase().includes(normalizedQuery);
      const matchesVisibility = visibility === "all" || row.visibility === visibility;
      return matchesQuery && matchesVisibility;
    });
  }, [leaderboard, query, visibility]);

  const visibleChartRepos = useMemo(
    () => filteredLeaderboard.slice(0, MAX_CHART_SERIES).map((r) => r.fullName),
    [filteredLeaderboard],
  );

  return (
    <>
      {/* Chart */}
      <section className="mb-6 overflow-hidden rounded-lg border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold">Star 趋势</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {query || visibility !== "all"
                ? `筛选结果前 ${MAX_CHART_SERIES} 名`
                : `按当前 Star 数展示排名前 ${MAX_CHART_SERIES} 的仓库`}
            </p>
          </div>
        </div>
        <div className="px-4 py-4">
          <StarChart
            data={chartData}
            repositories={chartRepositories}
            visibleRepositories={visibleChartRepos}
            granularity={granularity}
          />
        </div>
      </section>

      {/* Table */}
      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold">仓库排行榜</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              当前 Star、周期增长与仓库状态 · 点击行查看详情
            </p>
          </div>
        </div>
        <StarTable
          data={leaderboard}
          range={rangeLabel}
          query={query}
          onQueryChange={setQuery}
          visibility={visibility}
          onVisibilityChange={setVisibility}
          onRepoClick={(repository) => setSelectedRepo({ githubId: repository.githubId, fullName: repository.fullName })}
        />
      </section>

      {selectedRepo && (
        <RepoDetailModal
          repositoryId={selectedRepo.githubId}
          repositoryFullName={selectedRepo.fullName}
          chartData={chartData}
          open={true}
          onClose={() => setSelectedRepo(null)}
        />
      )}
    </>
  );
}
