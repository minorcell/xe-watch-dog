import type { Metadata } from "next";
import { SettingsPanel } from "@/components/admin/settings-panel";

export const metadata: Metadata = {
  title: "系统设置",
  description: "管理监控仓库与调度任务",
};

export default function AdminPage() {
  return <SettingsPanel />;
}
