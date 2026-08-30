"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

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
  const [cognitoUser, setCognitoUser] = useState<UnifiedUser | null>(null);
  const [isCognitoLoading, setIsCognitoLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function checkCognito() {
      try {
        const { getCurrentUser, fetchAuthSession } = await import("aws-amplify/auth");
        const user = await getCurrentUser();
        const session = await fetchAuthSession();
        const tokens = session.tokens;
        const idToken = tokens?.idToken;
        const role = (idToken?.payload?.["custom:role"] as any) || "manager";
        const email = (idToken?.payload?.email as string) || "";
        const name = (idToken?.payload?.name as string) || email.split("@")[0] || "User";
        
        if (isMounted && user) {
          setCognitoUser({
            id: user.userId,
            name: name,
            email: email,
            role: role,
            provider: "cognito",
            userInfo: user,
            cognitoInfo: { userId: user.userId, userRole: role },
          });
        }
      } catch {
        if (isMounted) setCognitoUser(null);
      } finally {
        if (isMounted) setIsCognitoLoading(false);
      }
    }
    
    if (nextAuthStatus !== "authenticated") {
      checkCognito();
    } else {
      setIsCognitoLoading(false);
    }
    
    return () => { isMounted = false; };
  }, [nextAuthStatus]);

  const isNextAuthActive = nextAuthStatus === "authenticated" && !!nextAuthSession?.user;
  const isLoading = nextAuthStatus === "loading" || (!isNextAuthActive && isCognitoLoading);

  // Return unified user object
  if (isNextAuthActive && nextAuthSession.user) {
    const userId = (nextAuthSession.user as any)?.id || 
                   (nextAuthSession.user as any)?.sub || 
                   nextAuthSession.user.email || "";
    
    return {
      user: {
        id: userId,
        name: nextAuthSession.user.name || "",
        email: nextAuthSession.user.email || "",
        role: (nextAuthSession.user as any).role || "manager",
        provider: "google",
        userInfo: nextAuthSession.user,
      } as UnifiedUser,
      isLoading: false,
      isAuthenticated: true,
      provider: "google"
    };
  }

  if (cognitoUser) {
    return {
      user: cognitoUser,
      isLoading: false,
      isAuthenticated: true,
      provider: "cognito"
    };
  }

  return {
    user: null,
    isLoading,
    isAuthenticated: false,
    provider: null
  };
}
