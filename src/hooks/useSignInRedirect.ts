"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const AUTH_ROUTE_REGEX = /^\/(signin|signup|cognito-signin|cognito-signup)$/i;

function decodeCallbackParam(raw: string | null): string | null {
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function normaliseRelativePath(pathname: string, searchParams: URLSearchParams | null) {
  const query = searchParams ? new URLSearchParams(searchParams.toString()) : null;
  if (query) {
    query.delete("callbackUrl");
    const qs = query.toString();
    if (qs) {
      return `${pathname}?${qs}`;
    }
  }
  return pathname || "/";
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
  const searchParams = useSearchParams();
  const paramsInstance = useMemo(() => {
    if (!searchParams) return null;
    try {
      return new URLSearchParams(searchParams.toString());
    } catch {
      return null;
    }
  }, [searchParams]);

  const decodedQueryCallback = useMemo(
    () => preferSameOriginPath(decodeCallbackParam(searchParams?.get("callbackUrl") ?? null)),
    [searchParams]
  );

  const currentRelativePath = useMemo(
    () => normaliseRelativePath(pathname, paramsInstance),
    [pathname, paramsInstance]
  );

  const preferredTarget = useMemo(() => {
    if (AUTH_ROUTE_REGEX.test(pathname)) {
      return decodedQueryCallback || "/";
    }
    return decodedQueryCallback || currentRelativePath || "/";
  }, [pathname, decodedQueryCallback, currentRelativePath]);

  const buildSigninUrl = useCallback(
    (target?: string) => {
      const destination = preferSameOriginPath(target || preferredTarget) || "/";
      return `/signin?callbackUrl=${encodeURIComponent(destination)}`;
    },
    [preferredTarget]
  );

  const buildSignupUrl = useCallback(
    (target?: string) => {
      const destination = preferSameOriginPath(target || preferredTarget) || "/";
      return `/signup?callbackUrl=${encodeURIComponent(destination)}`;
    },
    [preferredTarget]
  );

  const buildCognitoSigninUrl = useCallback(
    (target?: string) => {
      const destination = preferSameOriginPath(target || preferredTarget) || "/";
      return `/cognito-signin?callbackUrl=${encodeURIComponent(destination)}`;
    },
    [preferredTarget]
  );

  const redirectToSignin = useCallback(() => {
    const url = buildSigninUrl();
    if (typeof window !== "undefined") {
      window.location.href = url;
    }
  }, [buildSigninUrl]);

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
