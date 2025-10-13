import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// API endpoint to securely set the admin authentication cookie
export async function POST(request: NextRequest) {
  try {
    // Parse the request to get the token
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 400 }
      );
    }
    
    // Set the cookie with HttpOnly and Secure flags for security
    const cookieStore = await cookies();
    
    // Set cookie with security attributes
    cookieStore.set('admin_auth_token', token, {
      httpOnly: true,             // Not accessible via JavaScript
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict',         // Prevents CSRF
      maxAge: 60 * 60 * 24,       // 24 hours
      path: '/',                  // Available across the site
    });
    
    console.log('[API] Set admin auth cookie successfully');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error setting admin auth cookie:', error);
    
    return NextResponse.json(
      { error: 'Failed to set auth cookie' },
      { status: 500 }
    );
  }
}
