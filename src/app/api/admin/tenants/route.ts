import { verifyAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log("Admin tenants - GET: Starting request");
    
    // Verify authentication and role
    const authResult = await verifyAuth(request, ['admin']);
    if (!authResult.isAuthenticated) {
      console.log("Admin tenants - GET: Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    
    // Get all tenants from the database
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        cognitoId: true,
        name: true,
        email: true,
        phoneNumber: true,
        favorites: {
          select: {
            id: true
          }
        },
        applications: {
          select: {
            id: true
          }
        },
        leases: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    // Define type for the tenant object from Prisma
    type TenantWithRelations = {
      id: number;
      cognitoId: string;
      name: string;
      email: string;
      phoneNumber: string | null;
      favorites: { id: number }[];
      applications: { id: number }[];
      leases: { id: number }[];
    }

    // Format the response to include counts
    const formattedTenants = tenants.map((tenant: TenantWithRelations) => ({
      id: tenant.id,
      cognitoId: tenant.cognitoId,
      name: tenant.name,
      email: tenant.email,
      phoneNumber: tenant.phoneNumber || "",
      favoriteCount: tenant.favorites.length,
      applicationCount: tenant.applications.length,
      leaseCount: tenant.leases.length
    }));
    
    console.log(`Admin tenants - GET: Successfully fetched ${formattedTenants.length} tenants`);
    
    return NextResponse.json(formattedTenants);
  } catch (error) {
    console.error("Admin tenants - GET: Error fetching tenants", error);
    return NextResponse.json(
      { error: "Failed to fetch tenants" },
      { status: 500 }
    );
  }
}
