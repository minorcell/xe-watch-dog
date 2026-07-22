import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";

import { Logo } from "@/components/layout/logo";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "管理员登录",
};

export default async function LoginPage() {
  if (await getSession()) redirect("/dashboard");

  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-[360px]">
        {/* Brand */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo className="size-8" />
            <div>
              <p className="text-sm font-semibold leading-tight tracking-tight">Watchdog</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Card */}
        <div className="rounded-lg border bg-card">
          <div className="border-b px-6 py-4">
            <h1 className="text-sm font-semibold">欢迎回来</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">登录后查看仓库 Star 趋势和实时排行。</p>
          </div>
          <div className="px-6 py-4">
            <LoginForm />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="size-3" />
          受保护的管理员空间
        </div>
      </div>
    </main>
  );
}
