"use client";

import { useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";

const AUTH_ROUTE_REGEX = /^\/(signin|signup|cognito-signin|cognito-signup)$/i;

function getClientSearchParams(): URLSearchParams | null {
  if (typeof window === "undefined") return null;
  try {
    return new URLSearchParams(window.location.search);
  } catch {
    return null;
  }
}

function preferSameOriginPath(target: string | null) {
  if (!target) return null;
  if (target.startsWith("/")) {
    return target;
  }

  if (target.startsWith("http://") || target.startsWith("https://")) {
    try {
      if (typeof window !== "undefined") {
        const parsed = new URL(target);
        if (parsed.origin === window.location.origin) {
          return `${parsed.pathname}${parsed.search}${parsed.hash}` || "/";
        }
      }
    } catch {
      // fall through to return raw target
    }
  }

  return target;
}

export function useSignInRedirect() {
  const pathname = usePathname();

  const getCallbackTarget = useCallback(
    (target?: string) => {
      if (target) return preferSameOriginPath(target) || "/";

      // Try reading callbackUrl from query params if in browser
      const params = getClientSearchParams();
      const raw = params?.get("callbackUrl");
      if (raw) {
        try {
          const decoded = decodeURIComponent(raw);
          const preferred = preferSameOriginPath(decoded);
          if (preferred) return preferred;
        } catch {
          // ignore
        }
      }

      if (pathname && !AUTH_ROUTE_REGEX.test(pathname)) {
        return pathname;
      }
      return "/";
    },
    [pathname]
  );

  const buildSigninUrl = useCallback(
    (target?: string) => {
      const destination = getCallbackTarget(target);
      return `/signin?callbackUrl=${encodeURIComponent(destination)}`;
    },
    [getCallbackTarget]
  );

  const buildSignupUrl = useCallback(
    (target?: string) => {
      const destination = getCallbackTarget(target);
      return `/signup?callbackUrl=${encodeURIComponent(destination)}`;
    },
    [getCallbackTarget]
  );

  const buildCognitoSigninUrl = useCallback(
    (target?: string) => {
      const destination = getCallbackTarget(target);
      return `/cognito-signin?callbackUrl=${encodeURIComponent(destination)}`;
    },
    [getCallbackTarget]
  );

  const redirectToSignin = useCallback(() => {
    const url = buildSigninUrl();
    if (typeof window !== "undefined") {
      window.location.href = url;
    }
  }, [buildSigninUrl]);

  const preferredTarget = pathname && !AUTH_ROUTE_REGEX.test(pathname) ? pathname : "/";
  const homeSigninUrl = useMemo(() => buildSigninUrl("/"), [buildSigninUrl]);
  const homeSignupUrl = useMemo(() => buildSignupUrl("/"), [buildSignupUrl]);

  return {
    callbackTarget: preferredTarget,
    signinUrl: buildSigninUrl(),
    signupUrl: buildSignupUrl(),
    cognitoSigninUrl: buildCognitoSigninUrl(),
    redirectToSignin,
    buildSigninUrl,
    buildSignupUrl,
    buildCognitoSigninUrl,
    homeSigninUrl,
    homeSignupUrl,
  };
}
