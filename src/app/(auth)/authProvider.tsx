"use client";

import React, { useEffect, Suspense, useRef } from "react";
import { Amplify } from "aws-amplify";
import {
  Authenticator,
  Heading,
  Radio,
  RadioGroupField,
  useAuthenticator,
  View,
} from "@aws-amplify/ui-react";
import Image from "next/image"
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import posthog from 'posthog-js';

// https://docs.amplify.aws/gen1/javascript/tools/libraries/configure-categories/
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID!,
      userPoolClientId:
        process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID!,
    },
  },
});

const components = {
  Header() {
    return (
      <View className="mt-4 mb-7">
        <Heading level={3} className="!text-2xl !font-bold">
            <picture>
              <source srcSet="/student24-logo.avif" type="image/avif" />
              <source srcSet="/student24-logo.webp" type="image/webp" />
              <Image src="/student24-logo-optimized.png" alt="Student24 Logo" width={128} height={30} className="" />
            </picture>
        </Heading>
        <p className="text-muted-foreground mt-2">
          <span className="font-bold">Welcome!</span> Please sign in to continue
        </p>
      </View>
    );
  },
  SignIn: {
    Footer() {
      const { toSignUp, toForgotPassword } = useAuthenticator((context) => [context.toSignUp, context.toForgotPassword]);
      return (
        <View className="text-center mt-4 space-y-2">
          <p className="text-muted-foreground">
            Don&apos;t have an account?{" "}
            <button
              onClick={toSignUp}
              className="text-primary hover:underline bg-transparent border-none p-0"
            >
              Sign up here
            </button>
          </p>
          <p className="text-muted-foreground">
            Forgot your password?{" "}
            <button
              onClick={toForgotPassword}
              className="text-primary hover:underline bg-transparent border-none p-0"
            >
              Reset password
            </button>
          </p>
        </View>
      );
    },
  },
  SignUp: {
    FormFields() {
      const { validationErrors } = useAuthenticator();

      return (
        <>
          <Authenticator.SignUp.FormFields />
          <RadioGroupField
            legend="Account Type"
            name="custom:role"
            errorMessage={validationErrors?.["custom:role"]}
            hasError={!!validationErrors?.["custom:role"]}
            isRequired
          >
            <Radio value="manager">Landlord</Radio>
          </RadioGroupField>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              <strong>Students:</strong> Please use the <a href="/signin" className="text-blue-600 underline">Google Sign-in option</a> instead.
            </p>
          </div>
        </>
      );
    },

    Footer() {
      const { toSignIn } = useAuthenticator();
      return (
        <View className="text-center mt-4">
          <p className="text-muted-foreground">
            Already have an account?{" "}
            <button
              onClick={toSignIn}
              className="text-primary hover:underline bg-transparent border-none p-0"
            >
              Sign in
            </button>
          </p>
        </View>
      );
    },
  },
  ResetPassword: {
    Header() {
      return (
        <View className="mt-4 mb-7">
          <Heading level={3} className="!text-2xl !font-bold">
            Reset Password
          </Heading>
          <p className="text-muted-foreground mt-2">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </View>
      );
    },
    Footer() {
      const { toSignIn } = useAuthenticator();
      return (
        <View className="text-center mt-4">
          <p className="text-muted-foreground">
            Remember your password?{" "}
            <button
              onClick={toSignIn}
              className="text-primary hover:underline bg-transparent border-none p-0"
            >
              Back to sign in
            </button>
          </p>
        </View>
      );
    },
  },
  ConfirmResetPassword: {
    Header() {
      return (
        <View className="mt-4 mb-7">
          <Heading level={3} className="!text-2xl !font-bold">
            Confirm New Password
          </Heading>
          <p className="text-muted-foreground mt-2">
            Enter the verification code sent to your email and your new password.
          </p>
        </View>
      );
    },
    Footer() {
      const { toSignIn } = useAuthenticator();
      return (
        <View className="text-center mt-4">
          <p className="text-muted-foreground">
            Remember your password?{" "}
            <button
              onClick={toSignIn}
              className="text-primary hover:underline bg-transparent border-none p-0"
            >
              Back to sign in
            </button>
          </p>
        </View>
      );
    },
  },
};

