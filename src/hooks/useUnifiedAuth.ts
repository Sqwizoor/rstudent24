"use client";

import { useSession } from "next-auth/react";

export interface UnifiedUser {
  id: string;
  name: string;
  email: string;
  role: "tenant" | "student" | "manager" | "admin";
  provider: "google" | "credentials";
  userInfo?: any;
  cognitoInfo?: any;
}

export function useUnifiedAuth() {
  const { data: session, status } = useSession();

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated" && !!session?.user;

  if (isAuthenticated && session?.user) {
    const user = session.user as any;
    const userId = user.id || user.sub || user.email || "";
    const email = user.email || "";
    const name = user.name || (email ? email.split("@")[0] : "User");
    const role = user.role || "tenant";
    const provider = user.provider || "google";

    const unifiedUser: UnifiedUser = {
      id: userId,
      name,
      email,
      role,
      provider,
      userInfo: user,
      cognitoInfo: { userId, userRole: role, email },
    };

    return {
      user: unifiedUser,
      isLoading: false,
      isAuthenticated: true,
      provider,
    };
  }

  return {
    user: null,
    isLoading,
    isAuthenticated: false,
    provider: null,
  };
}
