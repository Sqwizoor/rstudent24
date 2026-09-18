"use client";

import { useGetAuthUserQuery } from "@/state/api";
import "./theme.css";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { NAVBAR_HEIGHT } from "@/lib/constants";
import AdminNavbar from "@/components/AdminNavbar";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  GraduationCap, 
  Building2, 
  Home, 
  BarChart, 
  Users,
  Settings,
  FileText,
  LineChart,
  ShieldCheck
} from "lucide-react";

import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: authUser, isLoading: rtkLoading } = useGetAuthUserQuery();
  const { user: unifiedUser, isLoading: unifiedLoading } = useUnifiedAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isLoading = rtkLoading && unifiedLoading;
  const activeUser = authUser || unifiedUser;

  useEffect(() => {
    localStorage.setItem('isAdminAuthenticated', 'true');
    if (!isLoading && activeUser) {
      const userRole = ((activeUser as any)?.role || (activeUser as any)?.userRole || "").toLowerCase();
      const email = ((activeUser as any)?.email || (activeUser as any)?.userInfo?.email || "").toLowerCase();
      const isAdmin = userRole === "admin" || 
                      email.includes("admin") || 
                      email.includes("sqwizoor") || 
                      email.includes("banele") || 
                      email.endsWith("@student24.co.za");
      if (!isAdmin) {
        router.replace("/");
      }
    } else if (!isLoading && !activeUser) {
      router.replace("/signin?callbackUrl=/admin");
    }
  }, [activeUser, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-[#000000] text-slate-800 dark:text-zinc-100 transition-colors">
        <div className="w-10 h-10 border-2 border-slate-300 dark:border-zinc-800 border-t-slate-800 dark:border-t-white rounded-full animate-spin"></div>
        <p className="mt-3 text-xs font-mono tracking-widest text-slate-500 dark:text-zinc-500 uppercase">Loading Admin Console...</p>
      </div>
    );
  }

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Students", href: "/admin/students", icon: GraduationCap },
    { label: "Applications", href: "/admin/applications", icon: FileText },
    { label: "Landlords", href: "/admin/landlords", icon: Building2 },
    { label: "Properties", href: "/admin/properties", icon: Home },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart },
    { label: "Traffic", href: "/admin/traffic", icon: LineChart },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="admin-portal min-h-screen w-full bg-slate-50 dark:bg-[#000000] text-slate-900 dark:text-zinc-100 selection:bg-blue-100 dark:selection:bg-zinc-800 transition-colors duration-300">
      <AdminNavbar />
      <div style={{ paddingTop: `${NAVBAR_HEIGHT}px` }}>
        <div className="flex">
          {/* Dual-mode Sidebar */}
          <aside
            className="w-64 h-[calc(100vh-var(--navbar-height))] sticky top-0 overflow-y-auto border-r border-slate-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-xl p-3 flex flex-col justify-between transition-colors"
          >
            <div>
              <div className="px-3 py-3 flex items-center gap-2 border-b border-slate-200/80 dark:border-zinc-800/80 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-200">Admin Control</h2>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-mono">System v2.4</span>
                </div>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 gap-3",
                        isActive
                          ? "bg-slate-900 text-white dark:bg-zinc-800 dark:text-white border border-slate-800 dark:border-zinc-700/60 shadow-sm"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900/80 border border-transparent"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-white" : "text-slate-500 dark:text-zinc-400")} />
                      <span className="text-[13px] tracking-wide">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="p-3 rounded-xl border border-slate-200/80 dark:border-zinc-800/80 bg-slate-100/70 dark:bg-zinc-950/60 text-[11px] text-slate-500 dark:text-zinc-500 transition-colors">
              <p className="font-semibold text-slate-700 dark:text-zinc-300">Admin Session</p>
              <p className="truncate mt-0.5">{authUser?.userInfo?.email || "admin@student24.co"}</p>
            </div>
          </aside>
          
          {/* Main content */}
          <main 
            className="flex-1 p-6 sm:p-8 overflow-auto text-slate-900 dark:text-zinc-100 transition-colors"
            style={{ height: `calc(100vh - ${NAVBAR_HEIGHT}px)` }}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
