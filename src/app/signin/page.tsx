"use client";

import React, { useState, Suspense, useMemo } from 'react';
import { signIn } from "next-auth/react";
import { useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";

function SignInContent() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get('callbackUrl');

  const callbackUrl = useMemo(() => {
    if (!rawCallback) return '/';

    const decodeValue = (value: string) => {
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    };

    const decoded = decodeValue(rawCallback);

    if (decoded.startsWith('/')) {
      return decoded || '/';
    }

    if (typeof window !== 'undefined') {
      try {
        const currentOrigin = window.location.origin;
        const parsed = new URL(decoded, currentOrigin);
        if (parsed.origin === currentOrigin) {
          const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
          return path || '/';
        }
      } catch {
        // ignore and fall through to default
      }
    }

    return '/';
  }, [rawCallback]);

  console.log('🔍 SignIn page loaded:', {
    callbackUrl,
    origin: typeof window !== 'undefined' ? window.location.origin : 'server',
    allParams: Array.from(searchParams.entries())
  });

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    console.log('🔐 Google sign-in triggered with callbackUrl:', callbackUrl);
    try {
      // Track sign-in attempt with PostHog
      posthog.capture('user_signed_in', {
        provider: 'google',
        user_type: 'student',
      });

      // Pass the callbackUrl directly to NextAuth
      // NextAuth will handle the redirect properly
      const result = await signIn("google", {
        callbackUrl: callbackUrl,
        redirect: true
      });

      console.log('✅ Sign-in result:', result);
    } catch (error) {
      console.error("Google sign-in error:", error);
      posthog.captureException(error);
      setIsLoading(false);
    }
  };

  const handleCognitoSignIn = () => {
    // Track Cognito sign-in attempt with PostHog
    posthog.capture('user_signed_in', {
      provider: 'cognito',
      user_type: 'landlord',
    });

    const url = callbackUrl !== '/'
      ? `/cognito-signin?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : '/cognito-signin';
    window.location.href = url;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
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
                loading="eager"
                quality={90}
                sizes="120px"
              />
            </picture>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">
            Choose your account type to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="student" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="student">Student</TabsTrigger>
              <TabsTrigger value="landlord">Landlord</TabsTrigger>
            </TabsList>
            
            <TabsContent value="student" className="space-y-4 mt-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Sign in with your Google account as a student
                </p>
                <Button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  variant="outline"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="mr-2 h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                      Signing in...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
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
                      Sign in with Google
                    </div>
                  )}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="landlord" className="space-y-4 mt-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Continue as a landlord
                </p>
                <Button
                  onClick={handleCognitoSignIn}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Continue with Cognito
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="text-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <a href={`/signup${callbackUrl !== '/' ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`} className="text-blue-600 hover:underline">
              Sign up here
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function SignInPage() {
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
      <SignInContent />
    </Suspense>
  );
}
