import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { queryCache } from '@/lib/queryCache';
import { getPostHogClient } from '@/lib/posthog-server';

export const dynamic = 'force-dynamic';

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
    
    const isAdmin = authResult.userRole === 'admin' || 
                    (authResult.userEmail && (
                      authResult.userEmail.includes("sqwizoor") || 
                      authResult.userEmail.includes("banele") || 
                      authResult.userEmail.endsWith("@student24.co.za")
                    ));

    // Check cache first (bypass for admins to ensure fresh live data)
    const cacheKey = queryCache.getKey('applications', {
      userId,
      userType,
      status,
      propertyId
    });
    
    if (!isAdmin) {
      const cached = queryCache.get(cacheKey);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        return NextResponse.json(cached, {
          headers: {
            'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
            'Content-Type': 'application/json',
          },
        });
      }
    }
    
    // Get applications from Prisma
    let applications: any[] = [];
    try {
      applications = await prisma.application.findMany(query);
    } catch (e) {
      console.warn("Prisma application fetch warning:", e);
    }

    // Merge applications from Convex
    try {
      const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://hardy-bird-543.convex.cloud';
      const managerIdToQuery = isAdmin ? "admin" : (userId || authResult.userId || "admin");
      const res = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "applications:getManagerApplications", args: { managerId: managerIdToQuery } }),
      });
      const data = await res.json();
      if (Array.isArray(data?.value)) {
        const existingIds = new Set(applications.map(a => String(a.id)));
        for (const ca of data.value) {
          if (!existingIds.has(String(ca._id))) {
            existingIds.add(String(ca._id));
            applications.push({
              id: ca._id,
              propertyId: ca.propertyId,
              tenantCognitoId: ca.tenantId,
              name: ca.name || "Student",
              email: ca.email || "",
              phoneNumber: ca.phoneNumber || "",
              message: ca.message || "",
              status: ca.status || "Pending",
              applicationDate: ca.applicationDate || new Date(ca.createdAt || Date.now()).toISOString(),
              createdAt: new Date(ca.createdAt || Date.now()),
              property: ca.property ? {
                id: ca.property._id,
                name: ca.property.name,
                description: ca.property.description,
                pricePerMonth: ca.property.pricePerMonth,
                location: {
                  address: ca.property.address || "",
                  city: ca.property.city || "",
                }
              } : null,
            });
          }
        }
      }
    } catch (convexErr) {
      console.warn("Convex application merge warning:", convexErr);
    }
    
    if (!isAdmin) {
      queryCache.set(cacheKey, applications, 1800);
    }
    
    return NextResponse.json(applications, {
      headers: {
        'Cache-Control': 'no-store',
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
      const searchId = body.tenantCognitoId || authResult.userId || '';
      tenantCognitoId = searchId;
      
      // For Google auth, try to find tenant by cognitoId (which might be email) or email field
      tenant = await prisma.tenant.findFirst({
        where: {
          OR: [
            { cognitoId: searchId },
            { email: searchId },
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
      const searchId = body.tenantCognitoId || '';
      tenantCognitoId = searchId;
      
      // For Cognito auth, use standard lookup
      tenant = await prisma.tenant.findUnique({
        where: { cognitoId: searchId }
      });
      
      // If authenticated but tenant not found, log warning but allow submission
      if (!tenant) {
        console.warn('Cognito authenticated user but tenant record not found:', tenantCognitoId);
        tenantCognitoId = null;
      } else {
        tenantCognitoId = tenant.cognitoId;
      }
    }
    
    // Check if property exists in Prisma (optional)
    let propertyName = "Student Accommodation";
    let managerId = "admin";

    try {
      if (!isNaN(parseInt(body.propertyId))) {
        const p = await prisma.property.findUnique({
          where: { id: parseInt(body.propertyId) }
        });
        if (p) {
          propertyName = p.title || p.name || propertyName;
          managerId = p.managerCognitoId || managerId;
        }
      }
    } catch (e) {
      console.warn("Prisma property lookup warning:", e);
    }

    // Submit directly to Convex Cloud
    const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://hardy-bird-543.convex.cloud';
    let convexResult = null;

    try {
      const res = await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "applications:submitApplication",
          args: {
            propertyId: body.propertyId,
            roomId: body.roomId || undefined,
            tenantId: tenantCognitoId || authResult.userId || body.email,
            managerId: body.managerId || managerId,
            name: body.name,
            email: body.email,
            phoneNumber: body.phoneNumber,
            message: body.message || "",
            status: "Pending",
          }
        }),
      });
      if (res.ok) {
        const resData = await res.json();
        convexResult = resData?.value;
        console.log("Convex application submission success:", convexResult);
      }
    } catch (convexErr) {
      console.warn("Convex submission warning:", convexErr);
    }

    const applicationPayload = {
      id: convexResult || `app_${Date.now()}`,
      propertyId: body.propertyId,
      tenantCognitoId: tenantCognitoId || authResult.userId || body.email,
      applicationDate: new Date().toISOString(),
      status: 'Pending',
      name: body.name,
      email: body.email,
      phoneNumber: body.phoneNumber,
      message: body.message || '',
      property: {
        id: body.propertyId,
        name: propertyName,
        location: {
          address: body.address || "",
          city: body.city || "South Africa"
        }
      }
    };

    // Track application_created event with PostHog (server-side)
    try {
      const posthog = getPostHogClient();
      const distinctId = tenantCognitoId || body.email || 'anonymous';
      posthog.capture({
        distinctId,
        event: 'application_created',
        properties: {
          application_id: applicationPayload.id,
          property_id: body.propertyId,
          property_name: propertyName,
          applicant_email: body.email,
          source: 'api',
        },
      });
      await posthog.shutdown();
    } catch (phErr) {
      console.warn("PostHog event error:", phErr);
    }

    queryCache.invalidateAll();
    return NextResponse.json(applicationPayload, { status: 201 });
  } catch (err: any) {
    console.error("Error creating application:", err);
    return NextResponse.json(
      { message: `Error creating application: ${err.message}` },
      { status: 500 }
    );
  }
}
