import type { Metadata } from "next";

import { AdminPanel } from "@/components/admin/admin-panel";

export const metadata: Metadata = {
  title: "组织管理",
};

export default function AdminPage() {
  return <AdminPanel />;
}
