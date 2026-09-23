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
    
    // Check authorization: allow admin, or matching userId/email, or any authenticated manager/landlord
    const userEmail = (authResult.userEmail || (authResult as any).email || '').toLowerCase();
    const isAuthorized = 
      authResult.userRole === 'admin' ||
      authResult.userId === id ||
      userEmail === id.toLowerCase() ||
      authResult.userRole === 'manager';

    if (!isAuthorized) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const propertyId = searchParams.get('propertyId');
    
    // Find properties for this manager in Prisma if any
    let properties: any[] = [];
    try {
      properties = await prisma.property.findMany({
        where: { 
          OR: [
            { managerCognitoId: id },
            ...(userEmail ? [{ managerCognitoId: userEmail }] : [])
          ]
        },
        select: { id: true, title: true, address: true, location: true },
      });
    } catch (dbErr) {
      console.warn("Prisma manager property query warning:", dbErr);
    }
    
    const tenantMap = new Map();
    const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://befitting-stingray-964.convex.cloud';

    // MIGRATED_LANDLORD_LOOKUP for legacy/migrated IDs
    const MIGRATED_LANDLORD_LOOKUP: Record<string, string> = {
      "info@staysouthpoint.co.za": "50bc293c-c0c1-70b1-c593-4b2d2a4f1f40",
      "banelesouthflow@gmail.com": "602ca91c-5001-70c7-a78a-e9b1e36ce93e",
      "alexsouthflow2@gmail.com": "708c39ec-60d1-70d6-bd79-286d43e5cf40",
      "infokiarashomestay@gmail.com": "d04cc9ac-1001-708d-2b4c-9d877fbdf21b",
      "marketingadmin@mosaicgroup.co.za": "30bc291c-2021-70ee-bb87-d158fbaebee2",
      "parklanejohn@hotmail.com": "e0fce95c-d081-7011-3934-5fe8e083a64d",
      "urbanstudent@student24.co.za": "mgr_urban_05",
      "respublica@student24.co.za": "mgr_respublica_06",
      "campuskey@student24.co.za": "mgr_campuskey_07",
    };

    const searchIds = new Set<string>([id]);
    if (userEmail) searchIds.add(userEmail);
    if (MIGRATED_LANDLORD_LOOKUP[userEmail]) searchIds.add(MIGRATED_LANDLORD_LOOKUP[userEmail]);
    if (MIGRATED_LANDLORD_LOOKUP[id.toLowerCase()]) searchIds.add(MIGRATED_LANDLORD_LOOKUP[id.toLowerCase()]);

    // Fetch applications from Convex for each ID variant
    for (const searchId of searchIds) {
      try {
        const res = await fetch(`${CONVEX_URL}/api/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: "applications:getManagerApplications", args: { managerId: searchId } }),
        });
        const data = await res.json();
        if (Array.isArray(data?.value)) {
          for (const ca of data.value) {
            if (status && status !== 'all' && (ca.status || '').toLowerCase() !== status.toLowerCase()) {
              continue;
            }
            if (propertyId && propertyId !== 'all' && String(ca.propertyId) !== String(propertyId)) {
              continue;
            }
            const key = ca.tenantId || ca.email || ca._id;
            if (!tenantMap.has(key)) {
              const studentName = ca.name || 
                (ca.tenant ? `${ca.tenant.firstName || ''} ${ca.tenant.lastName || ''}`.trim() : '') ||
                (ca.user ? `${ca.user.firstName || ''} ${ca.user.lastName || ''}`.trim() : '') ||
                "Student Tenant";

              tenantMap.set(key, {
                id: ca._id,
                cognitoId: ca.tenantId || ca.userId || ca._id,
                name: studentName,
                email: ca.email || ca.tenant?.email || "",
                phoneNumber: ca.phoneNumber || ca.tenant?.phoneNumber || "",
                propertyDetails: {
                  id: ca.propertyId || (ca.property?._id || ca.property?.id || "prop"),
                  title: ca.property?.name || ca.property?.title || "Accommodation",
                  address: ca.property?.address || "",
                  city: ca.property?.city || "South Africa",
                  status: ca.status || "Pending",
                },
                applicationStatus: (ca.status || "Pending").toLowerCase(),
                applicationId: ca._id,
              });
            }
          }
        }
      } catch (convexErr) {
        console.warn(`Convex manager tenants warning for ${searchId}:`, convexErr);
      }
    }
    
    // Convert map to array
    const tenants = Array.from(tenantMap.values());
    return NextResponse.json(tenants);
  } catch (err: any) {
    console.error("Error retrieving manager tenants:", err);
    return NextResponse.json([], { status: 200 });
  }
}
