"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Only show the toggle after component is mounted to avoid hydration mismatch
  React.useEffect(() => setMounted(true), []);

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative inline-flex items-center justify-center rounded-md p-2 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-slate-800 dark:hover:text-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-blue-500 dark:focus:ring-offset-slate-900"
      aria-label="Toggle theme"
    >
      <div className="relative h-5 w-5 overflow-hidden">
        {mounted && (
          <>
            <Sun 
              className={`absolute inset-0 h-full w-full transition-transform duration-500 ${theme === 'dark' ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`} 
            />
            <Moon 
              className={`absolute inset-0 h-full w-full transition-transform duration-500 ${theme === 'dark' ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`} 
            />
          </>
        )}
      </div>
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
