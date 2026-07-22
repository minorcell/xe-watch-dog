import Link from "next/link";
import { ArrowRight, BarChart3, GitBranch, Globe, LineChart, RefreshCw, Star } from "lucide-react";

import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Nav */}
      <header className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-2.5">
          <Logo className="size-7" />
          <span className="text-sm font-semibold tracking-tight">Watchdog</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className="inline-flex h-8 items-center rounded-md bg-foreground px-3 text-xs font-medium text-background hover:bg-foreground/90">
            登录
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-4 pb-32 pt-20 text-center">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--primary)_0%,transparent_70%)] opacity-[0.03] dark:opacity-[0.06]" />

        <div className="relative z-10 max-w-2xl">
          <Logo className="mx-auto mb-8 size-20" />

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            用数据
            <span className="text-primary">看懂</span>
            你的组织
          </h1>

          <p className="mx-auto mt-6 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
            从 GitHub 拉取仓库数据、追踪 Star 趋势、分析团队指标。
            为实训营和组织管理者打造的轻量数据平台。
          </p>

          <div className="mt-10 flex items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
            >
              进入看板 <ArrowRight className="size-4" />
            </Link>
            <Link
              href="https://github.com/minorcell/xe-watch-dog"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-lg border px-5 text-sm font-medium transition-colors hover:bg-accent"
            >
              <GitBranch className="size-4" />
              GitHub
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 pb-32">
        <div className="grid gap-6 sm:grid-cols-3">
          <FeatureCard
            icon={Star}
            title="Star 趋势监控"
            description="自动采集每日 Star 数据，可视化趋势图表与排行榜，支持 CSV 导出。"
          />
          <FeatureCard
            icon={Globe}
            title="仓库管理"
            description="实时同步组织仓库列表，一键开关监控，按需追踪关键项目。"
          />
          <FeatureCard
            icon={LineChart}
            title="调度引擎"
            description="可扩展的定时任务队列，元信息同步与快照采集独立控制。"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8 text-center text-xs text-muted-foreground">
        <p>Watchdog · 面向 GitHub 组织的数据平台</p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <Icon className="mb-3 size-5 text-muted-foreground" />
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
