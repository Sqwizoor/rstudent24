"use client";

import DashboardNavbar from "@/components/DashboardNavbar";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import Sidebar from "@/components/AppSidebar";
import { NAVBAR_HEIGHT } from "@/lib/constants";
import React, { useEffect, useState, Suspense } from "react";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { LogIn } from "lucide-react";

// Loading component for suspense
const LoadingScreen = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  return (
    <div className={cn(
      "fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3", 
      isDark ? "bg-slate-950" : "bg-slate-50"
    )}>
      <div className={cn(
        "w-12 h-12 rounded-full animate-pulse",
        isDark ? "bg-slate-800" : "bg-slate-200"
      )}></div>
      <p className={cn(
        "text-sm font-medium",
        isDark ? "text-slate-400" : "text-slate-500"
      )}>
        Loading dashboard...
      </p>
    </div>
  );
};

const DashboardLayoutContent = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading: authLoading, isAuthenticated } = useUnifiedAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  // DEBUG: Log auth state
  useEffect(() => {
    console.log('🔍 Dashboard Layout Auth Debug:', {
      user,
      authLoading,
      isAuthenticated,
      pathname,
      timestamp: new Date().toISOString()
    });
  }, [user, authLoading, isAuthenticated, pathname]);

  useEffect(() => {
    if (user) {
      const userRole = user.role?.toLowerCase();
      
      // Handle admin users
      if (userRole === "admin") {
        if (!pathname.startsWith("/admin")) {
          const isAdminAuthenticated = localStorage.getItem('isAdminAuthenticated');
          
          if (isAdminAuthenticated === 'true') {
            router.replace("/admin");
          } else {
            setIsLoading(false);
          }
        }
        return;
      }
      
      // Prevent tenant/manager role conflicts
      if (
        (userRole === "manager" && pathname.startsWith("/tenants")) ||
        ((userRole === "tenant" || userRole === "student") && pathname.startsWith("/managers"))
      ) {
        router.replace(
          userRole === "manager"
            ? "/managers/properties"
            : "/tenants/favorites"
        );
      } else {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [user, router, pathname]);

  const { theme } = useTheme();
  const isDark = theme === "dark";

  if (authLoading || isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated || !user) {
    return (
      <div
        className={cn(
          "min-h-screen w-full flex items-center justify-center px-4 py-16",
          isDark ? "bg-slate-950" : "bg-slate-50"
        )}
      >
        <div
          className={cn(
            "max-w-md w-full space-y-4 rounded-2xl border p-8 text-center shadow-sm",
            isDark
              ? "bg-slate-900 border-slate-800 text-slate-100"
              : "bg-white border-slate-200 text-slate-900"
          )}
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
            <LogIn className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Sign in required</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              You need to be signed in to view your dashboard.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
            <a
              href="/signin"
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
            >
              Go to sign in
            </a>
            <a
              href="/signup"
              className="text-sm font-medium text-blue-600 underline-offset-4 hover:underline dark:text-blue-400"
            >
              Create account
            </a>
          </div>
        </div>
      </div>
    );
  }
  
  // Redirect admin users to admin dashboard
  if (user.role?.toLowerCase() === "admin") {
    router.push("/admin");
    return null;
  }

  const userRole = user.role?.toLowerCase() as "tenant" | "manager" | "student";
  const displayRole = userRole === "student" ? "tenant" : userRole;

  return (
    <SidebarProvider>
      <DashboardContent userRole={displayRole as "tenant" | "manager"}>
        {children}
      </DashboardContent>
    </SidebarProvider>
  );
};

// Main layout component with Suspense wrapper
const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
};

// Separate component to use the sidebar context
const DashboardContent = ({ userRole, children }: { userRole: "tenant" | "manager", children: React.ReactNode }) => {
  const { open, setOpen } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768 && open) {
        setOpen(false);
      }
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, [open, setOpen]);
  
  return (
    <div className={cn(
      "min-h-screen w-full",
      isDark ? "bg-slate-950" : "bg-slate-50"
    )}>
  <DashboardNavbar />
      <div style={{ paddingTop: `${NAVBAR_HEIGHT}px` }}>
        <div className="flex relative">
          {isMobile && open && (
            <div 
              className="fixed inset-0 bg-black/50 z-30 backdrop-blur-sm" 
              onClick={() => setOpen(false)}
            />
          )}
          
          <div className="sticky top-0 h-[calc(100vh-var(--navbar-height))] z-40">
            <Sidebar userType={userRole} />
          </div>
          
          <div 
            className={cn(
              "flex-grow transition-all duration-300 ease-in-out p-3 sm:p-4 md:p-6 overflow-x-hidden",
              isDark ? "text-slate-50" : "text-slate-900"
            )}
            style={{
              '--navbar-height': `${NAVBAR_HEIGHT}px`,
              marginLeft: isMobile ? 0 : (open ? 'var(--sidebar-width)' : 'var(--sidebar-width-icon)'),
            } as React.CSSProperties}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
