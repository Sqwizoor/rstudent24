import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getPostHogClient } from '@/lib/posthog-server';

export const dynamic = 'force-dynamic';

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://befitting-stingray-964.convex.cloud';

// GET handler for applications with filtering (uses Convex cloud directly)
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
    
    const isAdmin = authResult.userRole === 'admin' || 
                    (authResult.userEmail && (
                      authResult.userEmail.includes("sqwizoor") || 
                      authResult.userEmail.includes("banele") || 
                      authResult.userEmail.endsWith("@student24.co.za")
                    ));

    // Authorization checks
    if (userType === 'tenant' && !isAdmin && authResult.userId !== userId && authResult.userEmail !== userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    if (userType === 'manager' && !isAdmin && authResult.userId !== userId && authResult.userEmail !== userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const applications: any[] = [];
    const seenIds = new Set<string>();

    if (userType === 'tenant') {
      // Query tenant applications from Convex
      const tenantKey = userId || authResult.userId || '';
      const tenantEmail = authResult.userEmail || '';
      
      const res = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "applications:getTenantApplications",
          args: { tenantId: tenantKey, email: tenantEmail || undefined }
        }),
      });
      const data = await res.json();
      if (Array.isArray(data?.value)) {
        for (const a of data.value) {
          const idStr = String(a._id || a.id);
          if (!seenIds.has(idStr)) {
            seenIds.add(idStr);
            applications.push(a);
          }
        }
      }
    } else if (userType === 'manager' && !isAdmin) {
      // Query manager applications from Convex for candidate manager IDs
      const candidateManagerIds = Array.from(new Set([
        userId,
        authResult.userId,
        authResult.userEmail
      ].filter(Boolean) as string[]));

      for (const mId of candidateManagerIds) {
        try {
          const res = await fetch(`${CONVEX_URL}/api/query`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              path: "applications:getManagerApplications",
              args: { managerId: mId }
            }),
          });
          const data = await res.json();
          if (Array.isArray(data?.value)) {
            for (const a of data.value) {
              const idStr = String(a._id || a.id);
              if (!seenIds.has(idStr)) {
                seenIds.add(idStr);
                applications.push(a);
              }
            }
          }
        } catch (err) {
          console.warn(`Error querying Convex manager applications for ${mId}:`, err);
        }
      }
    } else {
      // Admin query: retrieve all applications from Convex
      const res = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "applications:getAdminApplications",
          args: { limit: 2000 }
        }),
      });
      const data = await res.json();
      if (Array.isArray(data?.value)) {
        for (const a of data.value) {
          const idStr = String(a._id || a.id);
          if (!seenIds.has(idStr)) {
            seenIds.add(idStr);
            applications.push(a);
          }
        }
      }
    }

    // Filter by status if specified
    let filtered = applications;
    if (status && status !== 'all') {
      const statusLower = status.toLowerCase();
      filtered = filtered.filter((a) => (a.status || '').toLowerCase() === statusLower);
    }

    // Filter by propertyId if specified
    if (propertyId) {
      const propIdStr = String(propertyId);
      filtered = filtered.filter((a) => String(a.propertyId) === propIdStr);
    }

    // Map into normalized application objects
    const formatted = filtered.map((ca) => {
      const firstName = (ca.name || "Student").split(' ')[0] || "Student";
      const lastName = (ca.name || "").split(' ').slice(1).join(' ') || "";

      return {
        id: ca._id || ca.id,
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
          id: ca.property._id || ca.property.id,
          name: ca.property.name || "Student Accommodation",
          description: ca.property.description || "",
          pricePerMonth: ca.property.pricePerMonth || 0,
          address: ca.property.address || "",
          location: {
            address: ca.property.address || "",
            city: ca.property.city || "",
            suburb: ca.property.suburb || "",
          }
        } : null,
        tenant: {
          firstName,
          lastName,
          email: ca.email || "",
          phoneNumber: ca.phoneNumber || "",
        },
        user: {
          firstName,
          lastName,
          email: ca.email || "",
          phoneNumber: ca.phoneNumber || "",
        },
      };
    });

    return NextResponse.json(formatted, {
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

// POST handler for creating a new application in Convex
export async function POST(request: NextRequest) {
  try {
    // Verify authentication - REQUIRED for students
    const authResult = await verifyAuth(request);
    
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized. You must be logged in to submit an application.' }, { status: 401 });
    }
    
    // Only allow students/tenants to submit applications
    if (authResult.userRole && (authResult.userRole === 'manager' || authResult.userRole === 'admin')) {
      return NextResponse.json({ message: 'Forbidden. Managers and admins cannot submit applications.' }, { status: 403 });
    }
    
    // Safely parse request body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: 'Invalid JSON request body' }, { status: 400 });
    }
    
    // Validate required fields
    if (!body.propertyId || !body.name || !body.email || !body.phoneNumber) {
      return NextResponse.json(
        { message: 'Missing required fields: propertyId, name, email, and phoneNumber are required' },
        { status: 400 }
      );
    }
    
    const tenantId = authResult.userId || body.email;

    // Submit directly to Convex Cloud
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
            tenantId,
            managerId: body.managerId || "admin",
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
      }
    } catch (convexErr) {
      console.warn("Convex submission warning:", convexErr);
    }

    const applicationPayload = {
      id: convexResult || `app_${Date.now()}`,
      propertyId: body.propertyId,
      tenantCognitoId: tenantId,
      applicationDate: new Date().toISOString(),
      status: 'Pending',
      name: body.name,
      email: body.email,
      phoneNumber: body.phoneNumber,
      message: body.message || '',
      property: {
        id: body.propertyId,
        name: body.propertyName || "Student Accommodation",
        location: {
          address: body.address || "",
          city: body.city || "South Africa"
        }
      }
    };

    // Track application_created event with PostHog
    try {
      const posthog = getPostHogClient();
      const distinctId = tenantId || body.email || 'anonymous';
      posthog.capture({
        distinctId,
        event: 'application_created',
        properties: {
          application_id: applicationPayload.id,
          property_id: body.propertyId,
          applicant_email: body.email,
          source: 'convex',
        },
      });
      await posthog.shutdown();
    } catch (phErr) {
      console.warn("PostHog event error:", phErr);
    }

    return NextResponse.json(applicationPayload, { status: 201 });
  } catch (err: any) {
    console.error("Error creating application:", err);
    return NextResponse.json(
      { message: `Error creating application: ${err.message}` },
      { status: 500 }
    );
  }
}
