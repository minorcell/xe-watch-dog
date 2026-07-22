import type { Metadata } from "next";
import { Activity, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "管理员登录",
};

export default async function LoginPage() {
  if (await getSession()) redirect("/dashboard");

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-[420px]">
        <div className="mb-7 flex items-center gap-3 text-foreground">
          <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_10px_28px_rgb(37_99_235/20%)]">
            <Activity className="size-5" />
          </span>
          <div>
            <p className="font-semibold leading-tight">Watchdog</p>
            <p className="mt-0.5 text-xs text-muted-foreground">1024XEngineer</p>
          </div>
        </div>
        <Card className="border-border/80 shadow-[0_24px_80px_rgb(26_39_72/10%)]">
          <CardHeader className="p-7 pb-5 sm:p-8 sm:pb-6">
            <CardTitle className="text-2xl font-semibold">欢迎回来</CardTitle>
            <CardDescription className="pt-1 text-[15px] leading-6">登录后查看仓库 Star 趋势和实时排行。</CardDescription>
          </CardHeader>
          <CardContent className="px-7 pb-7 sm:px-8 sm:pb-8">
            <LoginForm />
          </CardContent>
        </Card>
        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" />
          受保护的管理员空间
        </div>
      </div>
    </main>
  );
}
