"use client";

import { Amplify } from "aws-amplify";
import { type ResourcesConfig } from "aws-amplify";
import { fetchAuthSession, getCurrentUser, signIn, signOut } from "aws-amplify/auth";

// Admin authentication constants
const ADMIN_STORAGE_KEY = 'admin_auth_state';
const ADMIN_TOKEN_KEY = 'admin_id_token';
let isAdminAuthConfigured = false;

/**
 * Configure Amplify for admin authentication
 * This uses the same Cognito pool but isolates the authentication flow
 */
export function configureAdminAuth() {
  if (isAdminAuthConfigured) return;
  
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID!,
        userPoolClientId: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID!,
        loginWith: {
          email: true,
          username: true,
          phone: false,
        }
      },
      // Ensure consistent storage across admin section
      ssr: true
    }
  } as ResourcesConfig);
  
  isAdminAuthConfigured = true;
  console.log("✅ Admin authentication configured");
}

/**
 * Store admin authentication state
 */
export function setAdminAuthState(adminData: any) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(adminData));
    console.log("✅ Admin auth state stored");
  } catch (error) {
    console.error("❌ Failed to store admin auth state:", error);
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
    console.error("❌ Failed to retrieve admin auth state:", error);
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
    console.log("✅ Admin auth state cleared");
  } catch (error) {
    console.error("❌ Failed to clear admin auth state:", error);
  }
}

/**
 * Login as admin
 */
export async function loginAsAdmin(email: string, password: string) {
  try {
    // Ensure admin auth is configured
    configureAdminAuth();
    
    // First sign out any existing user
    try {
      await signOut();
    } catch (signOutError) {
      // Ignore sign out errors and continue
    }
    
    // Attempt to sign in
    const signInResult = await signIn({
      username: email,
      password,
    });
    
    if (!signInResult.isSignedIn) {
      return {
        success: false,
        message: "Sign in failed",
        data: null
      };
    }
    
    // Verify admin role
    const session = await fetchAuthSession();
    const userRole = session.tokens?.idToken?.payload?.['custom:role'] as string;
    const userEmail = session.tokens?.idToken?.payload?.email as string;
    
    // Check if user is admin
    const isAdmin = userRole === 'admin' || 
                   (userEmail && userEmail.toLowerCase() === 'admin@student24.co.za');
    
    if (!isAdmin) {
      // Not an admin, sign out and return error
      await signOut();
      return {
        success: false,
        message: "You don't have admin privileges",
        data: null
      };
    }
    
    // Fetch complete admin details
    const user = await getCurrentUser();
    
    // Get username from Cognito
    const username = user.username;
    
    // Create a friendly display name
    // If username follows admin_timestamp pattern, use email or 'Administrator'
    let displayName = session.tokens?.idToken?.payload?.name as string;
    if (!displayName || displayName.startsWith('Admin_')) {
      if (userEmail) {
        // Use email without domain and properly capitalized
        displayName = userEmail.split('@')[0]
          .replace(/\./g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());
      } else {
        displayName = 'Administrator';
      }
    }
    
    const adminDetails = {
      id: 0,
      cognitoId: user.userId,
      name: displayName,
      email: userEmail,
      role: 'admin',
      tokenExpires: session.tokens?.idToken?.payload?.exp as number || 0
    };
    
    // Store admin authentication state
    setAdminAuthState(adminDetails);
    
    // Return success
    return {
      success: true,
      message: "Admin login successful",
      data: adminDetails
    };
  } catch (error: any) {
    console.error("❌ Admin login error:", error);
    return {
      success: false,
      message: error.message || "Login failed",
      data: null
    };
  }
}

/**
 * Logout admin user
 */
export async function logoutAdmin() {
  try {
    await signOut();
    clearAdminAuthState();
    return {
      success: true,
      message: "Logged out successfully"
    };
  } catch (error) {
    console.error("❌ Admin logout error:", error);
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
    // First check local storage for stored admin state
    const storedAdminData = getAdminAuthState();
    
    // If token is expired, clear auth state and return false
    if (storedAdminData?.tokenExpires) {
      const now = Math.floor(Date.now() / 1000);
      if (storedAdminData.tokenExpires < now) {
        console.log("❌ Admin token expired");
        clearAdminAuthState();
        return { isAuthenticated: false, adminData: null };
      }
    }
    
    // Try to get the current session from Cognito
    const session = await fetchAuthSession();
    if (!session?.tokens?.idToken) {
      clearAdminAuthState();
      return { isAuthenticated: false, adminData: null };
    }
    
    // Extract user information from token
    const userRole = session.tokens.idToken.payload?.['custom:role'] as string;
    const userEmail = session.tokens.idToken.payload?.email as string;
    
    // User is admin if they have the admin role or the specific admin email
    const isAdmin = userRole === 'admin' || 
                   (userEmail && userEmail.toLowerCase() === 'admin@student24.co.za');
    
    if (!isAdmin) {
      clearAdminAuthState();
      return { isAuthenticated: false, adminData: null };
    }
    
    // User is authenticated as admin
    // If we didn't have stored admin data, create it now
    if (!storedAdminData) {
      const user = await getCurrentUser();
      
      // Create a friendly display name
      // If username follows admin_timestamp pattern, use email or 'Administrator'
      let displayName = session.tokens.idToken.payload?.name as string;
      if (!displayName || displayName.startsWith('Admin_')) {
        if (userEmail) {
          // Use email without domain and properly capitalized
          displayName = userEmail.split('@')[0]
            .replace(/\./g, ' ')
            .replace(/\b\w/g, (c: string) => c.toUpperCase());
        } else {
          displayName = 'Administrator';
        }
      }
      
      const adminDetails = {
        id: 0,
        cognitoId: user.userId,
        name: displayName,
        email: userEmail,
        role: 'admin',
        tokenExpires: session.tokens.idToken.payload?.exp as number || 0
      };
      
      setAdminAuthState(adminDetails);
      return { isAuthenticated: true, adminData: adminDetails };
    }
    
    // Return stored admin data
    return { isAuthenticated: true, adminData: storedAdminData };
  } catch (error) {
    console.error("❌ Admin auth check error:", error);
    return { isAuthenticated: false, adminData: null };
  }
}
