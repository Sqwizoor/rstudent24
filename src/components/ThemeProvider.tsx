"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps as NextThemeProviderProps } from "next-themes";
import { usePathname } from "next/navigation";

type ThemeProviderProps = React.PropsWithChildren<Omit<NextThemeProviderProps, 'children'>>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Use a state to track if we're mounted on the client
  const [mounted, setMounted] = React.useState(false);
  const pathname = usePathname();

  const isAdminPage = pathname.startsWith("/admin");
  const isDashboardPage = pathname.includes("/managers") || 
                          pathname.includes("/tenants") || 
                          isAdminPage;

  // After mounting, we have access to the client's theme preferences
  React.useEffect(() => {
    setMounted(true);
    
    if (typeof window !== "undefined" && document) {
      if (isAdminPage) {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
      } else if (!isDashboardPage) {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
    }
  }, [isDashboardPage, isAdminPage, pathname]);

  // Create modified props: force dark on admin, force light on non-dashboard pages
  const themeProps = {
    ...props,
    forcedTheme: isAdminPage ? 'dark' : (!isDashboardPage ? 'light' : undefined),
  };

  // Avoid rendering children until mounted on the client
  // This prevents hydration mismatch between server and client
  return (
    <NextThemesProvider {...themeProps}>
      <div suppressHydrationWarning>
        {mounted ? children : <div style={{ visibility: 'hidden' }}>{children}</div>}
      </div>
    </NextThemesProvider>
  );
}
