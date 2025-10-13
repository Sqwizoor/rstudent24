import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// Using the shared Prisma client instance from @/lib/prisma

// GET handler for all tenants (admin only)
export async function GET(request: NextRequest) {
  try {
    // Verify authentication and role
    const authResult = await verifyAuth(request, ['admin']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const tenants = await prisma.tenant.findMany();
    return NextResponse.json(tenants);
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

    // Create tenant - only include fields that exist in the Prisma schema
    const newTenant = await prisma.tenant.create({
      data: {
        cognitoId,
        email,
        // Use name field directly if provided, or combine firstName and lastName if available
        name: name || `${firstName || ''} ${lastName || ''}`.trim() || 'User',
        // Use phoneNumber field from the schema
        phoneNumber: phone || '',
        // Add a flag to track authentication method (optional, if you want to track this)
        // Note: You may need to add this field to your Prisma schema if you want to track it
      },
    });

    return NextResponse.json(newTenant, { status: 201 });
  } catch (error: any) {
    console.error("Error creating tenant:", error);
    return NextResponse.json(
      { message: `Error creating tenant: ${error.message}` },
      { status: 500 }
    );
  }
}
