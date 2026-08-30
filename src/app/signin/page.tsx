"use client";

import React, { useState, Suspense, useMemo } from 'react';
import { signIn } from "next-auth/react";
import { useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { GraduationCap, Building2, CheckCircle2, Mail, Lock, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";

type RoleType = "student" | "landlord" | "admin";
type AuthMethod = "google" | "email";

function SignInContent() {
  const [role, setRole] = useState<RoleType>("student");
  const [method, setMethod] = useState<AuthMethod>("google");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const searchParams = useSearchParams();
  const rawCallback = searchParams.get('callbackUrl');

  const callbackUrl = useMemo(() => {
    if (!rawCallback) {
      if (role === "admin") return "/admin";
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
      return decoded;
    }

    if (typeof window !== 'undefined') {
      try {
        const currentOrigin = window.location.origin;
        const parsed = new URL(decoded, currentOrigin);
        if (parsed.origin === currentOrigin) {
          return `${parsed.pathname}${parsed.search}${parsed.hash}` || "/";
        }
      } catch {
        // ignore
      }
    }

    if (role === "admin") return "/admin";
    return role === "landlord" ? "/managers/properties" : "/tenants/residences";
  }, [rawCallback, role]);

  const targetRole = role === "landlord" ? "manager" : role;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      document.cookie = `user_target_role=${targetRole}; path=/; max-age=3600; SameSite=Lax`;

      posthog.capture('user_signed_in', {
        provider: 'google',
        user_type: targetRole,
      });

      await signIn("google", {
        callbackUrl: callbackUrl,
        redirect: true,
      });
    } catch (error) {
      console.error("Google sign-in error:", error);
      posthog.captureException(error);
      setIsLoading(false);
      toast.error("Google sign-in failed. Please try again.");
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      document.cookie = `user_target_role=${targetRole}; path=/; max-age=3600; SameSite=Lax`;

      posthog.capture('user_signed_in', {
        provider: 'email_credentials',
        user_type: targetRole,
      });

      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password: password,
        role: targetRole,
        callbackUrl: callbackUrl,
        redirect: true,
      });

      if (res?.error) {
        toast.error(res.error || "Failed to sign in with email");
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error("Email sign-in error:", error);
      toast.error(error?.message || "Sign in failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="dark min-h-screen bg-[#000000] text-zinc-100 flex items-center justify-center p-4 selection:bg-zinc-800">
      {/* Background glow orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-blue-500/5 blur-[140px] rounded-full pointer-events-none" />

      <Card className="relative w-full max-w-md rounded-2xl border border-zinc-800/80 bg-zinc-950/85 backdrop-blur-xl shadow-2xl shadow-black/80">
        <CardHeader className="space-y-3 flex flex-col items-center text-center pb-4 pt-7">
          <div className="mb-1">
            <picture>
              <source srcSet="/student24-logo.avif" type="image/avif" />
              <source srcSet="/student24-logo.webp" type="image/webp" />
              <Image 
                src="/student24-logo-optimized.png" 
                alt="Student24 Logo" 
                width={135} 
                height={32} 
                className="h-8 w-auto brightness-110" 
                priority
              />
            </picture>
          </div>
          <div>
            <CardTitle className="text-xl font-bold tracking-tight text-white">
              Welcome to Student24
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400 mt-1">
              Select your role and continue to your dashboard
            </CardDescription>
          </div>

          {/* Auth Method Tabs */}
          <div className="w-full grid grid-cols-2 p-1 bg-zinc-900/80 border border-zinc-800/80 rounded-xl mt-2">
            <button
              type="button"
              onClick={() => setMethod("google")}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                method === "google"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Google Sign In
            </button>
            <button
              type="button"
              onClick={() => setMethod("email")}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                method === "email"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Email Login
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 px-6">
          {/* Step 1: Select Role */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
              Select Account Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Student Role Card */}
              <button
                type="button"
                onClick={() => setRole("student")}
                className={`relative flex flex-col items-center p-3.5 rounded-xl border transition-all text-center ${
                  role === "student"
                    ? "border-zinc-500 bg-zinc-900 text-white shadow-sm shadow-black/50"
                    : "border-zinc-800/80 hover:border-zinc-700 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {role === "student" && (
                  <CheckCircle2 className="absolute top-2 right-2 h-3.5 w-3.5 text-blue-400" />
                )}
                <div className={`p-2 rounded-xl mb-1.5 ${
                  role === "student" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-zinc-900 text-zinc-500"
                }`}>
                  <GraduationCap className="h-5 w-5" />
                </div>
                <span className="font-semibold text-xs text-zinc-100">Student</span>
                <span className="text-[10px] text-zinc-500 mt-0.5 leading-tight">
                  Find student housing
                </span>
              </button>

              {/* Landlord Role Card */}
              <button
                type="button"
                onClick={() => setRole("landlord")}
                className={`relative flex flex-col items-center p-3.5 rounded-xl border transition-all text-center ${
                  role === "landlord"
                    ? "border-zinc-500 bg-zinc-900 text-white shadow-sm shadow-black/50"
                    : "border-zinc-800/80 hover:border-zinc-700 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {role === "landlord" && (
                  <CheckCircle2 className="absolute top-2 right-2 h-3.5 w-3.5 text-blue-400" />
                )}
                <div className={`p-2 rounded-xl mb-1.5 ${
                  role === "landlord" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-zinc-900 text-zinc-500"
                }`}>
                  <Building2 className="h-5 w-5" />
                </div>
                <span className="font-semibold text-xs text-zinc-100">Landlord</span>
                <span className="text-[10px] text-zinc-500 mt-0.5 leading-tight">
                  List & manage properties
                </span>
              </button>
            </div>
          </div>

          {/* Auth Action: Google or Email */}
          {method === "google" ? (
            <div className="space-y-3 pt-1">
              <Button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full h-11 bg-white hover:bg-zinc-200 text-black font-semibold rounded-xl text-xs flex items-center justify-center gap-3 transition-all shadow-md active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        fill="#EA4335"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleEmailSignIn} className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-300 font-medium">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-10 rounded-xl border-zinc-800 bg-zinc-900/60 pl-10 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-0"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-zinc-300 font-medium">Password <span className="text-[10px] text-zinc-500">(Optional for verified accounts)</span></label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 rounded-xl border-zinc-800 bg-zinc-900/60 pl-10 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-0"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 bg-white hover:bg-zinc-200 text-black font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all mt-2 active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In with Email</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </form>
          )}

          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800/80" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-zinc-950 px-2 text-zinc-500 font-mono">
                Secure Authentication
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3 text-center pb-6">
          <p className="text-xs text-zinc-400">
            Don&apos;t have an account yet?{" "}
            <a href="/signup" className="font-medium text-zinc-100 hover:text-white underline underline-offset-4">
              Create account
            </a>
          </p>
          <p className="text-[10px] text-zinc-500 max-w-xs">
            By signing in, you agree to Student24&apos;s Terms of Service and Privacy Policy.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#000000] flex items-center justify-center p-4">
        <div className="w-10 h-10 border-2 border-zinc-800 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
