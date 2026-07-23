"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";

import { useToast } from "@/components/ui/toast";

export function RefreshButton({ disabled, onRefresh }: { disabled: boolean; onRefresh: () => Promise<void> }) {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  async function refresh() {
    setIsPending(true);

    try {
      const response = await fetch("/api/admin/github-sync-runs", { method: "POST" });
      const result = await response.json();

      if (!response.ok) {
        toast(result.message ?? "采集失败", "error");
        return;
      }

      toast(`已同步 ${result.repositoryCount} 个仓库，写入 ${result.snapshotCount} 条快照`, "success");
      await onRefresh();
    } catch {
      toast("无法连接采集服务", "error");
    } finally {
      if (mountedRef.current) setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={refresh}
      disabled={disabled || isPending}
      className="inline-flex h-8 items-center gap-1.5 rounded-md bg-foreground px-3 text-xs font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-40"
    >
      {isPending ? (
        <LoaderCircle className="size-3 animate-spin" />
      ) : (
        <RefreshCw className="size-3" />
      )}
      {isPending ? "正在获取" : "获取最新快照"}
    </button>
  );
}
