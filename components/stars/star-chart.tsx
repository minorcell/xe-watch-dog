"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const lineColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
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
  /** All repositories that exist in chart data */
  repositories: string[];
  /** Subset of repositories to actually render (e.g. top 5 from filtered table) */
  visibleRepositories: string[];
}) {
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

  // Only render repos that exist in both `repositories` and `visibleRepositories`
  const activeRepos = visibleRepositories.filter((r) => repositories.includes(r));

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-1 text-[11px] text-muted-foreground">
        {activeRepos.map((repository, index) => (
          <span key={repository} className="inline-flex items-center gap-1.5">
            <i
              className="size-2 rounded-full"
              style={{ backgroundColor: lineColors[index % lineColors.length] }}
            />
            {repository}
          </span>
        ))}
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            accessibilityLayer
            title="仓库 Star 数量趋势"
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
            {activeRepos.map((repository, index) => (
              <Line
                key={repository}
                type="monotone"
                dataKey={repository}
                name={repository}
                stroke={lineColors[index % lineColors.length]}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 2, fill: "var(--card)" }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
