"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type ThemeContextType = {
  theme: "dark" | "light";
  setTheme: (t: "dark" | "light") => void;
};

const ThemeContext = createContext<ThemeContextType>({ theme: "dark", setTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children, initialTheme }: { children: React.ReactNode; initialTheme?: "dark" | "light" }) {
  const [theme, setThemeState] = useState<"dark" | "light">(initialTheme ?? "dark");

  const setTheme = useCallback((t: "dark" | "light") => {
    setThemeState(t);
    document.documentElement.classList.toggle("dark", t === "dark");
    // Persist via cookie
    document.cookie = `theme=${t};path=/;max-age=31536000;SameSite=Lax`;
  }, []);

  // Sync initial class on mount
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
