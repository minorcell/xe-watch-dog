import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";

import { ThemeProvider } from "@/components/theme/theme-provider";

import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://org-watch-dog.vercel.app"),
  title: { default: "Watchdog", template: "%s | Watchdog" },
  description:
    "面向 GitHub 组织的数据分析与实训管理平台 — 从 GitHub 拉取仓库数据、追踪 Star 趋势、分析团队指标。",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Watchdog — GitHub 组织数据分析平台",
    description: "Star 趋势监控 · 仓库管理 · 调度引擎",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const theme = (cookieStore.get("theme")?.value as "dark" | "light") ?? "dark";

  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} ${theme}`} suppressHydrationWarning>
      <body>
        <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
