"use client";

import { useSession } from "next-auth/react";
import { useGetAuthUserQuery } from "@/state/api";

export interface UnifiedUser {
  id: string;
  name: string;
  email: string;
  role: "tenant" | "manager" | "admin";
  provider: "cognito" | "google";
  userInfo?: any;
  cognitoInfo?: any;
}

export function useUnifiedAuth() {
  // Get NextAuth session (for Google auth)
  const { data: nextAuthSession, status: nextAuthStatus } = useSession();
  
  // Get Cognito session (for landlords/managers)
  const { data: cognitoUser, isLoading: cognitoLoading, error: cognitoError } = useGetAuthUserQuery();

  // Determine which auth method is active
  const isNextAuthActive = nextAuthSession && nextAuthStatus === "authenticated";
  const isCognitoActive = cognitoUser && !cognitoError;

  // Return unified user object
  if (isNextAuthActive && nextAuthSession.user) {
    return {
      user: {
        id: nextAuthSession.user.email || "", // Use email as ID for Google users
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
    return {
      user: {
        id: cognitoUser.cognitoInfo.userId || "",
        name: cognitoUser.userInfo.name || "",
        email: cognitoUser.userInfo.email || "",
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
