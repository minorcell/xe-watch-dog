import type { Metadata } from "next";
import { HomeContent } from "@/components/home/home-content";

export const metadata: Metadata = {
  title: "Watchdog — 面向 GitHub 组织的数据分析平台",
  description:
    "从 GitHub 拉取仓库数据、追踪 Star 趋势、分析团队指标。为实训营和组织管理者打造的轻量数据平台。",
  openGraph: {
    title: "Watchdog — GitHub 组织数据分析平台",
    description: "追踪 Star 趋势、管理仓库监控、调度数据采集。",
    type: "website",
  },
};

export default function HomePage() {
  return <HomeContent />;
}
