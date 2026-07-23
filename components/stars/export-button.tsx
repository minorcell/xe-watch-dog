"use client";

import { Download } from "lucide-react";

import type { StarLeaderboardRow } from "@/lib/stars";

export function ExportButton({ rows, range }: { rows: StarLeaderboardRow[]; range: string }) {
  function exportCsv() {
    const header = ["排名", "仓库", "当前 Star", `${range}增长`, "Fork", "状态"];
    const values = rows.map((row, index) => [
      String(index + 1),
      row.fullName,
      row.stars === null ? "" : String(row.stars),
      row.growth === null ? "" : String(row.growth),
      row.forks === null ? "" : String(row.forks),
      row.unavailableAt ? "当前不可见" : row.freshness === "current" ? "本次已采集" : row.freshness === "stale" ? "历史数据" : "暂无快照",
    ]);
    const csv = [header, ...values]
      .map((line) => line.map((value) => `"${value.replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `star-leaderboard-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={exportCsv}
      className="inline-flex h-7 items-center gap-1.5 rounded-md border bg-transparent px-2.5 text-[11px] font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Download className="size-3" />
      导出 CSV
    </button>
  );
}
