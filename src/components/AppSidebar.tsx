"use client";

import { usePathname } from "next/navigation";
import React, { useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar";
import {
  Building2,
  LayoutDashboard,
  FileText,
  Heart,
  Home,
  Users,
  Settings,
  CreditCard,
  LogOut,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { NAVBAR_HEIGHT } from "@/lib/constants";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { signOut as nextAuthSignOut } from "next-auth/react";

type AppSidebarProps = {
  userType: "manager" | "tenant";
};

const AppSidebar = ({ userType }: AppSidebarProps) => {
  const pathname = usePathname();
  const { toggleSidebar, open, setOpen } = useSidebar();

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && open) {
        setOpen(false);
      }
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [open, setOpen]);

  // Define navigation links based on user type
  const managerLinks = [
    { icon: LayoutDashboard, label: "Overview", href: "/managers/dashboard" },
    { icon: Building2, label: "Properties", href: "/managers/properties" },
    { icon: FileText, label: "Applications", href: "/managers/applications" },
    { icon: Users, label: "Tenants", href: "/managers/tenants" },
  ];

  const tenantLinks = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/tenants/dashboard" },
    { icon: Heart, label: "Favorites", href: "/tenants/favorites" },
    { icon: Home, label: "Residences", href: "/tenants/residences" },
    { icon: FileText, label: "Applications", href: "/tenants/applications" },
  ];
  
  const bottomLinks = [
    { icon: Settings, label: "Settings", href: `/${userType}s/settings` },
  ];

  const navLinks = userType === "manager" ? managerLinks : tenantLinks;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  return (
    <Sidebar
      collapsible="icon"
      className="fixed left-0 z-50 border-r border-slate-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-[#121417]/95 backdrop-blur-xl transition-all duration-300 ease-in-out transform-gpu text-slate-700 dark:text-zinc-300 shadow-sm"
      style={{
        top: `${NAVBAR_HEIGHT}px`,
        height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
        width: open ? 'var(--sidebar-width)' : 'var(--sidebar-width-icon)',
        transform: isMobile ? (open ? 'translateX(0)' : 'translateX(-100%)') : 'none',
      }}
    >
      <SidebarHeader className="relative z-10 pt-4 pb-2 px-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <div
              className={cn(
                "flex w-full items-center",
                open ? "justify-between px-2" : "justify-center"
              )}
            >
              {open && (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <span className="font-semibold text-xs tracking-wider uppercase text-slate-500 dark:text-zinc-400 font-mono">
                    {userType} Workspace
                  </span>
                </div>
              )}
              <button
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-100/80 dark:bg-zinc-900/80 text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                onClick={toggleSidebar}
                aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
              >
                <ChevronRight size={14} className={cn("transition-transform duration-200", open ? "rotate-180" : "rotate-0")} />
              </button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="relative z-10 px-3 pt-2 pb-4 flex flex-col justify-between h-full">
        <SidebarMenu>
          {/* Main navigation links */}
          <div className="space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/managers/dashboard" && link.href !== "/tenants/dashboard" && pathname.startsWith(link.href));
              const IconComponent = link.icon;
              return (
                <SidebarMenuItem key={link.href}>
                  <Link href={link.href} passHref scroll={false}>
                    <SidebarMenuButton
                      isActive={isActive}
                      size="default"
                      className={cn(
                        "rounded-xl px-3 py-2 text-xs font-medium transition-all duration-150 group relative flex items-center gap-3",
                        isActive
                          ? "bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white border border-slate-200 dark:border-zinc-700/60 shadow-sm"
                          : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100/70 dark:hover:bg-zinc-800/60 border border-transparent"
                      )}
                    >
                      <IconComponent size={16} className={cn("shrink-0 transition-colors", isActive ? "text-blue-600 dark:text-white" : "text-slate-400 dark:text-zinc-400 group-hover:text-slate-700 dark:group-hover:text-zinc-200")} />
                      <span className="text-[13px] tracking-wide">{link.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              );
            })}
          </div>
        </SidebarMenu>

        <SidebarMenu className="pt-4 border-t border-slate-200/80 dark:border-zinc-800/80 space-y-1">
          {bottomLinks.map((link) => {
            const isActive = pathname === link.href;
            const IconComponent = link.icon;
            return (
              <SidebarMenuItem key={link.href}>
                <Link href={link.href} passHref scroll={false}>
                  <SidebarMenuButton
                    isActive={isActive}
                    size="default"
                    className={cn(
                      "rounded-xl px-3 py-2 text-xs font-medium transition-all duration-150 group flex items-center gap-3",
                      isActive
                        ? "bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white border border-slate-200 dark:border-zinc-700/60"
                        : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100/70 dark:hover:bg-zinc-800/60 border border-transparent"
                    )}
                  >
                    <IconComponent size={16} className={cn("shrink-0", isActive ? "text-blue-600 dark:text-white" : "text-slate-400 dark:text-zinc-400 group-hover:text-slate-700 dark:group-hover:text-zinc-200")} />
                    <span className="text-[13px] tracking-wide">{link.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            );
          })}
          
          <SidebarMenuItem>
            <SidebarMenuButton
              size="default"
              className="rounded-xl px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-transparent transition-all flex items-center gap-3 cursor-pointer"
              onClick={() => nextAuthSignOut({ callbackUrl: "/" })}
            >
              <LogOut size={16} className="shrink-0 text-rose-500 dark:text-rose-400" />
              <span className="text-[13px] tracking-wide">Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
