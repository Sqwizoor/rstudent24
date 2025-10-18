"use client";

import { useSession } from "next-auth/react";
import { useGetAuthUserQuery } from "@/state/api";

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
  // Get NextAuth session (for Google auth)
  const { data: nextAuthSession, status: nextAuthStatus } = useSession();
  
  // Get Cognito session (for landlords/managers)
  // Skip Cognito query if NextAuth is already active to avoid unnecessary API calls
  const skipCognito = nextAuthStatus === "authenticated";
  const { data: cognitoUser, isLoading: cognitoLoading, error: cognitoError } = useGetAuthUserQuery(undefined, {
    skip: skipCognito
  });

  // DEBUG logging
  console.log('🔐 useUnifiedAuth state:', {
    nextAuthStatus,
    hasNextAuthSession: !!nextAuthSession,
    hasCognitoUser: !!cognitoUser,
    cognitoLoading,
    cognitoError: cognitoError ? String(cognitoError) : null,
    skipCognito
  });

  // Determine which auth method is active
  const isNextAuthActive = nextAuthSession && nextAuthStatus === "authenticated";
  const isCognitoActive = cognitoUser && !cognitoError;

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

  if (isCognitoActive && cognitoUser) {
    const dbEmail = (cognitoUser.userInfo as { email?: string })?.email;

    return {
      user: {
        id: cognitoUser.cognitoInfo.userId || "",
        name: cognitoUser.userInfo.name || "",
        email: cognitoUser.cognitoInfo?.email || dbEmail || "",
        role: cognitoUser.userRole,
        provider: "cognito",
        userInfo: cognitoUser.userInfo,
        cognitoInfo: cognitoUser.cognitoInfo,
      } as UnifiedUser,
      isLoading: false,
      isAuthenticated: true,
      provider: "cognito"
    };
  }

  return {
    user: null,
    isLoading: cognitoLoading || nextAuthStatus === "loading",
    isAuthenticated: false,
    provider: null
  };
}
