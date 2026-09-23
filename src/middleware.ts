import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { isExplicitAdminEmail } from '@/lib/constants';

// Professional Middleware for admin routes and admin APIs (NextAuth)
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPath = pathname === '/admin' || pathname.startsWith('/admin/');
  const isAdminApiPath = pathname === '/api/admin' || pathname.startsWith('/api/admin/');

  if (isAdminPath || isAdminApiPath) {
    let userEmail: string | null = null;
    let isAuthenticated = false;

    // Verify NextAuth JWT session
    try {
      const nextAuthToken = await getToken({ 
        req: request, 
        secret: process.env.NEXTAUTH_SECRET 
      });
      if (nextAuthToken?.email) {
        userEmail = String(nextAuthToken.email).toLowerCase().trim();
        isAuthenticated = true;
      }
    } catch (e) {
      console.warn("[Middleware] NextAuth token verification failed:", e);
    }

    // Strict Authorization Check: Only explicit admin emails allowed
    const isAuthorizedAdmin = isAuthenticated && isExplicitAdminEmail(userEmail);

    if (!isAuthorizedAdmin) {
      // For API requests, return JSON error with 401/403 status
      if (isAdminApiPath) {
        return NextResponse.json(
          { 
            error: isAuthenticated 
              ? "Forbidden: This account is not authorized for administrator access" 
              : "Unauthorized: Administrator sign in required",
            code: isAuthenticated ? 403 : 401 
          },
          { status: isAuthenticated ? 403 : 401 }
        );
      }

      // For Admin UI Page requests:
      if (!isAuthenticated) {
        const signInUrl = new URL('/signin', request.url);
        signInUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(signInUrl);
      } else {
        // Authenticated as student, tenant, landlord, or regular user: redirect away
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
