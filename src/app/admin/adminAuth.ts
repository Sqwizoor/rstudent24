"use client";

import { signOut, signIn } from "next-auth/react";
import { isExplicitAdminEmail } from "@/lib/constants";

// Admin authentication constants
const ADMIN_STORAGE_KEY = 'admin_auth_state';
const ADMIN_TOKEN_KEY = 'admin_id_token';

/**
 * Configure admin auth (No-op: AWS Amplify is removed, authentication handled via NextAuth)
 */
export function configureAdminAuth() {
  // No-op for backwards compatibility
}

/**
 * Store admin authentication state
 */
export function setAdminAuthState(adminData: any) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(adminData));
  } catch (error) {
    console.error("Failed to store admin auth state:", error);
  }
}

/**
 * Get stored admin authentication state
 */
export function getAdminAuthState() {
  if (typeof window === 'undefined') return null;
  try {
    const adminDataString = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!adminDataString) return null;
    return JSON.parse(adminDataString);
  } catch (error) {
    return null;
  }
}

/**
 * Clear admin authentication state
 */
export function clearAdminAuthState() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch (error) {
    console.error("Failed to clear admin auth state:", error);
  }
}

/**
 * Login as admin using NextAuth
 */
export async function loginAsAdmin(email: string, password: string) {
  try {
    const cleanEmail = email.toLowerCase().trim();
    if (!isExplicitAdminEmail(cleanEmail)) {
      return {
        success: false,
        message: "This email is not authorized for administrator access",
        data: null
      };
    }

    const result = await signIn("credentials", {
      email: cleanEmail,
      password,
      redirect: false
    });

    if (result?.error) {
      return {
        success: false,
        message: result.error,
        data: null
      };
    }

    const adminDetails = {
      id: 0,
      cognitoId: cleanEmail,
      name: cleanEmail.split('@')[0],
      email: cleanEmail,
      role: 'admin',
      tokenExpires: 0
    };

    setAdminAuthState(adminDetails);

    return {
      success: true,
      message: "Admin login successful",
      data: adminDetails
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Login failed",
      data: null
    };
  }
}

/**
 * Logout admin user
 */
export async function logoutAdmin() {
  try {
    clearAdminAuthState();
    await signOut({ callbackUrl: "/signin" });
    return {
      success: true,
      message: "Logged out successfully"
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Logout failed"
    };
  }
}

/**
 * Check if current user is authenticated as admin
 */
export async function checkAdminAuth() {
  try {
    const res = await fetch('/api/auth/session');
    if (!res.ok) {
      clearAdminAuthState();
      return { isAuthenticated: false, adminData: null };
    }

    const session = await res.json();
    const userEmail = (session?.user?.email || '').toLowerCase().trim();

    if (userEmail && isExplicitAdminEmail(userEmail)) {
      const adminDetails = {
        id: 0,
        cognitoId: session.user.id || userEmail,
        name: session.user.name || userEmail.split('@')[0],
        email: userEmail,
        role: 'admin',
        tokenExpires: 0
      };

      setAdminAuthState(adminDetails);
      return { isAuthenticated: true, adminData: adminDetails };
    }

    clearAdminAuthState();
    return { isAuthenticated: false, adminData: null };
  } catch (error) {
    clearAdminAuthState();
    return { isAuthenticated: false, adminData: null };
  }
}
