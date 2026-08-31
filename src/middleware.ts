import { NextRequest, NextResponse } from 'next/server';

// Middleware for admin routes
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    const adminAuthToken = request.cookies.get('admin_auth_token')?.value;
    const nextAuthToken = request.cookies.get('next-auth.session-token')?.value || 
                          request.cookies.get('__Secure-next-auth.session-token')?.value;

    if (!adminAuthToken && !nextAuthToken) {
      const url = new URL('/signin', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
