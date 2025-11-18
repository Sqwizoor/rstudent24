import { NextRequest, NextResponse } from 'next/server';

// Middleware to protect admin routes
export function middleware(request: NextRequest) {
  // Get the pathname from the URL
  const { pathname } = request.nextUrl;

  // Only apply middleware to admin routes (except admin-login)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin-login')) {
    // Check for the admin auth token cookie
    const adminAuthToken = request.cookies.get('admin_auth_token');
    
    // If no admin auth token, redirect to admin login
    if (!adminAuthToken) {
      // Save the requested URL to redirect back after login
      const url = new URL('/admin-login', request.url);
      url.searchParams.set('from', pathname);
      return NextResponse.redirect(url);
    }
  }
  
  // Continue with the request for non-admin routes or authenticated admin routes
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
