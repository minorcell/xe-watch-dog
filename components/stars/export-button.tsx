"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { StarLeaderboardRow } from "@/lib/stars";

export function ExportButton({ rows, range }: { rows: StarLeaderboardRow[]; range: string }) {
  function exportCsv() {
    const header = ["排名", "项目", "仓库", "当前 Star", `${range} 天增长`, "Fork", "状态"];
    const values = rows.map((row, index) => [
      String(index + 1),
      row.projectName,
      row.fullName,
      row.stars === null ? "" : String(row.stars),
      row.growth === null ? "" : String(row.growth),
      row.forks === null ? "" : String(row.forks),
      row.capturedAt ? "已采集" : "暂无快照",
    ]);
    const csv = [header, ...values]
      .map((line) => line.map((value) => `"${value.replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `star-leaderboard-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" onClick={exportCsv}>
      <Download />
      导出 CSV
    </Button>
  );
}
