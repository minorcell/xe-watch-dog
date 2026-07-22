"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function LogoutButton() {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function logout() {
    setIsLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        aria-label="退出登录"
        className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <LogOut className="size-3.5" />
      </button>

      <ConfirmDialog
        open={showConfirm}
        title="退出登录"
        description="确定要退出当前账号吗？退出后需要重新输入密码才能访问。"
        confirmLabel={isLoggingOut ? "退出中…" : "退出"}
        cancelLabel="取消"
        variant="danger"
        onConfirm={logout}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