const formFields = {
  signIn: {
    username: {
      placeholder: "Enter your email",
      label: "Email",
      isRequired: true,
    },
    password: {
      placeholder: "Enter your password",
      label: "Password",
      isRequired: true,
    },
  },
  signUp: {
    username: {
      order: 1,
      placeholder: "Choose a username",
      label: "Username",
      isRequired: true,
    },
    email: {
      order: 2,
      placeholder: "Enter your email address",
      label: "Email",
      isRequired: true,
    },
    password: {
      order: 3,
      placeholder: "Create a password",
      label: "Password",
      isRequired: true,
    },
    confirm_password: {
      order: 4,
      placeholder: "Confirm your password",
      label: "Confirm Password",
      isRequired: true,
    },
  },
  resetPassword: {
    username: {
      placeholder: "Enter your email address",
      label: "Email",
      isRequired: true,
    },
  },
  confirmResetPassword: {
    username: {
      placeholder: "Enter your email address",
      label: "Email",
      isRequired: true,
    },
    confirmation_code: {
      placeholder: "Enter verification code",
      label: "Verification Code",
      isRequired: true,
    },
    password: {
      placeholder: "Enter your new password",
      label: "New Password",
      isRequired: true,
    },
    confirm_password: {
      placeholder: "Confirm your new password",
      label: "Confirm New Password",
      isRequired: true,
    },
  },
};

// Inner component that uses searchParams
function AuthContent({ children }: { children: React.ReactNode }) {
  const { user } = useAuthenticator((context) => [context.user]);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');
  const identifiedRef = useRef(false);

  const isAuthPage = pathname.match(/^\/(signin|signup|cognito-signin|cognito-signup)$/);
  const isCognitoAuthPage = pathname.match(/^\/(cognito-signin|cognito-signup)$/);
  const isDashboardPage =
    pathname.startsWith("/manager") || pathname.startsWith("/tenants");

  // Identify user with PostHog when authenticated via Cognito
  useEffect(() => {
    if (user && !identifiedRef.current) {
      const userId = user.username || user.userId;
      // Access attributes safely from the user object
      const userAttributes = (user as unknown as { attributes?: Record<string, string> }).attributes;
      const userEmail = user.signInDetails?.loginId || userAttributes?.email;
      const userRole = userAttributes?.['custom:role'] || 'manager';

      // Identify user in PostHog
      posthog.identify(userId, {
        email: userEmail,
        user_type: userRole,
        provider: 'cognito',
      });

      // Track user sign-in/sign-up event
      posthog.capture('user_signed_up', {
        provider: 'cognito',
        user_type: userRole,
      });

      identifiedRef.current = true;
    }
  }, [user]);

  // Redirect authenticated users away from auth pages
  useEffect(() => {
    if (user && isAuthPage) {
      console.log('🔄 Auth redirect triggered:', {
        hasUser: !!user,
        isAuthPage,
        callbackUrl,
        pathname
      });
      
      if (callbackUrl) {
        const decodedUrl = decodeURIComponent(callbackUrl);
        console.log('✅ Redirecting to callback URL:', decodedUrl);
        
        // If it's an absolute URL with the same origin, extract the path
        try {
          if (decodedUrl.startsWith('http://') || decodedUrl.startsWith('https://')) {
            const urlObj = new URL(decodedUrl);
            // Only redirect to path if same origin for security
            if (urlObj.origin === window.location.origin) {
              const pathWithQuery = urlObj.pathname + urlObj.search + urlObj.hash;
              console.log('🔗 Extracted path from absolute URL:', pathWithQuery);
              router.push(pathWithQuery);
            } else {
              console.log('⚠️ Different origin detected, redirecting to home');
              router.push("/");
            }
          } else {
            // Relative URL, use as-is
            router.push(decodedUrl);
          }
        } catch (error) {
          console.error('❌ Error parsing callback URL:', error);
          router.push(decodedUrl); // Fallback to treating it as relative
        }
      } else {
        console.log('ℹ️ No callback URL, redirecting to home');
        router.push("/");
      }
    }
  }, [user, isAuthPage, router, callbackUrl, pathname]);

  // Allow access to public pages without authentication
  if (!isAuthPage && !isDashboardPage) {
    return <>{children}</>;
  }

  // For cognito-signin and cognito-signup, show the Authenticator
  if (isCognitoAuthPage) {
    return (
      <div className="h-full">
        <Authenticator
          initialState={pathname.includes("signup") ? "signUp" : "signIn"}
          components={components}
          formFields={formFields}
        >
          {() => <>{children}</>}
        </Authenticator>
      </div>
    );
  }

  // For regular signin and signup, just show the content (which will be the new pages with tabs)
  return <>{children}</>;
}

const Auth = ({ children }: { children: React.ReactNode }) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthContent>{children}</AuthContent>
    </Suspense>
  );
};

export default Auth;