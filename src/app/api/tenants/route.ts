import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { queryCache } from '@/lib/queryCache';

// Using the shared Prisma client instance from @/lib/prisma

// ✅ ISR: Cache responses for 1 hour
export const revalidate = 3600;

// GET handler for all tenants (admin only)
export async function GET(request: NextRequest) {
  try {
    // Verify authentication and role
    const authResult = await verifyAuth(request, ['admin']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Step 2: Check cache first
    const cacheKey = queryCache.getKey('tenants', { all: true });
    const cached = queryCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
          'Content-Type': 'application/json',
        },
      });
    }

    // ✅ Step 3: Use .select() to minimize payload
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        cognitoId: true,
        email: true,
        name: true,
        phoneNumber: true,
      },
    });
    
    // ✅ Step 4: Store in cache for 1 hour
    queryCache.set(cacheKey, tenants, 3600);
    
    // ✅ Step 5: Return with cache headers
    return NextResponse.json(tenants, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error("Error retrieving tenants:", error);
    return NextResponse.json(
      { message: `Error retrieving tenants: ${error.message}` },
      { status: 500 }
    );
  }
}

// POST handler for creating a tenant
export async function POST(request: NextRequest) {
  try {
    // Handle query parameters for cases where the request body might be empty
    const url = new URL(request.url);
    const cognitoIdParam = url.searchParams.get('cognitoId');
    
    let body;
    let cognitoId, email, firstName, lastName, phone, name, isGoogleAuth;
    
    // Try to parse the request body, but handle empty body gracefully
    try {
      if (request.body) {
        body = await request.json();
        // Extract tenant data from body
        cognitoId = body.cognitoId;
        email = body.email;
        firstName = body.firstName;
        lastName = body.lastName;
        phone = body.phone;
        name = body.name;
        isGoogleAuth = body.isGoogleAuth || false;
      }
    } catch (error) {
      // Type assertion for the error to access message property
      const parseError = error as Error;
      console.log('Request body parsing error:', parseError.message);
      // If body parsing fails, check if we have query parameters
    }
    
    // If cognitoId wasn't in the body, try to get it from query parameters
    if (!cognitoId && cognitoIdParam) {
      cognitoId = cognitoIdParam;
      
      // For admin-created users, we might need to fetch additional info
      // This is a simplified example - you might need to fetch user details from Cognito
      if (!email) {
        // Get the user's email from auth if available
        try {
          const authResult = await verifyAuth(request);
          // Use user info from the token if available
          if (authResult.isAuthenticated && authResult.userId) {
            // Extract email from the request headers or use a default based on userId
            const authHeader = request.headers.get('authorization');
            const token = authHeader?.split(' ')[1];
            
            if (token) {
              try {
                // Decode the token to get the email
                const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
                if (decoded.email) {
                  email = decoded.email;
                } else {
                  // Fallback to using userId as email
                  email = authResult.userId + '@example.com';
                }
              } catch {
                // If token decoding fails, use userId
                email = authResult.userId + '@example.com';
              }
            } else {
              // No token, use userId
              email = authResult.userId + '@example.com';
            }
          }
        } catch (error) {
          // Type assertion for the error to access message property
          const authError = error as Error;
          console.log('Auth verification error:', authError.message);
        }
      }
    }
    
    // Validate required fields
    if (!cognitoId || !email) {
      return NextResponse.json({ 
        message: "Missing required fields",
        missingFields: {
          cognitoId: !cognitoId,
          email: !email
        }
      }, { status: 400 });
    }

    // Check if tenant already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { cognitoId },
    });

    if (existingTenant) {
      return NextResponse.json({ 
        message: "Tenant already exists",
        tenant: existingTenant
      }, { status: 409 });
    }

    // Parse firstName and lastName from name if they're not provided separately
    let finalFirstName = firstName;
    let finalLastName = lastName;
    let finalName = name;

    if (!finalName && (firstName || lastName)) {
      finalName = `${firstName || ''} ${lastName || ''}`.trim();
    } else if (finalName && !firstName && !lastName) {
      // Split the name into first and last name
      const nameParts = finalName.trim().split(' ');
      finalFirstName = nameParts[0] || '';
      finalLastName = nameParts.slice(1).join(' ') || '';
    }

    // Ensure we have a name
    if (!finalName) {
      finalName = email.split('@')[0]; // Use email username as fallback
    }

    // Create tenant - only include fields that exist in the Prisma schema
    const newTenant = await prisma.tenant.create({
      data: {
        cognitoId,
        email,
        name: finalName,
        phoneNumber: phone || '', // Empty string as default
      },
    });

    console.log('✅ Tenant created successfully:', newTenant.cognitoId);

    // ✅ Invalidate cache after creation
    queryCache.invalidateAll();

    return NextResponse.json(newTenant, { status: 201 });
  } catch (error: any) {
    console.error("Error creating tenant:", error);
    return NextResponse.json(
      { message: `Error creating tenant: ${error.message}` },
      { status: 500 }
    );
  }
}
