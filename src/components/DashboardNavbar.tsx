"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, LogOut, Search, Building2, ChevronDown, Plus, Sun, Moon } from "lucide-react";
import { signOut as cognitoSignOut } from "aws-amplify/auth";
import { signOut as nextAuthSignOut } from "next-auth/react";
import { useTheme } from "next-themes";

import { NAVBAR_HEIGHT } from "@/lib/constants";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const DashboardNavbar = () => {
  const { user, provider } = useUnifiedAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const { theme, resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const currentTheme = theme === "system" ? resolvedTheme : theme;
  const isDark = currentTheme === "dark";

  const rawRole = user?.role?.toLowerCase();
  const normalizedRole = rawRole === "student" ? "tenant" : rawRole;
  const roleLabel = normalizedRole ? normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1) : undefined;
  const dashboardHome =
    normalizedRole === "manager"
      ? "/managers/properties"
      : normalizedRole === "tenant"
        ? "/tenants/favorites"
        : "/";

  const userInfo: any = (user as any)?.userInfo || {};
  const cognitoInfo: any = (user as any)?.cognitoInfo || {};
  const fallbackEmail = user?.email || userInfo.email || cognitoInfo.email;

  const getDisplayName = () => {
    if (!user) return "User";
    const nameSources = [user.name, userInfo.name, cognitoInfo.name];
    for (const candidate of nameSources) {
      if (candidate && typeof candidate === "string") {
        const trimmed = candidate.trim();
        if (trimmed && !["manager", "tenant", "student", "admin"].includes(trimmed.toLowerCase())) {
          return trimmed;
        }
      }
    }
    const usernameSources = [userInfo.username, cognitoInfo.username];
    for (const candidate of usernameSources) {
      if (candidate && typeof candidate === "string") {
        const trimmed = candidate.trim();
        if (trimmed && !["manager", "tenant", "student", "admin"].includes(trimmed.toLowerCase())) {
          return trimmed;
        }
      }
    }
    if (fallbackEmail && typeof fallbackEmail === "string") {
      const localPart = fallbackEmail.split("@")[0];
      if (localPart) return localPart;
    }
    return "User";
  };

  const displayName = getDisplayName();
  const initials = (() => {
    if (!displayName || displayName === "User") return "U";
    const parts = displayName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    const firstChar = displayName[0];
    return firstChar ? firstChar.toUpperCase() : "U";
  })();

  const handleDashboardNavigate = () => {
    router.push(dashboardHome);
  };

  const handleSignOut = async () => {
    try {
      if (provider === "google") {
        await nextAuthSignOut({ redirect: false });
        router.push("/");
        return;
      }
      if (provider === "cognito") {
        await cognitoSignOut();
        router.push("/");
        return;
      }
      router.push("/signin");
    } catch (error) {
      console.error("Sign out error:", error);
      router.push("/");
    }
  };

  const showTenantSearch = normalizedRole === "tenant";
  const showManagerShortcut = normalizedRole === "manager";

  return (
    <header
      className="fixed top-0 left-0 z-[70] w-full border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-[#000000]/80 backdrop-blur-xl transition-colors duration-200"
      style={{ height: `${NAVBAR_HEIGHT}px` }}
    >
      <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6 text-slate-800 dark:text-zinc-100">
        <div className="flex items-center gap-3 sm:gap-4">
          <SidebarTrigger className="h-9 w-9 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-100/80 dark:bg-zinc-900/60 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white transition-colors" />
          <Link href={dashboardHome} className="flex items-center gap-2 transition opacity-90 hover:opacity-100">
            <picture>
              <source srcSet="/student24-logo.avif" type="image/avif" />
              <source srcSet="/student24-logo.webp" type="image/webp" />
              <Image
                src="/student24-logo-optimized.png"
                alt="Student24 logo"
                width={120}
                height={28}
                className="h-7 w-auto object-contain dark:brightness-110"
                priority
                loading="eager"
                quality={90}
                sizes="120px"
              />
            </picture>
          </Link>
          {roleLabel && (
            <span className="hidden sm:inline-flex items-center rounded-full border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900/90 px-3 py-0.5 text-xs font-medium text-slate-600 dark:text-zinc-300 tracking-wide">
              {roleLabel} Console
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {showTenantSearch && (
            <Button
              size="sm"
              className="hidden md:inline-flex rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-zinc-700 transition-all text-xs font-medium"
              onClick={() => router.push("/search")}
            >
              <Search className="mr-1.5 h-3.5 w-3.5 text-slate-500 dark:text-zinc-400" />
              Search listings
            </Button>
          )}
          {showManagerShortcut && (
            <Button
              size="sm"
              className="hidden md:inline-flex rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black font-semibold dark:hover:bg-zinc-200 transition-all shadow-sm text-xs"
              onClick={() => router.push("/managers/newproperty")}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New Property
            </Button>
          )}

          {/* Theme Toggle Button with Sun / Moon Icons */}
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2.5 rounded-full border border-slate-200 dark:border-zinc-800/80 bg-slate-100/80 dark:bg-zinc-900/60 pl-1.5 pr-3 py-1 text-left transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-200/80 dark:hover:bg-zinc-800/60"
              >
                <Avatar className="h-7 w-7 border border-slate-300 dark:border-zinc-700 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200">
                  <AvatarFallback className="text-xs font-bold uppercase text-slate-800 dark:text-zinc-100 bg-slate-200 dark:bg-zinc-800">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col leading-tight">
                  <span className="text-xs font-semibold text-slate-800 dark:text-zinc-100">{displayName}</span>
                  {roleLabel && (
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono capitalize">{roleLabel}</span>
                  )}
                </div>
                <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl p-1.5 text-slate-700 dark:text-zinc-200 shadow-xl">
              <div className="px-3 py-2.5">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">{displayName}</p>
                {fallbackEmail && (
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">{fallbackEmail}</p>
                )}
              </div>
              <DropdownMenuSeparator className="bg-slate-200 dark:bg-zinc-800/80" />
              <DropdownMenuItem onSelect={handleDashboardNavigate} className="cursor-pointer rounded-lg text-xs py-2 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white focus:bg-slate-100 dark:focus:bg-zinc-800 focus:text-slate-900 dark:focus:text-white">
                <LayoutDashboard className="mr-2 h-4 w-4 text-slate-500 dark:text-zinc-400" />
                <span>Dashboard Home</span>
              </DropdownMenuItem>
              {showManagerShortcut && (
                <DropdownMenuItem
                  onSelect={() => router.push("/managers/newproperty")}
                  className="cursor-pointer rounded-lg text-xs py-2 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white focus:bg-slate-100 dark:focus:bg-zinc-800 focus:text-slate-900 dark:focus:text-white"
                >
                  <Building2 className="mr-2 h-4 w-4 text-slate-500 dark:text-zinc-400" />
                  <span>Add Property</span>
                </DropdownMenuItem>
              )}
              {showTenantSearch && (
                <DropdownMenuItem
                  onSelect={() => router.push("/search")}
                  className="cursor-pointer rounded-lg text-xs py-2 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white focus:bg-slate-100 dark:focus:bg-zinc-800 focus:text-slate-900 dark:focus:text-white"
                >
                  <Search className="mr-2 h-4 w-4 text-slate-500 dark:text-zinc-400" />
                  <span>Search Listings</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-slate-200 dark:bg-zinc-800/80" />
              <DropdownMenuItem
                onSelect={() => setTheme(isDark ? "light" : "dark")}
                className="cursor-pointer rounded-lg text-xs py-2 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white focus:bg-slate-100 dark:focus:bg-zinc-800 focus:text-slate-900 dark:focus:text-white"
              >
                {isDark ? (
                  <>
                    <Sun className="mr-2 h-4 w-4 text-amber-500" />
                    <span>Switch to White Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="mr-2 h-4 w-4 text-slate-500 dark:text-slate-400" />
                    <span>Switch to Dark Mode</span>
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-200 dark:bg-zinc-800/80" />
              <DropdownMenuItem
                onSelect={handleSignOut}
                className="cursor-pointer rounded-lg text-xs py-2 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 focus:bg-rose-50 dark:focus:bg-rose-950/30 focus:text-rose-700 dark:focus:text-rose-300"
              >
                <LogOut className="mr-2 h-4 w-4 text-rose-500 dark:text-rose-400" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default DashboardNavbar;
