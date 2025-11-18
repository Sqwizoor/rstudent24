"use client";

import { useTheme } from "next-themes";
import { useGetAuthUserQuery } from "@/state/api";
import "./theme.css"; // Import admin theme CSS
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { NAVBAR_HEIGHT } from "@/lib/constants";
import AdminNavbar from "@/components/AdminNavbar";
import { cn } from "@/lib/utils";
// Import icons for sidebar
import { 
  LayoutDashboard, 
  GraduationCap, 
  Building2, 
  Home, 
  BarChart, 
  Users,
  Settings,
  FileText
} from "lucide-react";

// Admin access is now controlled by the 'custom:role' attribute only

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Access theme for consistent styling - moved to the top to maintain hooks order
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  const { data: authUser, isLoading } = useGetAuthUserQuery();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Store the current path in case we need to redirect back after login
    if (pathname !== '/admin-login' && pathname !== '/admin-signup') {
      localStorage.setItem('adminIntendedPath', pathname);
    }
    
    // Check if the user is already marked as authenticated admin in localStorage
    const isAdminAuthenticated = localStorage.getItem('isAdminAuthenticated') === 'true';
    
    // Check if user is authenticated and is an admin
    if (!isLoading && authUser) {
      console.log('Admin layout - User info:', { 
        role: authUser.userRole, 
        email: authUser.userInfo?.email,
        cognitoId: authUser.cognitoInfo?.userId,
        isAdminAuthenticated
      });
      
      // Check if user has admin role
      const isAdmin = authUser.userRole === "admin";
      
      if (!isAdmin) {
        console.log('Not an admin user, redirecting to home');
        // Clear admin authentication flag
        localStorage.removeItem('isAdminAuthenticated');
        router.replace("/");
      } else {
        // Mark as authenticated admin
        localStorage.setItem('isAdminAuthenticated', 'true');
        console.log('Admin user confirmed, continuing to admin dashboard');
      }
    } else if (!isLoading && !authUser) {
      console.log('No authenticated user, checking localStorage flag:', isAdminAuthenticated);
      
      // If localStorage indicates admin is authenticated but authUser is null,
      // there might be a timing issue with the API - don't redirect immediately
      if (!isAdminAuthenticated) {
        console.log('No admin authentication in localStorage, redirecting to login');
        // Only redirect to login if we're not already on the login or signup page
        if (pathname !== '/admin-login' && pathname !== '/admin-signup') {
          router.replace("/admin-login");
        }
      } else {
        // There might be a timing issue - authUser is null but localStorage says we're authenticated
        // Wait a moment before deciding to redirect
        console.log('Potential timing issue - localStorage says admin is authenticated but authUser is null');
      }
    }
  }, [authUser, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-12 w-12 bg-blue-200 dark:bg-blue-800 rounded-full animate-pulse"></div>
      </div>
    );
  }

  // If not admin, don't render anything (will redirect)
  if (!authUser) {
    return null;
  }
  
  // Check if user has admin role or is using an admin email
  const isAdmin = 
    authUser.userRole === "admin" 
    
  if (!isAdmin) {
    return null;
  }

  // Theme is now accessed at the top of the component to maintain hooks order

  return (
    <div className={cn(
      "min-h-screen w-full",
      isDark ? "bg-slate-950" : "bg-slate-50"
    )}>
      <AdminNavbar />
      <div style={{ paddingTop: `${NAVBAR_HEIGHT}px` }}>
        <div className="flex">
          {/* Sidebar */}
          <div className={cn(
            "w-64 h-[calc(100vh-var(--navbar-height))] sticky top-0 overflow-y-auto border-r",
            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          )}>
            <div className="p-4">
              <h2 className={cn(
                "text-xl font-semibold",
                isDark ? "text-white" : "text-slate-800"
              )}>Admin Dashboard</h2>
            </div>
            <nav className="mt-2">
              <Link 
                href="/admin" 
                className={cn(
                  "flex items-center px-4 py-3 my-1 mx-2 rounded-md transition-colors",
                  pathname === "/admin" 
                    ? isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-700"
                    : isDark ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100"
                )}
              >
                <LayoutDashboard className="mr-3 h-5 w-5" />
                <span>Dashboard</span>
              </Link>
              <Link 
                href="/admin/students" 
                className={cn(
                  "flex items-center px-4 py-3 my-1 mx-2 rounded-md transition-colors",
                  pathname === "/admin/students" 
                    ? isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-700"
                    : isDark ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100"
                )}
              >
                <GraduationCap className="mr-3 h-5 w-5" />
                <span>Students</span>
              </Link>
              <Link 
                href="/admin/applications" 
                className={cn(
                  "flex items-center px-4 py-3 my-1 mx-2 rounded-md transition-colors",
                  pathname === "/admin/applications" 
                    ? isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-700"
                    : isDark ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100"
                )}
              >
                <FileText className="mr-3 h-5 w-5" />
                <span>Applications</span>
              </Link>
              <Link 
                href="/admin/landlords" 
                className={cn(
                  "flex items-center px-4 py-3 my-1 mx-2 rounded-md transition-colors",
                  pathname === "/admin/landlords" 
                    ? isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-700"
                    : isDark ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100"
                )}
              >
                <Building2 className="mr-3 h-5 w-5" />
                <span>Landlords</span>
              </Link>
              <Link 
                href="/admin/properties" 
                className={cn(
                  "flex items-center px-4 py-3 my-1 mx-2 rounded-md transition-colors",
                  pathname === "/admin/properties" 
                    ? isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-700"
                    : isDark ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100"
                )}
              >
                <Home className="mr-3 h-5 w-5" />
                <span>Properties</span>
              </Link>
              <Link 
                href="/admin/analytics" 
                className={cn(
                  "flex items-center px-4 py-3 my-1 mx-2 rounded-md transition-colors",
                  pathname === "/admin/analytics" 
                    ? isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-700"
                    : isDark ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100"
                )}
              >
                <BarChart className="mr-3 h-5 w-5" />
                <span>Analytics</span>
              </Link>
              <Link 
                href="/admin/settings" 
                className={cn(
                  "flex items-center px-4 py-3 my-1 mx-2 rounded-md transition-colors",
                  pathname === "/admin/settings" 
                    ? isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-700"
                    : isDark ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100"
                )}
              >
                <Settings className="mr-3 h-5 w-5" />
                <span>Settings</span>
              </Link>
            </nav>
          </div>
          
          {/* Main content */}
          <div 
            className={cn(
              "flex-1 p-6 overflow-auto",
              isDark ? "text-slate-50" : "text-slate-900"
            )}
            style={{ height: `calc(100vh - ${NAVBAR_HEIGHT}px)` }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
