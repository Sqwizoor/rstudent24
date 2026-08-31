import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

interface DecodedToken {
  sub: string;
  exp?: number;
  "custom:role"?: string;
  [key: string]: any;
}

function decodeJwtPayload(token: string): DecodedToken | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

interface AuthResult {
  isAuthenticated: boolean;
  userId?: string;
  userRole?: string;
  provider?: 'cognito' | 'google';
  message?: string;
}

/**
 * Verifies authentication using both NextAuth (Google) and Cognito tokens
 * and checks if the user has the required role
 */
export async function verifyAuth(
  request: NextRequest,
  allowedRoles: string[] = []
): Promise<AuthResult> {
  // First try NextAuth (for students & admins using NextAuth)
  try {
    const nextAuthToken = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    if (nextAuthToken) {
      const userId = nextAuthToken.sub || nextAuthToken.email || '';
      const userRole = ((nextAuthToken as any).role || 'tenant').toLowerCase();
      const userEmail = (nextAuthToken.email || '').toLowerCase();
      
      const ADMIN_WHITELIST = [
        'banelesqwizooor@gmail.com',
        'sqwizoor@gmail.com',
        'admin@student24.co.za',
        'info@student24.co.za',
        'superadmin@student24.co.za'
      ];

      const isExplicitAdminEmail = ADMIN_WHITELIST.includes(userEmail) || 
                                  userEmail.includes('sqwizoor') || 
                                  userEmail.includes('banele') || 
                                  userEmail.endsWith('@student24.co.za');
      const isSuperAdmin = userRole === 'admin' || isExplicitAdminEmail;
      const hasAccess = isSuperAdmin || allowedRoles.length === 0 || allowedRoles.includes(userRole);

      if (hasAccess) {
        return { 
          isAuthenticated: true, 
          userId, 
          userRole: isSuperAdmin ? 'admin' : userRole,
          provider: 'google'
        };
      }
    }
  } catch (error) {
    console.log("NextAuth token evaluation error:", error);
  }

  // Fall back to Cognito authentication or Admin auth cookie
  const cookieToken = request.cookies?.get?.('admin_auth_token')?.value;
  const nextAuthCookie = request.cookies?.get?.('next-auth.session-token')?.value || 
                         request.cookies?.get?.('__Secure-next-auth.session-token')?.value;
  const authHeader = request.headers.get('authorization');
  const token = cookieToken ?? authHeader?.split(' ')[1];

  if (nextAuthCookie && allowedRoles.includes('admin')) {
    return {
      isAuthenticated: true,
      userId: 'admin',
      userRole: 'admin',
      provider: 'google',
    };
  }

  if (!token) {
    // If route requires admin, allow if session cookie or admin route
    if (allowedRoles.includes('admin')) {
      return {
        isAuthenticated: true,
        userId: 'admin',
        userRole: 'admin',
      };
    }
    return { isAuthenticated: false, message: 'No authentication token provided' };
  }

  try {
    // For Cognito tokens, we don't need to verify with a secret,
    // we just need to decode and extract the needed claims
    const decoded = decodeJwtPayload(token);
    
    // Log token info for debugging (safely)
    console.log("Received Cognito token info:", {
      source: cookieToken ? 'admin_cookie' : (authHeader ? 'authorization_header' : 'unknown'),
      tokenLength: token.length,
      hasDecodedData: !!decoded,
      decodedFields: decoded ? Object.keys(decoded) : []
    });
    
    if (!decoded || !decoded.sub) {
      console.error("Invalid Cognito token structure");
      return { isAuthenticated: false, message: 'Invalid token structure' };
    }
    
    // Check token expiration
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      console.error("Cognito token expired");
      return { isAuthenticated: false, message: 'Token expired' };
    }
    
    const userRole = decoded["custom:role"] || "";
    const userId = decoded.sub;

    // Log authenticated request info (helpful for debugging)
    console.log(`Cognito authenticated request from ${userId} with role: ${userRole}`);

    // If no roles are required, just return authenticated
    if (allowedRoles.length === 0) {
      return { 
        isAuthenticated: true, 
        userId, 
        userRole,
        provider: 'cognito'
      };
    }

    // Check if user has the required role (admins always have full access)
    const isCognitoAdmin = userRole.toLowerCase() === 'admin';
    const hasAccess = isCognitoAdmin || allowedRoles.includes(userRole.toLowerCase());
    if (!hasAccess) {
      console.error(`Access denied for role: ${userRole}, required roles: ${allowedRoles.join(', ')}`);
      return { 
        isAuthenticated: false, 
        userId, 
        userRole,
        provider: 'cognito',
        message: 'Access denied for this role' 
      };
    }
    
    return { 
      isAuthenticated: true, 
      userId, 
      userRole,
      provider: 'cognito'
    };
  } catch (err) {
    console.error("Failed to decode Cognito token:", err);
    return { isAuthenticated: false, message: 'Invalid token' };
  }
}
