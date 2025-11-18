"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, LogOut, Search, Building2, ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";
import { signOut as cognitoSignOut } from "aws-amplify/auth";
import { signOut as nextAuthSignOut } from "next-auth/react";

import { NAVBAR_HEIGHT } from "@/lib/constants";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
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
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
      className="fixed top-0 left-0 z-[70] w-full border-b"
      style={{ height: `${NAVBAR_HEIGHT}px` }}
    >
      <div
        className={cn(
          "flex h-full items-center justify-between gap-4 px-4 sm:px-6 transition-colors backdrop-blur-lg",
          isDark
            ? "bg-slate-900/95 border-slate-800 text-slate-100"
            : "bg-white/90 border-slate-200 text-slate-900"
        )}
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <SidebarTrigger className="h-10 w-10" />
          <Link href={dashboardHome} className="flex items-center gap-2">
            <picture>
              <source srcSet="/student24-logo.avif" type="image/avif" />
              <source srcSet="/student24-logo.webp" type="image/webp" />
              <Image
                src="/student24-logo-optimized.png"
                alt="Student24 logo"
                width={120}
                height={28}
                className="h-8 w-auto object-contain"
                priority
                loading="eager"
                quality={90}
                sizes="120px"
              />
            </picture>
          </Link>
          {roleLabel && (
            <span
              className={cn(
                "hidden sm:inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize",
                isDark
                  ? "border-[#00acee]/40 bg-[#00acee]/10 text-[#78d9ff]"
                  : "border-[#00acee]/20 bg-[#00acee]/10 text-[#007fb8]"
              )}
            >
              {roleLabel} dashboard
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {showTenantSearch && (
            <Button
              size="sm"
              className="hidden md:inline-flex bg-[#00acee] text-white hover:bg-[#0099d4]"
              onClick={() => router.push("/search")}
            >
              <Search className="mr-1.5 h-4 w-4" />
              Search listings
            </Button>
          )}
          {showManagerShortcut && (
            <Button
              size="sm"
              variant="outline"
              className="hidden md:inline-flex border-[#00acee] text-[#00acee] hover:bg-[#00acee] hover:text-white"
              onClick={() => router.push("/managers/newproperty")}
            >
              <Building2 className="mr-1.5 h-4 w-4" />
              Add property
            </Button>
          )}
          {isMounted && <ThemeToggle />}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex items-center gap-2 rounded-full border px-2 py-1.5 text-left transition-all duration-200",
                  isDark
                    ? "border-slate-700 bg-slate-900/80 hover:border-[#00acee]/40"
                    : "border-slate-200 bg-white/80 hover:border-[#00acee]/30"
                )}
              >
                <Avatar className="h-9 w-9 bg-[#00acee]/10 text-[#00acee]">
                  <AvatarFallback className="text-sm font-semibold uppercase text-[#00acee]">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col leading-tight">
                  <span className="text-sm font-semibold">{displayName}</span>
                  {roleLabel && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">{roleLabel}</span>
                  )}
                </div>
                <ChevronDown className="hidden sm:block h-4 w-4 text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <div className="px-3 py-2">
                <p className="text-sm font-medium">{displayName}</p>
                {fallbackEmail && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{fallbackEmail}</p>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleDashboardNavigate} className="cursor-pointer">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>View dashboard home</span>
              </DropdownMenuItem>
              {showManagerShortcut && (
                <DropdownMenuItem
                  onSelect={() => router.push("/managers/newproperty")}
                  className="cursor-pointer"
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  <span>Add property</span>
                </DropdownMenuItem>
              )}
              {showTenantSearch && (
                <DropdownMenuItem
                  onSelect={() => router.push("/search")}
                  className="cursor-pointer"
                >
                  <Search className="mr-2 h-4 w-4" />
                  <span>Search listings</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={handleSignOut}
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default DashboardNavbar;
