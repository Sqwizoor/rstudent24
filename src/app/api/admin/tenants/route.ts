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
    
    // First get all manager emails and cognito IDs to exclude them
    const managers = await prisma.manager.findMany({
      select: {
        email: true,
        cognitoId: true
      }
    });
    
    type ManagerIdentifier = {
      email: string;
      cognitoId: string;
    };
    
    const managerEmails = managers.map((m: ManagerIdentifier) => m.email.toLowerCase());
    const managerCognitoIds = managers.map((m: ManagerIdentifier) => m.cognitoId);
    
    console.log(`Admin tenants - GET: Found ${managers.length} managers to exclude`);
    console.log(`Admin tenants - GET: Manager emails to exclude:`, managerEmails);
    
    // Get all tenants from the database but exclude those who are also managers
    const tenants = await prisma.tenant.findMany({
      where: {
        AND: [
          {
            email: {
              notIn: managerEmails
            }
          },
          {
            cognitoId: {
              notIn: managerCognitoIds
            }
          }
        ]
      },
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
    const formattedTenants = tenants.map((tenant: TenantWithRelations) => {
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

    // Also fetch tenants from Convex
    try {
      const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://hardy-bird-543.convex.cloud';
      const res = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "users:getAllTenants", args: {} }),
      });
      const data = await res.json();
      if (Array.isArray(data?.value)) {
        const existingEmails = new Set(formattedTenants.map((t: any) => t.email?.toLowerCase()));
        for (const ct of data.value) {
          if (ct.email && !existingEmails.has(ct.email.toLowerCase())) {
            existingEmails.add(ct.email.toLowerCase());
            const nameParts = (ct.name ?? "").trim().split(/\s+/).filter(Boolean);
            const [firstName = "", ...rest] = nameParts;
            const lastName = rest.join(" ");

            formattedTenants.push({
              id: Number(ct._id) || Math.floor(Math.random() * 100000),
              cognitoId: ct.userId || ct._id,
              name: ct.name || ct.email,
              firstName: firstName || ct.name,
              lastName: lastName || "",
              email: ct.email,
              phoneNumber: ct.phoneNumber || "",
              favoriteCount: 0,
              applicationCount: 0,
              leaseCount: 0,
            } as any);
          }
        }
      }
    } catch (e) {
      console.warn("Convex tenant merge warning:", e);
    }

    console.log(`Admin tenants - GET: Returning ${formattedTenants.length} total students/tenants`);
    
    return NextResponse.json(formattedTenants);
  } catch (error) {
    console.error("Admin tenants - GET: Error fetching tenants", error);
    return NextResponse.json(
      { error: "Failed to fetch tenants" },
      { status: 500 }
    );
  }
}
