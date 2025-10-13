import { verifyAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // In Next.js App Router, dynamic route parameters must be awaited before accessing
    const { id } = await params;
    
    console.log(`Admin tenant details - GET: Starting request for tenant ID: ${id}`);
    
    // Verify authentication and role
    const authResult = await verifyAuth(request, ['admin']);
    if (!authResult.isAuthenticated) {
      console.log("Admin tenant details - GET: Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    
    // Get tenant ID from params
    const tenantId = id;
    
    // Get tenant details from the database with relationships
    const tenant = await prisma.tenant.findUnique({
      where: {
        id: parseInt(tenantId)
      },
      include: {
        favorites: {
          select: {
            id: true,
            property: {
              select: {
                id: true,
                name: true,
                address: true,
                manager: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        applications: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            property: {
              select: {
                id: true,
                name: true,
                manager: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        leases: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            rent: true,
            property: {
              select: {
                id: true,
                name: true,
                manager: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!tenant) {
      console.log(`Admin tenant details - GET: Tenant not found with ID: ${tenantId}`);
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }
    
    // Format the tenant details for the frontend
    const formattedTenant = {
      tenantInfo: {
        id: tenant.id,
        cognitoId: tenant.cognitoId,
        name: tenant.name,
        email: tenant.email,
        phoneNumber: tenant.phoneNumber || ""
      },
      favorites: tenant.favorites.map((favorite: { id: number; property: { id: number; name: string; address: string; manager: { id: number; cognitoId: string; name: string; email: string }}}) => ({
        id: favorite.id,
        name: favorite.property.name,
        address: favorite.property.address,
        landlord: favorite.property.manager.name,
        landlordId: favorite.property.manager.id,
        landlordEmail: favorite.property.manager.email,
        propertyId: favorite.property.id
      })),
      applications: tenant.applications.map((application: { id: number; property: { id: number; name: string; manager: { id: number; cognitoId: string; name: string; email: string } }; status: string; createdAt: Date }) => ({
        id: application.id,
        propertyName: application.property.name,
        propertyId: application.property.id,
        landlord: application.property.manager.name,
        landlordId: application.property.manager.id,
        landlordEmail: application.property.manager.email,
        status: application.status,
        date: application.createdAt.toISOString().split('T')[0] // Format date as YYYY-MM-DD
      })),
      leases: tenant.leases.map((lease: { id: number; property: { id: number; name: string; manager: { id: number; cognitoId: string; name: string; email: string } }; startDate: Date; endDate: Date; rent: number }) => ({
        id: lease.id,
        propertyName: lease.property.name,
        propertyId: lease.property.id,
        landlord: lease.property.manager.name,
        landlordId: lease.property.manager.id,
        landlordEmail: lease.property.manager.email,
        startDate: lease.startDate.toISOString().split('T')[0],
        endDate: lease.endDate.toISOString().split('T')[0],
        rent: `R${lease.rent.toLocaleString()}`
      }))
    };
    
    console.log(`Admin tenant details - GET: Successfully fetched details for tenant ${tenant.name}`);
    
    return NextResponse.json(formattedTenant);
  } catch (error) {
    console.error("Admin tenant details - GET: Error fetching tenant details", error);
    return NextResponse.json(
      { error: "Failed to fetch tenant details" },
      { status: 500 }
    );
  }
}
