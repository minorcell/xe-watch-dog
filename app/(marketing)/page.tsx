import type { Metadata } from "next";
import { HomeContent } from "@/components/home/home-content";

export const metadata: Metadata = {
  title: "Watchdog — 面向 GitHub 组织的数据分析平台",
  description:
    "从 GitHub 拉取仓库数据、追踪 Star 趋势、分析团队指标。",
};

export default function HomePage() {
  return <HomeContent />;
}
