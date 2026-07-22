"use client";

import { useState } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function RefreshButton({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState("");

  async function refresh() {
    setIsPending(true);
    setMessage("");

    try {
      const response = await fetch("/api/stars/snapshot", { method: "POST" });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.message ?? "采集失败");
        return;
      }

      setMessage(result.failed > 0
        ? `已更新 ${result.saved} 个仓库，${result.failed} 个失败`
        : `已更新 ${result.saved} 个仓库`);
      router.refresh();
    } catch {
      setMessage("无法连接采集服务");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {message ? <span className="text-xs text-muted-foreground" role="status">{message}</span> : null}
      <Button onClick={refresh} disabled={disabled || isPending}>
        {isPending ? <LoaderCircle className="animate-spin" /> : <RefreshCw />}
        {isPending ? "正在获取" : "获取最新快照"}
      </Button>
    </div>
  );
}
