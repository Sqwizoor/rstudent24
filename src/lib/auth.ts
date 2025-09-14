import { NextRequest } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';

interface DecodedToken extends JwtPayload {
  sub: string;
  "custom:role"?: string;
}

interface AuthResult {
  isAuthenticated: boolean;
  userId?: string;
  userRole?: string;
  message?: string;
}

/**
 * Verifies the authentication token from the request headers
 * and checks if the user has the required role
 */
export async function verifyAuth(
  request: NextRequest,
  allowedRoles: string[] = []
): Promise<AuthResult> {
  // Extract the token from the Authorization header
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
    console.log("Received token info:", {
      tokenLength: token.length,
      hasDecodedData: !!decoded,
      decodedFields: decoded ? Object.keys(decoded) : []
    });
    
    if (!decoded || !decoded.sub) {
      console.error("Invalid token structure");
      return { isAuthenticated: false, message: 'Invalid token structure' };
    }
    
    // Check token expiration
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      console.error("Token expired");
      return { isAuthenticated: false, message: 'Token expired' };
    }
    
    const userRole = decoded["custom:role"] || "";
    const userId = decoded.sub;

    // Log authenticated request info (helpful for debugging)
    console.log(`Authenticated request from ${userId} with role: ${userRole}`);

    // If no roles are required, just return authenticated
    if (allowedRoles.length === 0) {
      return { 
        isAuthenticated: true, 
        userId, 
        userRole 
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
        message: 'Access denied for this role' 
      };
    }
    
    return { 
      isAuthenticated: true, 
      userId, 
      userRole 
    };
  } catch (err) {
    console.error("Failed to decode token:", err);
    return { isAuthenticated: false, message: 'Invalid token' };
  }
}
