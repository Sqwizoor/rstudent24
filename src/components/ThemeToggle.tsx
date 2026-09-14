"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = theme === "system" ? resolvedTheme : theme;
  const isDark = currentTheme === "dark";

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  if (!mounted) {
    return (
      <button
        type="button"
        className={`inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-100/80 dark:bg-zinc-900/60 text-slate-500 dark:text-zinc-400 transition-colors ${className}`}
        aria-label="Toggle theme"
        disabled
      >
        <span className="h-4 w-4 rounded-full bg-slate-300 dark:bg-zinc-700 animate-pulse" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`inline-flex items-center justify-center gap-2 h-9 px-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-100/80 dark:bg-zinc-900/60 text-slate-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 shadow-sm ${className}`}
      aria-label={isDark ? "Switch to White Mode" : "Switch to Dark Mode"}
      title={isDark ? "Switch to White Mode" : "Switch to Dark Mode"}
    >
      <div className="relative h-4 w-4 flex items-center justify-center">
        {isDark ? (
          <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300 rotate-0 scale-100" />
        ) : (
          <Moon className="h-4 w-4 text-slate-700 transition-transform duration-300 rotate-0 scale-100" />
        )}
      </div>
      {showLabel && (
        <span className="text-xs font-medium">
          {isDark ? "White Mode" : "Dark Mode"}
        </span>
      )}
      <span className="sr-only">
        {isDark ? "Switch to White Mode" : "Switch to Dark Mode"}
      </span>
    </button>
  );
}
