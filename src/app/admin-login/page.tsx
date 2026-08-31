"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Redirect /admin-login to main /signin page
export default function AdminLoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/signin?callbackUrl=/admin");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center text-zinc-400 font-mono text-xs">
      Redirecting to Sign In...
    </div>
  );
}
