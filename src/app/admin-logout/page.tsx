"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AdminLogout() {
  const router = useRouter();

  useEffect(() => {
    // Clear the admin session cookie
    document.cookie = "admin-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    
    // Show success message
    toast.success("Admin logged out successfully");
    
    // Redirect to admin login
    router.push("/admin-login");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-900">
      <div className="text-center">
        <div className="h-12 w-12 bg-purple-200 dark:bg-purple-800 rounded-full mx-auto mb-4 animate-pulse"></div>
        <h1 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Logging out...</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">You will be redirected shortly.</p>
      </div>
    </div>
  );
}
