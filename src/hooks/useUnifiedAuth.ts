"use client";

import { useSession } from "next-auth/react";

export interface UnifiedUser {
  id: string;
  name: string;
  email: string;
  role: "tenant" | "student" | "manager" | "admin";
  provider: "cognito" | "google";
  userInfo?: any;
  cognitoInfo?: any;
}

export function useUnifiedAuth() {
  const { data: nextAuthSession, status: nextAuthStatus } = useSession();

  const isLoading = nextAuthStatus === "loading";
  const isAuthenticated = nextAuthStatus === "authenticated" && !!nextAuthSession?.user;
  const isNextAuthActive = isAuthenticated;

  // Return unified user object
  if (isNextAuthActive && nextAuthSession.user) {
    // For NextAuth users, the ID should match what was stored as cognitoId during sign-in
    // The signIn callback uses: profile.sub || user.id || user.email
    // So we need to use the same priority order here
    const userId = (nextAuthSession.user as any)?.sub || 
                   (nextAuthSession.user as any)?.id || 
                   nextAuthSession.user.email || "";
    
    console.log('🔐 NextAuth user ID:', userId);
    
    return {
      user: {
        id: userId,
        name: nextAuthSession.user.name || "",
        email: nextAuthSession.user.email || "",
        role: (nextAuthSession.user as any).role || "tenant",
        provider: "google",
        userInfo: nextAuthSession.user,
      } as UnifiedUser,
      isLoading: false,
      isAuthenticated: true,
      provider: "google"
    };
  }

  return {
    user: null,
    isLoading,
    isAuthenticated: false,
    provider: null
  };
}
