"use client";

import Navbar from "@/components/Navbar";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import Sidebar from "@/components/AppSidebar";
import { NAVBAR_HEIGHT } from "@/lib/constants";
import React, { useEffect, useState } from "react";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useSignInRedirect } from "@/hooks/useSignInRedirect";
import { LogIn } from "lucide-react";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading: authLoading, isAuthenticated } = useUnifiedAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const { signinUrl, redirectToSignin } = useSignInRedirect();

  useEffect(() => {
    if (user) {
      const userRole = user.role?.toLowerCase();
      
      // Handle admin users
      if (userRole === "admin") {
        // Check if we're already in the admin section
        if (!pathname.startsWith("/admin")) {
          // Check if the admin is already authenticated in the admin section
          const isAdminAuthenticated = localStorage.getItem('isAdminAuthenticated');
          
          if (isAdminAuthenticated === 'true') {
            // Admin is already authenticated in the admin section, redirect there
            router.replace("/admin");
          } else {
            // Admin needs to authenticate in the admin section
            // This prevents automatic redirects that could cause loops
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

  // Access theme for loading screen
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Note: useUnifiedAuth doesn't return authError, so we can't check for 401 errors
  // This check is now removed since it's not applicable with the unified auth system
  const isAuthError = false;

  if (authLoading || isLoading)
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

  if (!user?.role) {
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
              {isAuthError
                ? "You need to be signed in to view your dashboard."
                : "We couldn’t confirm your session just yet. Please sign in again to continue."}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
            <button
              onClick={redirectToSignin}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
            >
              Go to sign in
            </button>
            <a
              href={signinUrl}
              className="text-sm font-medium text-blue-600 underline-offset-4 hover:underline dark:text-blue-400"
            >
              Trouble? open sign-in page
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

  // Map student role to tenant for UI display
  const userRole = user.role?.toLowerCase();
  const displayRole = (userRole === "student" ? "tenant" : userRole) as "tenant" | "manager";

  return (
    <SidebarProvider>
      <DashboardContent userRole={displayRole}>
        {children}
      </DashboardContent>
    </SidebarProvider>
  );
};

// Separate component to use the sidebar context
const DashboardContent = ({ userRole, children }: { userRole: "tenant" | "manager", children: React.ReactNode }) => {
  const { open, setOpen } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Check if device is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Auto-close sidebar on mobile
      if (window.innerWidth < 768 && open) {
        setOpen(false);
      }
    };
    
    // Check initially
    checkIsMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, [open, setOpen]);
  
  return (
      <div className={cn(
        "min-h-screen w-full",
        isDark ? "bg-slate-950" : "bg-slate-50"
      )}>
        <Navbar />
        <div style={{ paddingTop: `${NAVBAR_HEIGHT}px` }}>
          <div className="flex relative">
            {/* Mobile overlay - only visible when sidebar is open on mobile */}
            {isMobile && open && (
              <div 
                className="fixed inset-0 bg-black/50 z-30 backdrop-blur-sm" 
                onClick={() => setOpen(false)}
              />
            )}
            
            {/* Sidebar container */}
            <div className="sticky top-0 h-[calc(100vh-var(--navbar-height))] z-40">
              <Sidebar userType={userRole} />
            </div>
            
            {/* Main content that adjusts based on sidebar state */}
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
