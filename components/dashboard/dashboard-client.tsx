"use client";

import { useMemo, useState } from "react";

import { RepoDetailModal } from "@/components/stars/repo-detail-modal";
import { StarChart } from "@/components/stars/star-chart";
import { StarTable } from "@/components/stars/star-table";
import type { StarDashboardData } from "@/lib/stars";

const MAX_CHART_SERIES = 5;

export function DashboardClient({
  chartData,
  chartRepositories,
  leaderboard,
  rangeLabel,
}: {
  chartData: StarDashboardData["chartData"];
  chartRepositories: string[];
  leaderboard: StarDashboardData["leaderboard"];
  rangeLabel: string;
}) {
  const [query, setQuery] = useState("");
  const [visibility, setVisibility] = useState("all");
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);

  const filteredLeaderboard = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return leaderboard.filter((row) => {
      const matchesQuery =
        !normalizedQuery ||
        `${row.fullName} ${row.projectName} ${row.topic}`.toLowerCase().includes(normalizedQuery);
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
          />
        </div>
      </section>

      {/* Table */}
      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold">仓库排行榜</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              当前 Star、周期增长与仓库状态 · 点击仓库查看详情
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
          onRepoClick={(fullName) => setSelectedRepo(fullName)}
        />
      </section>

      <RepoDetailModal
        repoFullName={selectedRepo}
        open={selectedRepo !== null}
        onClose={() => setSelectedRepo(null)}
      />
    </>
  );
}
