"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminSignup() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/signin?callbackUrl=/admin");
  }, [router]);

  return null;
}
