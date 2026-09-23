import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { isExplicitAdminEmail, ADMIN_WHITELIST } from '@/lib/constants';

export { ADMIN_WHITELIST, isExplicitAdminEmail };

export interface AuthResult {
  isAuthenticated: boolean;
  userId?: string;
  userRole?: string;
  userEmail?: string;
  provider?: 'google' | 'credentials';
  message?: string;
}

/**
 * Verifies authentication using NextAuth JWT tokens
 * and strictly verifies role permissions.
 * Admin role is strictly restricted to emails in ADMIN_WHITELIST.
 */
export async function verifyAuth(
  request: NextRequest,
  allowedRoles: string[] = []
): Promise<AuthResult> {
  try {
    const nextAuthToken = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    if (!nextAuthToken) {
      return { 
        isAuthenticated: false, 
        message: 'No valid authentication session found' 
      };
    }

    const userId = nextAuthToken.sub || nextAuthToken.email || '';
    const userEmail = (nextAuthToken.email || '').toLowerCase().trim();
    const rawRole = ((nextAuthToken as any).role || 'tenant').toLowerCase();

    // Strict admin check: only explicit admin emails can have admin role
    const isSuperAdmin = isExplicitAdminEmail(userEmail);
    const userRole = isSuperAdmin ? 'admin' : (rawRole === 'admin' ? 'tenant' : rawRole);
    const provider = ((nextAuthToken as any).provider || 'google') as 'google' | 'credentials';

    // If route requires admin, verify whitelist
    if (allowedRoles.includes('admin') && !isSuperAdmin) {
      return {
        isAuthenticated: false,
        userId,
        userRole,
        userEmail,
        provider,
        message: 'Access denied: email is not an authorized administrator',
      };
    }

    const hasAccess = isSuperAdmin || allowedRoles.length === 0 || allowedRoles.includes(userRole);

    if (!hasAccess) {
      return { 
        isAuthenticated: false, 
        userId, 
        userRole, 
        userEmail, 
        provider,
        message: 'Access denied for this role' 
      };
    }

    return { 
      isAuthenticated: true, 
      userId, 
      userRole, 
      userEmail, 
      provider 
    };
  } catch (error) {
    console.error("Authentication verification error:", error);
    return { 
      isAuthenticated: false, 
      message: 'Authentication verification failed' 
    };
  }
}
