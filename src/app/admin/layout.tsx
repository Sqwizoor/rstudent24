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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: authUser, isLoading } = useGetAuthUserQuery();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== '/admin-login') {
      localStorage.setItem('adminIntendedPath', pathname);
    }
    
    const isAdminAuthenticated = localStorage.getItem('isAdminAuthenticated') === 'true';
    
    if (!isLoading && authUser) {
      const isAdmin = authUser.userRole === "admin";
      if (!isAdmin) {
        localStorage.removeItem('isAdminAuthenticated');
        router.replace("/");
      } else {
        localStorage.setItem('isAdminAuthenticated', 'true');
      }
    } else if (!isLoading && !authUser) {
      if (!isAdminAuthenticated && pathname !== '/admin-login') {
        router.replace("/admin-login");
      }
    }
  }, [authUser, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#000000] text-zinc-100">
        <div className="w-10 h-10 border-2 border-zinc-800 border-t-white rounded-full animate-spin"></div>
        <p className="mt-3 text-xs font-mono tracking-widest text-zinc-500 uppercase">Loading Admin Console...</p>
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
    <div className="dark min-h-screen w-full bg-[#000000] text-zinc-100 selection:bg-zinc-800">
      <AdminNavbar />
      <div style={{ paddingTop: `${NAVBAR_HEIGHT}px` }}>
        <div className="flex">
          {/* Vercel Dark Sidebar */}
          <aside
            className="w-64 h-[calc(100vh-var(--navbar-height))] sticky top-0 overflow-y-auto border-r border-zinc-800/80 bg-[#09090b]/95 backdrop-blur-xl p-3 flex flex-col justify-between"
          >
            <div>
              <div className="px-3 py-3 flex items-center gap-2 border-b border-zinc-800/80 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200">Admin Control</h2>
                  <span className="text-[10px] text-zinc-500 font-mono">System v2.4</span>
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
                          ? "bg-zinc-800 text-white border border-zinc-700/60 shadow-sm shadow-black/40"
                          : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/80 border border-transparent"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-white" : "text-zinc-400")} />
                      <span className="text-[13px] tracking-wide">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="p-3 rounded-xl border border-zinc-800/80 bg-zinc-950/60 text-[11px] text-zinc-500">
              <p className="font-semibold text-zinc-300">Admin Session</p>
              <p className="truncate mt-0.5">{authUser?.userInfo?.email || "admin@student24.co"}</p>
            </div>
          </aside>
          
          {/* Main content */}
          <main 
            className="flex-1 p-6 sm:p-8 overflow-auto text-zinc-100"
            style={{ height: `calc(100vh - ${NAVBAR_HEIGHT}px)` }}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
