"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={logout}
      aria-label="退出登录"
      className="w-full justify-start text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground max-md:size-10 max-md:justify-center max-md:px-0"
    >
      <LogOut />
      <span className="max-md:sr-only">退出登录</span>
    </Button>
  );
}
