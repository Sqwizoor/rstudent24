"use client";

import React, { useState, Suspense, useMemo } from 'react';
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from 'next/navigation';
import posthog from 'posthog-js';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { GraduationCap, Building2, CheckCircle2, Mail, Lock, User, Phone, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

type RoleType = "student" | "landlord";
type AuthMethod = "email" | "google";

function SignUpContent() {
  const [role, setRole] = useState<RoleType>("student");
  const [method, setMethod] = useState<AuthMethod>("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
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

  const targetRole = role === "landlord" ? "manager" : "tenant";

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    try {
      document.cookie = `user_target_role=${targetRole}; path=/; max-age=3600; SameSite=Lax`;

      posthog.capture('user_signed_up', {
        provider: 'google',
        user_type: targetRole,
      });

      await signIn("google", {
        callbackUrl: callbackUrl,
        redirect: true,
      });
    } catch (error) {
      console.error("Google sign-up error:", error);
      posthog.captureException(error);
      setIsLoading(false);
      toast.error("Google sign-up failed. Please try again.");
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Call registration API to create account in Convex & database
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
          phoneNumber: phoneNumber.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create account");
      }

      toast.success("Account created successfully! Logging you in...");

      // 2. Set role cookie
      document.cookie = `user_target_role=${targetRole}; path=/; max-age=3600; SameSite=Lax`;

      posthog.capture('user_signed_up', {
        provider: 'email_credentials',
        user_type: targetRole,
      });

      // 3. Automatically sign in with credentials
      const signInRes = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        role: targetRole,
        callbackUrl: callbackUrl,
        redirect: false,
      });

      if (signInRes?.error) {
        toast.error("Account created, but automatic login failed. Please sign in.");
        router.push(`/signin${rawCallback ? `?callbackUrl=${encodeURIComponent(rawCallback)}` : ''}`);
        return;
      }

      // 4. Redirect to destination
      router.push(callbackUrl);
      router.refresh();
    } catch (error: any) {
      console.error("Email sign-up error:", error);
      toast.error(error.message || "Sign up failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="dark min-h-screen bg-[#000000] text-zinc-100 flex items-center justify-center p-4 selection:bg-zinc-800">
      {/* Background glow orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-blue-500/5 blur-[140px] rounded-full pointer-events-none" />

      <Card className="relative w-full max-w-md rounded-2xl border border-zinc-800/80 bg-zinc-950/85 backdrop-blur-xl shadow-2xl shadow-black/80 my-8">
        <CardHeader className="space-y-3 flex flex-col items-center text-center pb-3 pt-6">
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
              Create Your Account
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400 mt-1">
              Join Student24 as a student or property landlord
            </CardDescription>
          </div>

          {/* Auth Method Switcher Tabs */}
          <div className="w-full grid grid-cols-2 p-1 bg-zinc-900/80 border border-zinc-800/80 rounded-xl mt-2">
            <button
              type="button"
              onClick={() => setMethod("email")}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                method === "email"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Email & Password
            </button>
            <button
              type="button"
              onClick={() => setMethod("google")}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                method === "google"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Google Sign Up
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 px-6">
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
                className={`relative flex flex-col items-center p-3 rounded-xl border transition-all text-center ${
                  role === "student"
                    ? "border-zinc-500 bg-zinc-900 text-white shadow-sm shadow-black/50"
                    : "border-zinc-800/80 hover:border-zinc-700 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {role === "student" && (
                  <CheckCircle2 className="absolute top-2 right-2 h-3.5 w-3.5 text-blue-400" />
                )}
                <div className={`p-2 rounded-xl mb-1 ${
                  role === "student" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-zinc-900 text-zinc-500"
                }`}>
                  <GraduationCap className="h-5 w-5" />
                </div>
                <span className="font-semibold text-xs text-zinc-100">Student</span>
                <span className="text-[10px] text-zinc-500 mt-0.5 leading-tight">
                  Book accommodation
                </span>
              </button>

              {/* Landlord Role Card */}
              <button
                type="button"
                onClick={() => setRole("landlord")}
                className={`relative flex flex-col items-center p-3 rounded-xl border transition-all text-center ${
                  role === "landlord"
                    ? "border-zinc-500 bg-zinc-900 text-white shadow-sm shadow-black/50"
                    : "border-zinc-800/80 hover:border-zinc-700 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {role === "landlord" && (
                  <CheckCircle2 className="absolute top-2 right-2 h-3.5 w-3.5 text-blue-400" />
                )}
                <div className={`p-2 rounded-xl mb-1 ${
                  role === "landlord" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-zinc-900 text-zinc-500"
                }`}>
                  <Building2 className="h-5 w-5" />
                </div>
                <span className="font-semibold text-xs text-zinc-100">Landlord</span>
                <span className="text-[10px] text-zinc-500 mt-0.5 leading-tight">
                  List properties
                </span>
              </button>
            </div>
          </div>

          {/* Form Content: Email & Password or Google */}
          {method === "email" ? (
            <form onSubmit={handleEmailSignUp} className="space-y-3 pt-1">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-300 font-medium">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pl-9 bg-zinc-900/80 border-zinc-800 focus:border-zinc-500 text-zinc-100 placeholder:text-zinc-600 rounded-xl h-10 text-xs"
                  />
                </div>
              </div>

              {/* Email */}
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
                    disabled={isLoading}
                    className="pl-9 bg-zinc-900/80 border-zinc-800 focus:border-zinc-500 text-zinc-100 placeholder:text-zinc-600 rounded-xl h-10 text-xs"
                  />
                </div>
              </div>

              {/* Phone Number (Optional) */}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-300 font-medium">
                  Phone Number <span className="text-zinc-500 text-[10px]">(Optional)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input
                    type="tel"
                    placeholder="+27 82 123 4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isLoading}
                    className="pl-9 bg-zinc-900/80 border-zinc-800 focus:border-zinc-500 text-zinc-100 placeholder:text-zinc-600 rounded-xl h-10 text-xs"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-300 font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pl-9 pr-9 bg-zinc-900/80 border-zinc-800 focus:border-zinc-500 text-zinc-100 placeholder:text-zinc-600 rounded-xl h-10 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-300 font-medium">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pl-9 bg-zinc-900/80 border-zinc-800 focus:border-zinc-500 text-zinc-100 placeholder:text-zinc-600 rounded-xl h-10 text-xs"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-white hover:bg-zinc-200 text-black font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] mt-2"
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Create {role === "student" ? "Student" : "Landlord"} Account</span>
                )}
              </Button>
            </form>
          ) : (
            /* Google OAuth Action */
            <div className="space-y-3 pt-2">
              <Button
                type="button"
                onClick={handleGoogleSignUp}
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
                    <span>Sign up with Google as {role === "student" ? "Student" : "Landlord"}</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-2 text-center text-xs text-zinc-400 pt-2 pb-5 border-t border-zinc-800/80">
          <p>
            Already have an account?{" "}
            <a href={`/signin${rawCallback ? `?callbackUrl=${encodeURIComponent(rawCallback)}` : ''}`} className="text-zinc-200 font-semibold hover:underline">
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
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="h-8 w-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin"></div>
      </div>
    }>
      <SignUpContent />
    </Suspense>
  );
}

