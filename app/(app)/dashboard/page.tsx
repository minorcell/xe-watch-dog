import type { Metadata } from "next";

import { DashboardPageClient } from "@/components/dashboard/dashboard-page-client";

export const metadata: Metadata = {
  title: "Star 看板",
  description: "GitHub 仓库 Star 趋势图表、排行榜与快照管理",
};

export default function DashboardPage() {
  return <DashboardPageClient />;
}
