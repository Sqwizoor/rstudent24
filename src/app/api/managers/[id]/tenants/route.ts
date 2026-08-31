import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// Define interfaces for type safety
interface Location {
  id: number;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

interface Property {
  id: number;
  title: string;
  address: string;
  location: Location;
}

interface Tenant {
  id: number;
  cognitoId: string;
  name: string;
  email: string;
  phoneNumber: string;
}

interface Application {
  id: number;
  status: string;
  tenant?: Tenant;
  property?: Property;
}

// GET handler for tenants associated with a manager's properties
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Ensure params is properly awaited
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Only allow managers to access their own tenants or admins to access any manager's tenants
    if (authResult.userRole !== 'admin' && authResult.userId !== id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const propertyId = searchParams.get('propertyId');
    
    // Find properties for this manager with location data included
    let properties: any[] = [];
    try {
      properties = await prisma.property.findMany({
        where: { managerCognitoId: id },
        select: { id: true, title: true, address: true, location: true },
      });
    } catch (dbErr) {
      console.warn("Prisma manager property query warning:", dbErr);
    }
    
    const propertyIds = properties.map((p) => p.id);
    const tenantMap = new Map();

    // 1. Fetch applications from Prisma if propertyIds exist
    if (propertyIds.length > 0) {
      try {
        const applicationsQuery: any = {
          where: { propertyId: { in: propertyIds } },
          include: { tenant: true, property: { include: { location: true } } },
        };
        if (status && status !== 'all') {
          applicationsQuery.where.status = status;
        }

        const applications = await prisma.application.findMany(applicationsQuery);
        applications.forEach((app: any) => {
          if (app.tenant) {
            const tenant = app.tenant;
            const property = app.property;
            const location = property?.location;
            
            tenantMap.set(tenant.cognitoId || tenant.email, {
              ...tenant,
              propertyDetails: {
                id: property?.id,
                title: property?.title || property?.name || "Property",
                address: property?.address || "",
                city: location?.city || 'Unknown',
                status: app.status
              },
              applicationStatus: app.status,
              applicationId: app.id
            });
          }
        });
      } catch (appErr) {
        console.warn("Prisma applications query warning:", appErr);
      }
    }

    // 2. Fetch applications from Convex for this manager
    try {
      const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://hardy-bird-543.convex.cloud';
      const res = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "applications:getManagerApplications", args: { managerId: id } }),
      });
      const data = await res.json();
      if (Array.isArray(data?.value)) {
        for (const ca of data.value) {
          const key = ca.tenantId || ca.email;
          if (!tenantMap.has(key)) {
            tenantMap.set(key, {
              id: ca._id,
              cognitoId: ca.tenantId,
              name: ca.name || "Student Tenant",
              email: ca.email || "",
              phoneNumber: ca.phoneNumber || "",
              propertyDetails: {
                id: ca.propertyId,
                title: ca.property?.name || "Property",
                address: ca.property?.address || "",
                city: ca.property?.city || "South Africa",
                status: ca.status || "Pending",
              },
              applicationStatus: ca.status || "Pending",
              applicationId: ca._id,
            });
          }
        }
      }
    } catch (convexErr) {
      console.warn("Convex manager tenants fetch warning:", convexErr);
    }
    
    // Convert map to array
    const tenants = Array.from(tenantMap.values());
    return NextResponse.json(tenants);
  } catch (err: any) {
    console.error("Error retrieving manager tenants:", err);
    return NextResponse.json([], { status: 200 });
  }
}
