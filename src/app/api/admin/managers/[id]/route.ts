import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

// Define types for property and related entities
type Tenant = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
};

type Lease = {
  id: number;
  tenant: Tenant | null;
};

type Room = {
  id: number;
};

type Property = {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  rooms: Room[];
  leases: Lease[];
};

// Type for properties returned from Prisma query
type PrismaProperty = {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  rooms: { id: number }[];
  leases: {
    id: number;
    tenant: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
    } | null;
  }[];
};

// GET /api/admin/managers/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Await the params since they are now a Promise in Next.js 14+
  const { id } = await params;
  try {
    // Verify authentication and role
    const authResult = await verifyAuth(request, ['admin']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const managerId = parseInt(id);

    if (isNaN(managerId)) {
      return NextResponse.json({ message: "Invalid manager ID" }, { status: 400 });
    }

    // Fetch manager details
    const manager = await prisma.manager.findUnique({
      where: { id: managerId },
    });

    if (!manager) {
      return NextResponse.json({ message: "Manager not found" }, { status: 404 });
    }

    // Fetch properties managed by this landlord
    const properties = await prisma.property.findMany({
      where: { managerId: managerId },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        state: true,
        rooms: {
          select: {
            id: true,
          },
        },
        leases: {
          select: {
            id: true,
            tenant: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Transform properties to include tenant count
    const transformedProperties = properties.map((property: PrismaProperty) => {
      // Get unique tenants from leases
      const tenantSet = new Set();
      property.leases.forEach(lease => {
        if (lease.tenant) {
          tenantSet.add(lease.tenant.id);
        }
      });

      return {
        id: property.id,
        name: property.name,
        address: `${property.address}, ${property.city}, ${property.state}`,
        tenantCount: tenantSet.size,
        roomCount: property.rooms.length
      };
    });

    // Get all tenants from this manager's properties
    const tenants = properties.flatMap((property: PrismaProperty) => 
      property.leases.map(lease => lease.tenant)
    ).filter(Boolean);

    // Remove duplicates (tenants with multiple leases)
    const uniqueTenants = Array.from(
      new Map(tenants.map((tenant: Tenant) => [tenant.id, tenant])).values()
    );

    // Map tenants to include property name
    const tenantsWithProperties = [];
    for (const tenant of uniqueTenants as Tenant[]) {
      // Find which property this tenant has a lease in
      for (const property of properties as PrismaProperty[]) {
        const hasTenant = property.leases.some(
          lease => lease.tenant && lease.tenant.id === tenant.id
        );
        
        if (hasTenant) {
          tenantsWithProperties.push({
            id: tenant.id,
            name: `${tenant.firstName} ${tenant.lastName}`,
            email: tenant.email,
            propertyName: property.name
          });
        }
      }
    }

    // Calculate statistics
    const totalProperties = transformedProperties.length;
    const totalTenants = uniqueTenants.length;
    const totalRooms = properties.reduce((acc: number, property: PrismaProperty) => acc + property.rooms.length, 0);
    const occupiedRooms = properties.reduce((acc: number, property: PrismaProperty) => 
      acc + property.leases.length, 0);
    
    const occupancyRate = totalRooms > 0 
      ? `${Math.round((occupiedRooms / totalRooms) * 100)}%` 
      : "0%";

    // Calculate average rent
    let totalRent = 0;
    let rentCount = 0;

    for (const property of properties as PrismaProperty[]) {
      const leases = await prisma.lease.findMany({
        where: { propertyId: property.id },
        select: { rent: true }
      });

      for (const lease of leases) {
        if (lease.rent) {
          totalRent += parseFloat(lease.rent.replace(/[^0-9.]/g, ''));
          rentCount++;
        }
      }
    }

    const averageRent = rentCount > 0 
      ? `R${Math.round(totalRent / rentCount).toLocaleString()}` 
      : "R0";

    // Construct and return the manager details with related data
    const managerDetails = {
      id: manager.id,
      name: manager.name,
      email: manager.email,
      phoneNumber: manager.phoneNumber || "",
      status: manager.status || "Active",
      properties: transformedProperties,
      tenants: tenantsWithProperties,
      stats: {
        propertyCount: totalProperties,
        tenantCount: totalTenants,
        occupancyRate: occupancyRate,
        averageRent: averageRent
      }
    };

    return NextResponse.json(managerDetails);

  } catch (error) {
    console.error("Error fetching manager details:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch manager details" }),
      { status: 500 }
    );
  }
}
