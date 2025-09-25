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
    
    // Fetch manager identifiers to exclude them from tenant results
    const managerIdentifiers = await prisma.manager.findMany({
      select: { cognitoId: true, email: true }
    });

    type ManagerIdentifier = { cognitoId: string | null; email: string | null };

    const managerIdList = managerIdentifiers
      .map((manager: ManagerIdentifier) => manager.cognitoId)
      .filter((id: string | null): id is string => Boolean(id));

    const managerEmailList = managerIdentifiers
      .map((manager: ManagerIdentifier) => manager.email?.toLowerCase())
      .filter((email: string | null | undefined): email is string => Boolean(email));

    const tenantFilters: Record<string, unknown>[] = [];

    if (managerIdList.length > 0) {
      tenantFilters.push({ cognitoId: { notIn: managerIdList } });
    }

    const tenantWhereClause = tenantFilters.length > 0
      ? { AND: tenantFilters }
      : undefined;

    // Get all tenants from the database (excluding managers)
    const tenants = await prisma.tenant.findMany({
      where: tenantWhereClause,
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
      name: string | null;
      email: string;
      phoneNumber: string | null;
      favorites: { id: number }[];
      applications: { id: number }[];
      leases: { id: number }[];
    }

    // Format the response to include counts
  // Exclude any tenant whose email matches a manager email (case-insensitive)
  const managerEmailSet = new Set(managerEmailList.map((e: string) => e.toLowerCase()));

  const filteredTenants = tenants.filter((t: TenantWithRelations) => !managerEmailSet.has(t.email.toLowerCase()));

  const formattedTenants = filteredTenants.map((tenant: TenantWithRelations) => {
      const nameParts = (tenant.name ?? "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      const [firstName = "", ...rest] = nameParts;
      const lastName = rest.join(" ");

      return {
        id: tenant.id,
        cognitoId: tenant.cognitoId,
        name: tenant.name ?? "",
        firstName,
        lastName,
        email: tenant.email,
        phoneNumber: tenant.phoneNumber || "",
        favoriteCount: tenant.favorites.length,
        applicationCount: tenant.applications.length,
        leaseCount: tenant.leases.length
      };
    });
    
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
