"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { useSyncExternalStore } from "react";

const subscribeToHydration = () => () => {};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribeToHydration, () => true, () => false);

  if (!mounted) return <span className="size-8 shrink-0" />;

  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/40"
      aria-label={isDark ? "切换亮色模式" : "切换暗色模式"}
    >
      {isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
    </button>
  );
}
