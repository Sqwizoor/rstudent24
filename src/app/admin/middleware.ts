import { NextRequest, NextResponse } from 'next/server';

// Middleware config for admin routes
export function middleware(request: NextRequest) {
  // Get the admin token from cookies set by Amplify
  const amplifyTokens = request.cookies.get('idToken');
  const accessToken = request.cookies.get('accessToken');
  
  // Check if tokens exist - required for authentication check
  if (!amplifyTokens?.value || !accessToken?.value) {
    // No tokens found, redirect to login
    const url = new URL('/admin-login', request.url);
    const fromPath = request.nextUrl.pathname;
    url.searchParams.set('from', fromPath);
    
    console.log('[ADMIN MIDDLEWARE] No auth tokens found, redirecting to login');
    return NextResponse.redirect(url);
  }
  
  // Allow access - the admin page itself will check the admin role
  // This prevents the redirect loop issue while still protecting admin routes
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
