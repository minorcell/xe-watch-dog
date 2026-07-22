import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";

import { ThemeProvider } from "@/components/theme/theme-provider";

import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Watchdog", template: "%s | Watchdog" },
  description: "面向 GitHub 组织的数据分析与实训管理平台",
  icons: { icon: "/favicon.svg" },
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
