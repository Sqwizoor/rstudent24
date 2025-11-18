import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { queryCache } from '@/lib/queryCache';

// Using the shared Prisma client instance from @/lib/prisma

// ✅ ISR: Cache responses for 1 hour
export const revalidate = 3600;

// GET handler for all managers (admin only)
export async function GET(request: NextRequest) {
  try {
    // Verify authentication and role
    const authResult = await verifyAuth(request, ['admin']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Step 2: Check cache first
    const cacheKey = queryCache.getKey('managers', { all: true });
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
    const managers = await prisma.manager.findMany({
      select: {
        id: true,
        cognitoId: true,
        email: true,
        name: true,
        phoneNumber: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    // ✅ Step 4: Store in cache for 1 hour
    queryCache.set(cacheKey, managers, 3600);
    
    // ✅ Step 5: Return with cache headers
    return NextResponse.json(managers, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error("Error retrieving managers:", error);
    return NextResponse.json(
      { message: `Error retrieving managers: ${error.message}` },
      { status: 500 }
    );
  }
}

// POST handler for creating a manager
export async function POST(request: NextRequest) {
  try {
    // Log the content-type for debugging
    const contentType = request.headers.get('content-type') || '';
    console.log('Manager creation request content-type:', contentType);
    
    // Only try to parse the body once, and handle errors gracefully
    let body;
    let bodyReadSuccess = false;
    
    try {
      // Single attempt to read the body as JSON
      body = await request.json();
      bodyReadSuccess = true;
      console.log('Successfully parsed request body as JSON');
    } catch (error) {
      // TypeScript requires proper error handling
      const parseError = error as Error;
      console.error('Failed to parse request body:', parseError.message);
      
      // We can't read the body again, so check for fallback options
      // Check URL parameters
      const url = new URL(request.url);
      const idFromQuery = url.searchParams.get('cognitoId');
      if (idFromQuery) {
        body = { cognitoId: idFromQuery };
        bodyReadSuccess = true;
        console.log('Using cognitoId from URL parameter:', idFromQuery);
      }
    }
    
    // Attempt to enrich or fill missing fields from the Authorization token
    console.log('Attempting to enrich request data from auth token (if available)...');
    const authHeader = request.headers.get('authorization');
    let tokenPayload: any = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payloadBase64 = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
          tokenPayload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
        }
      } catch (e) {
        console.warn('Could not decode JWT payload:', e);
      }
    }

    // Normalize to an object
    body = body || {};
    
    // If fields are missing, pull from token payload when possible
    if (!body.cognitoId && tokenPayload?.sub) body.cognitoId = tokenPayload.sub;
    if (!body.email && tokenPayload?.email) body.email = tokenPayload.email;
    if (!body.name) {
      body.name = tokenPayload?.['cognito:username'] || (body.email ? String(body.email).split('@')[0] : undefined);
    }
    
    // If we still have no meaningful data, return error
    if (!body || (Object.keys(body).length === 0)) {
      return NextResponse.json({ message: 'Empty request body and no fallback data available' }, { status: 400 });
    }
    
    // Extract manager data - provide fallbacks for everything to ensure it works
  const cognitoId = body.cognitoId;
  const email = body.email;
    const firstName = body.firstName || '';
    const lastName = body.lastName || '';
    const phone = body.phone || body.phoneNumber || '';
    // Ensure we have a name - derive from email if not provided
  const name = body.name || (email ? email.split('@')[0] : 'Manager') || 'Manager';
    
    // Validate required fields - BOTH cognitoId AND email are required
    if (!cognitoId) {
      return NextResponse.json({ 
        message: "Missing required field: cognitoId"
      }, { status: 400 });
    }
    
    if (!email || email === 'manager@example.com') {
      return NextResponse.json({ 
        message: "Missing required field: valid email address"
      }, { status: 400 });
    }

    console.log('Creating manager with data:', {
      cognitoId,
      email,
      name,
      phoneNumber: phone
    });

    // Check if manager already exists
    let existingManager;
    try {
      existingManager = await prisma.manager.findUnique({
        where: { cognitoId },
      });
    } catch (findError) {
      console.error('Error finding existing manager:', findError);
      // Continue with creation - some errors might be due to schema issues
    }

    if (existingManager) {
      console.log('Manager already exists:', existingManager);
      return NextResponse.json({ 
        message: "Manager already exists",
        manager: existingManager
      }, { status: 409 });
    }

    // Create manager with fallback for each field
    try {
      const newManager = await prisma.manager.create({
        data: {
          cognitoId,
          email,
          name,  // Use the prepared name with fallbacks
          phoneNumber: phone,
          status: 'Active', // Set default status to Active to avoid needing admin approval
        },
      });
      
      console.log('Successfully created manager:', newManager);
      
      // ✅ Invalidate cache after creation
      queryCache.invalidateAll();
      
      return NextResponse.json(newManager, { status: 201 });
    } catch (createError: any) {
      console.error('Error creating manager:', createError);
      
      // Try to provide specific error information
      const errorDetail = createError.message || 'Unknown database error';
      
      // Special handling for common errors
      if (errorDetail.includes('column') && errorDetail.includes('does not exist')) {
        return NextResponse.json({
          message: "Database schema error: Missing column. Please run migrations.",
          details: errorDetail,
          solution: "Run 'npx prisma migrate dev' to update your database schema."
        }, { status: 500 });
      }
      
      return NextResponse.json(
        { message: `Error creating manager: ${errorDetail}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error creating manager:", error);
    return NextResponse.json(
      { message: `Error creating manager: ${error.message}` },
      { status: 500 }
    );
  }
}
