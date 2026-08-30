"use client";

import DashboardNavbar from "@/components/DashboardNavbar";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import Sidebar from "@/components/AppSidebar";
import { NAVBAR_HEIGHT } from "@/lib/constants";
import React, { useEffect, useState, Suspense } from "react";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogIn, Sparkles } from "lucide-react";

// Vercel Dark Loading Screen
const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-[#000000] text-zinc-100">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-zinc-800 border-t-white animate-spin"></div>
        <div className="absolute w-6 h-6 rounded-full bg-blue-500/20 blur-md"></div>
      </div>
      <p className="text-xs font-mono uppercase tracking-widest text-zinc-400">
        Loading Dashboard...
      </p>
    </div>
  );
};

const DashboardLayoutContent = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading: authLoading, isAuthenticated } = useUnifiedAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const userRole = user.role?.toLowerCase();
      
      // Handle admin users
      if (userRole === "admin") {
        localStorage.setItem('isAdminAuthenticated', 'true');
        setIsLoading(false);
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

  if (authLoading || isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center px-4 py-16 bg-[#000000] text-zinc-100 selection:bg-zinc-800">
        {/* Subtle radial glow background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative max-w-md w-full rounded-2xl border border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl p-8 text-center shadow-2xl shadow-black/80 space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/80 text-zinc-100 shadow-inner">
            <LogIn className="h-6 w-6 text-zinc-200" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">Sign In Required</h2>
            <p className="text-sm text-zinc-400">
              You need to authenticate to access your dashboard and manage your accommodation.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <a
              href="/signin"
              className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition-all duration-200 hover:bg-zinc-200 hover:shadow-lg hover:shadow-white/10 active:scale-[0.98]"
            >
              Sign In to Continue
            </a>
            <a
              href="/signup"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              Create an Account
            </a>
          </div>
        </div>
      </div>
    );
  }
  
  // For admin users, allow access to both admin console and manager/tenant views
  const rawRole = user.role?.toLowerCase();
  const displayRole = rawRole === "admin" ? "manager" : (rawRole === "student" ? "tenant" : rawRole);

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
    <div className="dark min-h-screen w-full bg-[#000000] text-zinc-100 selection:bg-zinc-800">
      <DashboardNavbar />
      <div style={{ paddingTop: `${NAVBAR_HEIGHT}px` }}>
        <div className="flex relative">
          {isMobile && open && (
            <div 
              className="fixed inset-0 bg-black/80 z-30 backdrop-blur-sm" 
              onClick={() => setOpen(false)}
            />
          )}
          
          <div className="sticky top-0 h-[calc(100vh-var(--navbar-height))] z-40">
            <Sidebar userType={userRole} />
          </div>
          
          <div 
            className="flex-grow transition-all duration-300 ease-in-out p-4 sm:p-6 md:p-8 overflow-x-hidden text-zinc-100"
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
