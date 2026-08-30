"use client";

import React, { useState, Suspense, useMemo } from 'react';
import { signIn } from "next-auth/react";
import { useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { GraduationCap, Building2, CheckCircle2 } from "lucide-react";

type RoleType = "student" | "landlord";

function SignUpContent() {
  const [role, setRole] = useState<RoleType>("student");
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get('callbackUrl');

  const callbackUrl = useMemo(() => {
    if (!rawCallback) {
      return role === "landlord" ? "/managers/properties" : "/tenants/residences";
    }

    const decodeValue = (value: string) => {
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    };

    const decoded = decodeValue(rawCallback);

    if (decoded.startsWith('/')) {
      return decoded || (role === "landlord" ? "/managers/properties" : "/tenants/residences");
    }

    if (typeof window !== 'undefined') {
      try {
        const currentOrigin = window.location.origin;
        const parsed = new URL(decoded, currentOrigin);
        if (parsed.origin === currentOrigin) {
          const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
          return path || (role === "landlord" ? "/managers/properties" : "/tenants/residences");
        }
      } catch {
        // ignore
      }
    }

    return role === "landlord" ? "/managers/properties" : "/tenants/residences";
  }, [rawCallback, role]);

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    console.log('🔐 Google sign-up triggered with role:', role, 'callbackUrl:', callbackUrl);

    try {
      // Set role preference cookie for NextAuth backend
      const targetRole = role === "landlord" ? "manager" : "tenant";
      document.cookie = `user_target_role=${targetRole}; path=/; max-age=3600; SameSite=Lax`;

      // Track sign-up attempt with PostHog
      posthog.capture('user_signed_up', {
        provider: 'google',
        user_type: targetRole,
      });

      // Trigger NextAuth Google OAuth
      await signIn("google", {
        callbackUrl: callbackUrl,
        redirect: true,
      });
    } catch (error) {
      console.error("Google sign-up error:", error);
      posthog.captureException(error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
        <CardHeader className="space-y-2 flex flex-col items-center text-center pb-4">
          <div className="mb-2">
            <picture>
              <source srcSet="/student24-logo.avif" type="image/avif" />
              <source srcSet="/student24-logo.webp" type="image/webp" />
              <Image 
                src="/student24-logo-optimized.png" 
                alt="Student24 Logo" 
                width={130} 
                height={30} 
                className="" 
                priority
              />
            </picture>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Create Account
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Choose your account type to sign up with Google
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Step 1: Select Role */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              1. I am registering as:
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Student Role Card */}
              <button
                type="button"
                onClick={() => setRole("student")}
                className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all text-center ${
                  role === "student"
                    ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-sm"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                }`}
              >
                {role === "student" && (
                  <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                )}
                <div className={`p-2.5 rounded-full mb-2 ${
                  role === "student" ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300" : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                }`}>
                  <GraduationCap className="h-6 w-6" />
                </div>
                <span className="font-semibold text-sm">Student</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                  Find & book student accommodation
                </span>
              </button>

              {/* Landlord Role Card */}
              <button
                type="button"
                onClick={() => setRole("landlord")}
                className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all text-center ${
                  role === "landlord"
                    ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-sm"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                }`}
              >
                {role === "landlord" && (
                  <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                )}
                <div className={`p-2.5 rounded-full mb-2 ${
                  role === "landlord" ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300" : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                }`}>
                  <Building2 className="h-6 w-6" />
                </div>
                <span className="font-semibold text-sm">Landlord</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                  Manage & list your properties
                </span>
              </button>
            </div>
          </div>

          {/* Step 2: Sign Up Action */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              2. Continue with your Google account:
            </label>
            <Button
              onClick={handleGoogleSignUp}
              disabled={isLoading}
              className="w-full h-12 text-base font-medium bg-white hover:bg-slate-50 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 border border-slate-300 dark:border-slate-600 shadow-sm transition-all"
              variant="outline"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-slate-400 border-t-blue-600 rounded-full animate-spin"></div>
                  <span>Creating account with Google...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Sign up as {role === "student" ? "Student" : "Landlord"}</span>
                </div>
              )}
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2 text-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          <p>
            Already have an account?{" "}
            <a href={`/signin${rawCallback ? `?callbackUrl=${encodeURIComponent(rawCallback)}` : ''}`} className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
              Sign in here
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="flex items-center justify-center py-12">
            <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </CardContent>
        </Card>
      </div>
    }>
      <SignUpContent />
    </Suspense>
  );
}
