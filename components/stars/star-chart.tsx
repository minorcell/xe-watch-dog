"use client";

import { useCallback, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function shortName(full: string) {
  return full.includes("/") ? full.split("/").slice(1).join("/") : full;
}

const palette = [
  "var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)",
  "#7c3aed", "#db2777", "#ea580c", "#0891b2", "#65a30d",
  "#9333ea", "#e11d48", "#d97706", "#0e7490", "#4d7c0f",
  "#6d28d9", "#be185d", "#b45309", "#155e75", "#3f6212",
];

type ChartPoint = Record<string, string | number | null>;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function StarChart({
  data,
  repositories,
  visibleRepositories,
}: {
  data: ChartPoint[];
  repositories: string[];
  visibleRepositories: string[];
}) {
  const [hiddenRepos, setHiddenRepos] = useState<Set<string>>(new Set());
  const [hoveredRepo, setHoveredRepo] = useState<string | null>(null);

  const toggleRepo = useCallback((repo: string) => {
    setHiddenRepos((prev) => {
      const next = new Set(prev);
      if (next.has(repo)) next.delete(repo);
      else next.add(repo);
      return next;
    });
  }, []);

  if (data.length === 0 || visibleRepositories.length === 0) {
    return (
      <div className="grid h-72 place-items-center text-center">
        <div>
          <p className="text-xs font-medium">暂无匹配数据</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            尝试调整筛选条件，或等待首次采集完成。
          </p>
        </div>
      </div>
    );
  }

  const activeRepos = visibleRepositories.filter((r) => repositories.includes(r));
  const renderedRepos = activeRepos.filter((r) => !hiddenRepos.has(r));

  return (
    <div className="grid gap-3">
      {/* Interactive legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-1 text-[11px]">
        {activeRepos.map((repository, index) => {
          const isHidden = hiddenRepos.has(repository);
          const isHovered = hoveredRepo === repository;
          return (
            <button
              key={repository}
              type="button"
              onClick={() => toggleRepo(repository)}
              onMouseEnter={() => setHoveredRepo(repository)}
              onMouseLeave={() => setHoveredRepo(null)}
              className={`inline-flex items-center gap-1.5 rounded px-1 py-0.5 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                isHidden ? "opacity-30 line-through" : ""
              } ${isHovered && !isHidden ? "font-medium" : ""}`}
            >
              <i
                className="size-2 shrink-0 rounded-full transition-transform"
                style={{
                  backgroundColor: palette[index % palette.length],
                  transform: isHovered && !isHidden ? "scale(1.3)" : "scale(1)",
                }}
              />
              <span className={isHidden ? "line-through" : ""}>{shortName(repository)}</span>
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            accessibilityLayer
            title="仓库 Star 数量趋势"
            onMouseLeave={() => setHoveredRepo(null)}
          >
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="capturedAt"
              tickFormatter={formatDate}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              minTickGap={28}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              width={38}
            />
            <Tooltip
              labelFormatter={(value) => `采集于 ${formatDate(String(value))}`}
              formatter={(value, name) => [Number(value).toLocaleString("zh-CN"), String(name)]}
              contentStyle={{
                border: "1px solid var(--border)",
                borderRadius: "6px",
                background: "var(--popover)",
                color: "var(--popover-foreground)",
                fontSize: "11px",
                boxShadow: "0 4px 16px rgb(0 0 0 / 8%)",
                padding: "8px 10px",
              }}
            />
            {renderedRepos.map((repository, index) => {
              const isHovered = hoveredRepo === repository;
              const colorIndex = activeRepos.indexOf(repository) % palette.length;
              return (
                <Line
                  key={repository}
                  type="monotone"
                  dataKey={repository}
                  name={shortName(repository)}
                  stroke={palette[colorIndex]}
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, fill: "var(--card)" }}
                  connectNulls
                  style={{
                    transition: "stroke-width 150ms",
                  }}
                  onMouseEnter={() => setHoveredRepo(repository)}
                  onMouseLeave={() => setHoveredRepo(null)}
                  opacity={hoveredRepo && hoveredRepo !== repository ? 0.3 : 1}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
