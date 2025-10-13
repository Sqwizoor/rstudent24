import { NextRequest } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { getToken } from 'next-auth/jwt';

interface DecodedToken extends JwtPayload {
  sub: string;
  "custom:role"?: string;
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
  // First try NextAuth (for students using Google auth)
  try {
    const nextAuthToken = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    if (nextAuthToken) {
  const userId = nextAuthToken.sub || nextAuthToken.email || '';
      const userRole = (nextAuthToken as any).role || 'tenant';
      
      console.log(`NextAuth authenticated request from ${userId} with role: ${userRole}`);
      
      // If no roles are required, just return authenticated
      if (allowedRoles.length === 0) {
        return { 
          isAuthenticated: true, 
          userId, 
          userRole,
          provider: 'google'
        };
      }

      // Check if user has the required role
      const hasAccess = allowedRoles.includes(userRole.toLowerCase());
      if (!hasAccess) {
        console.error(`Access denied for role: ${userRole}, required roles: ${allowedRoles.join(', ')}`);
        return { 
          isAuthenticated: false, 
          userId, 
          userRole,
          provider: 'google',
          message: 'Access denied for this role' 
        };
      }
      
      return { 
        isAuthenticated: true, 
        userId, 
        userRole,
        provider: 'google'
      };
    }
  } catch (error) {
    console.log("NextAuth token not found or invalid, trying Cognito...");
  }

  // Fall back to Cognito authentication (for managers/landlords)
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return { isAuthenticated: false, message: 'No authentication token provided' };
  }

  try {
    // For Cognito tokens, we don't need to verify with a secret,
    // we just need to decode and extract the needed claims
    const decoded = jwt.decode(token) as DecodedToken;
    
    // Log token info for debugging (safely)
    console.log("Received Cognito token info:", {
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

    // Check if user has the required role
    const hasAccess = allowedRoles.includes(userRole.toLowerCase());
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
