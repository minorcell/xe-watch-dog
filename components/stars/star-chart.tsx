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

const lineColors = ["#2563eb", "#16805c", "#b56a0c", "#b4455a", "#6b55a1"];

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

export function StarChart({ data, repositories }: { data: ChartPoint[]; repositories: string[] }) {
  if (data.length === 0 || repositories.length === 0) {
    return (
      <div className="grid h-80 place-items-center text-center">
        <div>
          <p className="text-sm font-medium">暂无历史快照</p>
          <p className="mt-1 text-xs text-muted-foreground">完成首次采集后将从这里开始记录趋势。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-x-5 gap-y-2 px-3 text-xs text-muted-foreground">
        {repositories.map((repository, index) => (
          <span key={repository} className="inline-flex items-center gap-2">
            <i className="size-2 rounded-full" style={{ backgroundColor: lineColors[index % lineColors.length] }} />
            {repository}
          </span>
        ))}
      </div>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 14, left: 2, bottom: 4 }} accessibilityLayer title="仓库 Star 数量趋势">
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
            dataKey="capturedAt"
              tickFormatter={formatDate}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              minTickGap={24}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              width={42}
            />
            <Tooltip
              labelFormatter={(value) => `采集于 ${formatDate(String(value))}`}
              formatter={(value, name) => [Number(value).toLocaleString("zh-CN"), String(name)]}
              contentStyle={{
                border: "1px solid var(--border)",
                borderRadius: "6px",
                background: "var(--popover)",
                color: "var(--popover-foreground)",
                fontSize: "12px",
                boxShadow: "0 8px 24px rgb(15 23 42 / 10%)",
              }}
            />
            {repositories.map((repository, index) => (
              <Line
                key={repository}
                type="monotone"
                dataKey={repository}
                name={repository}
                stroke={lineColors[index % lineColors.length]}
                strokeWidth={2}
                dot={{ r: 2, strokeWidth: 0 }}
                activeDot={{ r: 4, strokeWidth: 2, fill: "var(--card)" }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
