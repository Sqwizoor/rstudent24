import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { queryCache } from '@/lib/queryCache';

// ✅ ISR: Cache application data for 30 minutes (more volatile than properties)
export const revalidate = 1800;

// GET handler for applications with filtering
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const userType = searchParams.get('userType');
    const status = searchParams.get('status');
    const propertyId = searchParams.get('propertyId');
    
    // Build the query
    const query: any = {
      where: {},
      include: {
        property: {
          include: {
            location: true
          }
        },
        room: true,
        tenant: true
      },
      orderBy: {
        applicationDate: 'desc'
      }
    };
    
    // Filter by user type and ID
    if (userId && userType) {
      if (userType === 'tenant') {
        // For Google auth users, we might need to search by email as well
        if (authResult.provider === 'google') {
          query.where.OR = [
            { tenantCognitoId: userId },
            { tenant: { email: userId } },
            { tenant: { cognitoId: userId } }
          ];
        } else {
          query.where.tenantCognitoId = userId;
        }
        
        // Tenants can only see their own applications
        if (authResult.userRole !== 'admin' && authResult.userId !== userId) {
          return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }
      } else if (userType === 'manager') {
        // For managers, we need to find applications for properties they manage
        query.where.property = {
          managerCognitoId: userId
        };
        
        // Managers can only see applications for their properties
        if (authResult.userRole !== 'admin' && authResult.userId !== userId) {
          return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }
      }
    }
    
    // Filter by application status
    if (status && status !== 'all') {
      query.where.status = status;
    }
    
    // Filter by property
    if (propertyId) {
      query.where.propertyId = parseInt(propertyId);
    }
    
    // ✅ Step 2: Check cache first
    const cacheKey = queryCache.getKey('applications', {
      userId,
      userType,
      status,
      propertyId
    });
    const cached = queryCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
          'Content-Type': 'application/json',
        },
      });
    }
    
    // Get applications
    const applications = await prisma.application.findMany(query);
    
    // ✅ Step 4: Store in cache for 30 minutes
    queryCache.set(cacheKey, applications, 1800);
    
    // ✅ Step 5: Return with cache headers
    return NextResponse.json(applications, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
        'Content-Type': 'application/json',
      },
    });
  } catch (err: any) {
    console.error("Error retrieving applications:", err);
    return NextResponse.json(
      { message: `Error retrieving applications: ${err.message}` },
      { status: 500 }
    );
  }
}

// POST handler for creating a new application
export async function POST(request: NextRequest) {
  try {
    // Verify authentication - REQUIRED for students
    // Only Google (NextAuth) authenticated users can submit applications
    const authResult = await verifyAuth(request);
    
    if (!authResult.isAuthenticated) {
      console.log('Unauthorized application attempt - user not authenticated');
      return NextResponse.json({ message: 'Unauthorized. You must be logged in to submit an application.' }, { status: 401 });
    }
    
    // Only allow students/tenants to submit applications (reject managers and admins)
    if (authResult.userRole && (authResult.userRole === 'manager' || authResult.userRole === 'admin')) {
      console.log('Forbidden - managers and admins cannot submit applications');
      return NextResponse.json({ message: 'Forbidden. Managers and admins cannot submit applications.' }, { status: 403 });
    }
    
    console.log('Application submission - Authenticated user:', authResult.userId, 'Provider:', authResult.provider);
    
    // Safely parse the request body with error handling
    let body;
    try {
      // Clone the request to ensure we can read the body
      const clonedRequest = request.clone();
      const contentType = request.headers.get('content-type');
      
      // Check if content type is JSON
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Invalid content type:', contentType);
        return NextResponse.json({ 
          message: 'Invalid content type. Expected application/json' 
        }, { status: 400 });
      }
      
      // Get the text first to validate it's not empty
      const text = await clonedRequest.text();
      console.log('Request body text:', text);
      
      if (!text || text.trim() === '') {
        return NextResponse.json({
          message: 'Empty request body'
        }, { status: 400 });
      }
      
      // Parse the JSON
      body = JSON.parse(text);
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json({
        message: `Failed to parse request body: ${error instanceof Error ? error.message : 'Unknown error'}`
      }, { status: 400 });
    }
    
    // Validate required fields for authenticated users
    if (!body.propertyId || !body.name || !body.email || !body.phoneNumber) {
      return NextResponse.json(
        { message: 'Missing required fields: propertyId, name, email, and phoneNumber are required' },
        { status: 400 }
      );
    }
    
    // Handle tenant ID - try to link to tenant account if exists
    let tenantCognitoId: string | null = null;
    let tenant = null;
    
    if (authResult.provider === 'google') {
      // For Google auth, use the email as the tenant ID, or get it from the body
      tenantCognitoId = body.tenantCognitoId || authResult.userId || '';
      
      // For Google auth, try to find tenant by cognitoId (which might be email) or email field
      tenant = await prisma.tenant.findFirst({
        where: {
          OR: [
            { cognitoId: tenantCognitoId },
            { email: tenantCognitoId },
            { email: authResult.userId }
          ]
        }
      });
      
      // If Google user but tenant not found, log warning but allow submission
      if (!tenant) {
        console.warn('Google authenticated user but tenant record not found:', tenantCognitoId);
        tenantCognitoId = null;
      } else {
        tenantCognitoId = tenant.cognitoId;
      }
    } else {
      // For Cognito auth, use the standard tenantCognitoId from body
      tenantCognitoId = body.tenantCognitoId || '';
      
      // For Cognito auth, use standard lookup
      tenant = await prisma.tenant.findUnique({
        where: { cognitoId: tenantCognitoId }
      });
      
      // If authenticated but tenant not found, log warning but allow submission
      if (!tenant) {
        console.warn('Cognito authenticated user but tenant record not found:', tenantCognitoId);
        tenantCognitoId = null;
      } else {
        tenantCognitoId = tenant.cognitoId;
      }
    }
    
    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: parseInt(body.propertyId) }
    });
    
    if (!property) {
      return NextResponse.json(
        { message: 'Property not found' },
        { status: 404 }
      );
    }

    // Check if room exists (if roomId is provided)
    let room = null;
    if (body.roomId) {
      room = await prisma.room.findUnique({
        where: { id: parseInt(body.roomId) }
      });
      
      if (!room) {
        return NextResponse.json(
          { message: 'Room not found' },
          { status: 404 }
        );
      }

      // Verify room belongs to the property
      if (room.propertyId !== parseInt(body.propertyId)) {
        return NextResponse.json(
          { message: 'Room does not belong to the specified property' },
          { status: 400 }
        );
      }
    }
    
    // Create the application using the form data
    // For unauthenticated users, tenantCognitoId will be null
    const application = await prisma.application.create({
      data: {
        propertyId: parseInt(body.propertyId),
        roomId: body.roomId ? parseInt(body.roomId) : null,
        tenantCognitoId: tenantCognitoId, // Can be null for unauthenticated users
        applicationDate: new Date(),
        status: 'Pending',
        name: body.name,
        email: body.email,
        phoneNumber: body.phoneNumber,
        message: body.message || ''
      },
      include: {
        property: {
          include: {
            location: true
          }
        },
        room: true,
        tenant: true
      }
    });
    
    console.log('Application created successfully:', application.id);
    
    // ✅ Invalidate cache after creation
    queryCache.invalidateAll();
    
    return NextResponse.json(application, { status: 201 });
  } catch (err: any) {
    console.error("Error creating application:", err);
    return NextResponse.json(
      { message: `Error creating application: ${err.message}` },
      { status: 500 }
    );
  }
}
