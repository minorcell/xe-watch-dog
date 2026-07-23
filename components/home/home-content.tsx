"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Cloud, GitBranch, Globe, LineChart, Monitor, Star } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { LoginModal } from "@/components/auth/login-modal";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const fadeIn = { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 } };
const fadeInSlow = { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } } };

export function HomeContent() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileNotice, setShowMobileNotice] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const handleLoginClick = useCallback(() => {
    if (isMobile) {
      setShowMobileNotice(true);
    } else {
      setLoginOpen(true);
    }
  }, [isMobile]);

  return (
    <div className="h-dvh overflow-hidden bg-background text-foreground">
      <motion.header
        className="flex h-14 items-center justify-between px-4 sm:px-6"
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
            onClick={handleLoginClick}
            className="inline-flex h-8 items-center rounded-md bg-foreground px-3 text-xs font-medium text-background hover:bg-foreground/90"
          >
            登录
          </button>
        </div>
      </motion.header>

      <section
        className="relative flex flex-col items-center justify-center px-4 text-center"
        style={{ minHeight: "calc(100dvh - 3.5rem)" }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--primary)_0%,transparent_70%)] opacity-[0.04] dark:opacity-[0.07]" />

        <div className="relative z-10 max-w-lg">
          <motion.div {...fadeInSlow}>
            <Logo className="mx-auto mb-6 sm:mb-10 size-16 sm:size-24" />
          </motion.div>

          <motion.h1
            {...fadeIn}
            transition={{ delay: 0.15, duration: 0.6, ease: "easeOut" }}
            className="text-3xl font-bold tracking-tight sm:text-5xl"
          >
            用数据
            <span className="text-primary">看懂</span>
            你的组织
          </motion.h1>

          <motion.p
            {...fadeIn}
            transition={{ delay: 0.25, duration: 0.6, ease: "easeOut" }}
            className="mx-auto mt-4 sm:mt-6 max-w-md text-[14px] sm:text-[15px] leading-relaxed text-muted-foreground"
          >
            从 GitHub 拉取仓库数据、追踪 Star 趋势、分析团队指标。
          </motion.p>

          <motion.div
            {...fadeIn}
            transition={{ delay: 0.35, duration: 0.6, ease: "easeOut" }}
            className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-2 sm:gap-3"
          >
            <button
              type="button"
              onClick={handleLoginClick}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
            >
              进入看板 <ArrowRight className="size-4" />
            </button>
            <Link
              href="https://github.com/minorcell/org-watch-dog"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-lg border px-5 text-sm font-medium transition-colors hover:bg-accent"
            >
              <GitBranch className="size-4" />
              GitHub
            </Link>
          </motion.div>
        </div>

        <div className="relative z-10 mt-12 sm:mt-20 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
          {[
            { icon: Star, title: "Star 趋势", desc: "自动采集，可视化图表与分析" },
            { icon: Globe, title: "仓库管理", desc: "实时同步组织仓库列表" },
            { icon: LineChart, title: "调度引擎", desc: "可扩展的任务队列系统" },
            { icon: Cloud, title: "零成本托管", desc: "Vercel + Neon 免费方案，开箱即用" },
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

      {/* Mobile notice — shown when user taps login on a small screen */}
      <AnimatePresence>
        {showMobileNotice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.button
              type="button"
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowMobileNotice(false)}
              aria-label="关闭"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="relative z-10 mx-4 w-full max-w-xs rounded-xl border bg-card p-6 shadow-[0_24px_80px_rgb(0_0_0/20%)] text-center"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Monitor className="mx-auto mb-4 size-8 text-muted-foreground" />
              <h2 className="text-sm font-semibold">请在 PC 端打开</h2>
              <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
                Watchdog 是一个数据密集型管理后台，建议在桌面端访问以获得最佳体验。
              </p>
              <button
                type="button"
                onClick={() => setShowMobileNotice(false)}
                className="mt-5 inline-flex h-9 w-full items-center justify-center rounded-lg bg-foreground text-xs font-medium text-background transition-colors hover:bg-foreground/90"
              >
                知道了
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
