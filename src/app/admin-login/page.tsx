"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, confirmSignIn, signOut, fetchAuthSession } from "aws-amplify/auth";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Mail } from "lucide-react";
import { configureAdminAuth } from "../admin/adminAuth";

// Admin login is handled through a separate login flow
// While using the same user pool, this provides a dedicated admin authentication experience

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPasswordField, setShowNewPasswordField] = useState(false);
  const router = useRouter();
  
  // Configure admin authentication on component mount and check if already authenticated
  useEffect(() => {
    configureAdminAuth();
    
    // Parse URL parameters to get intended destination
    const searchParams = new URLSearchParams(window.location.search);
    const fromPath = searchParams.get('from') || '/admin';
    const errorParam = searchParams.get('error');
    
    // Show error message if present in URL
    if (errorParam) {
      if (errorParam === 'auth') {
        toast.error("Authentication required for admin area");
      } else if (errorParam === 'no_session') {
        toast.error("Your session has expired. Please log in again");
      } else if (errorParam === 'not_admin') {
        toast.error("You don't have admin privileges");
      }
    }
    
    // Check if user is already authenticated as admin
    const checkAuth = async () => {
      try {
        // Import the enhanced admin authentication system
        const { checkAdminAuth } = await import('../admin/adminAuth');
        const { isAuthenticated } = await checkAdminAuth();
        
        // If already authenticated as admin, redirect to admin dashboard
        if (isAuthenticated) {
          console.log("✅ Already authenticated as admin, redirecting to:", fromPath);
          router.replace(fromPath);
        }
      } catch (error) {
        // Not authenticated, stay on login page
        console.log("❌ Not authenticated as admin", error);
      }
    };
    
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Import the enhanced admin authentication system
      const { loginAsAdmin } = await import('../admin/adminAuth');
      
      // Use our enhanced admin login function
      const result = await loginAsAdmin(email, password);
      
      if (result.success) {
        // Get intended destination from URL parameters
        const searchParams = new URLSearchParams(window.location.search);
        const fromPath = searchParams.get('from') || '/admin';
        
        // Show success message
        toast.success(result.message || "Admin login successful");
        
        // Get the token from the session to store in cookie
        try {
          const session = await fetchAuthSession();
          const token = session.tokens?.idToken?.toString();
          
          if (token) {
            // Call an API endpoint to set the cookie securely
            await fetch('/api/admin/set-auth-cookie', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token })
            });
            
            console.log("✅ Admin auth cookie set successfully");
          }
        } catch (cookieError) {
          console.error('❌ Failed to set admin auth cookie:', cookieError);
        }
        
        // Log success details
        console.log("✅ Admin login successful - redirecting to:", {
          destination: fromPath,
        });
        
        // Give a brief delay to ensure cookie is set
        setTimeout(() => {
          // Use direct navigation to ensure context is refreshed
          window.location.href = fromPath;
        }, 300);
        return;
      } 
      else {
        // Login failed
        toast.error(result.message || "Login failed");
        console.error("❌ Admin login failed:", result.message);
        
        // If it's a password-related issue
        if (result.message?.includes("password")) {
          setShowNewPasswordField(true);
        } else {
          toast.error("Login failed");
        }
      }
    } catch (error: any) {
      console.error("Admin login error:", error);
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleNewPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword) {
      toast.error("Please enter a new password");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Confirm sign in with new password
      const confirmResult = await confirmSignIn({
        challengeResponse: newPassword
      });
      
      console.log("Confirm sign in result:", confirmResult);
      
      if (confirmResult.isSignedIn) {
        toast.success("Password updated and login successful");
        router.push("/admin");
      } else {
        toast.error("Failed to update password");
      }
    } catch (error) {
      console.error("Password update error:", error);
      toast.error("Failed to update password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md shadow-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="mb-4">
            <picture>
              <source srcSet="/student24-logo.avif" type="image/avif" />
              <source srcSet="/student24-logo.webp" type="image/webp" />
              <Image 
                src="/student24-logo-optimized.png" 
                alt="Student24 Logo" 
                width={120} 
                height={28} 
                className="" 
                priority
              />
            </picture>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Admin Access</CardTitle>
          <CardDescription className="text-center">
            Secure login for system administrators only
          </CardDescription>
        </CardHeader>
        {!showNewPasswordField ? (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">

              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Admin Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Admin Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="mt-4">
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 bg-white/30 rounded animate-pulse"></div>
                    Authenticating...
                  </>
                ) : (
                  "Access Admin Dashboard"
                )}
              </Button>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleNewPasswordSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                  You need to set a new password for your admin account.
                </p>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="mt-4">
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 bg-white/30 rounded animate-pulse"></div>
                    Updating Password...
                  </>
                ) : (
                  "Set New Password"
                )}
              </Button>
            </CardFooter>
          </form>
        )}
        <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>This page is for authorized administrators only.</p>
          <p className="mt-2">
            Need an admin account? <a href="/admin-signup" className="text-blue-600 hover:underline">Register here</a>
          </p>
          <div className="mt-4 flex justify-center">
            <picture>
              <source srcSet="/student24-logo.avif" type="image/avif" />
              <source srcSet="/student24-logo.webp" type="image/webp" />
              <Image 
                src="/student24-logo-optimized.png" 
                alt="Student24 Logo" 
                width={120} 
                height={28} 
                className="opacity-70 dark:opacity-50" 
                loading="lazy"
              />
            </picture>
          </div>
        </div>
      </Card>
    </div>
  );
}
