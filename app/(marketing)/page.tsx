"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, GitBranch, Globe, LineChart, Star } from "lucide-react";
import { motion } from "motion/react";

import { LoginModal } from "@/components/auth/login-modal";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const fadeIn = { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 } };
const fadeInSlow = { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } } };

export default function HomePage() {
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <div className="h-dvh overflow-hidden bg-background text-foreground">
      {/* Nav */}
      <motion.header
        className="flex h-14 items-center justify-between px-6"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex items-center gap-2.5">
          <Logo className="size-6" />
          <span className="text-sm font-semibold tracking-tight">Watchdog</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setLoginOpen(true)}
            className="inline-flex h-8 items-center rounded-md bg-foreground px-3 text-xs font-medium text-background hover:bg-foreground/90"
          >
            登录
          </button>
        </div>
      </motion.header>

      {/* Hero */}
      <section
        className="relative flex flex-col items-center justify-center px-4 text-center"
        style={{ height: "calc(100dvh - 3.5rem)" }}
      >
        {/* Background gradient */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--primary)_0%,transparent_70%)] opacity-[0.04] dark:opacity-[0.07]" />

        <div className="relative z-10 max-w-lg">
          <motion.div {...fadeInSlow}>
            <Logo className="mx-auto mb-10 size-24" />
          </motion.div>

          <motion.h1
            {...fadeIn}
            transition={{ delay: 0.15, duration: 0.6, ease: "easeOut" }}
            className="text-4xl font-bold tracking-tight sm:text-5xl"
          >
            用数据
            <span className="text-primary">看懂</span>
            你的组织
          </motion.h1>

          <motion.p
            {...fadeIn}
            transition={{ delay: 0.25, duration: 0.6, ease: "easeOut" }}
            className="mx-auto mt-6 max-w-md text-[15px] leading-relaxed text-muted-foreground"
          >
            从 GitHub 拉取仓库数据、追踪 Star 趋势、分析团队指标。
          </motion.p>

          <motion.div
            {...fadeIn}
            transition={{ delay: 0.35, duration: 0.6, ease: "easeOut" }}
            className="mt-10 flex items-center justify-center gap-3"
          >
            <button
              type="button"
              onClick={() => setLoginOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
            >
              进入看板 <ArrowRight className="size-4" />
            </button>
            <Link
              href="https://github.com/minorcell/xe-watch-dog"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-lg border px-5 text-sm font-medium transition-colors hover:bg-accent"
            >
              <GitBranch className="size-4" />
              GitHub
            </Link>
          </motion.div>
        </div>

        {/* Feature cards */}
        <div className="relative z-10 mt-20 grid max-w-2xl gap-4 sm:grid-cols-3">
          {[
            { icon: Star, title: "Star 趋势", desc: "自动采集，可视化图表与分析" },
            { icon: Globe, title: "仓库管理", desc: "实时同步组织仓库列表" },
            { icon: LineChart, title: "调度引擎", desc: "可扩展的任务队列系统" },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 + i * 0.1, duration: 0.5, ease: "easeOut" }}
              className="rounded-xl border bg-card/50 px-5 py-4 text-left backdrop-blur-sm"
            >
              <f.icon className="mb-2 size-4 text-muted-foreground" />
              <h3 className="text-xs font-semibold">{f.title}</h3>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}
