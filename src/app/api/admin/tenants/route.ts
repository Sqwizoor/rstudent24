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
    let managers: any[] = [];
    try {
      managers = await prisma.manager.findMany({
        select: { email: true, cognitoId: true }
      });
    } catch (mErr) {
      console.warn("Prisma manager fetch in tenants route warning:", mErr);
    }
    
    const managerEmails = managers.map((m: any) => m.email?.toLowerCase()).filter(Boolean);
    const managerCognitoIds = managers.map((m: any) => m.cognitoId).filter(Boolean);
    
    // Get all tenants from the database but exclude those who are also managers
    let tenants: any[] = [];
    try {
      tenants = await prisma.tenant.findMany({
        where: {
          AND: [
            { email: { notIn: managerEmails } },
            { cognitoId: { notIn: managerCognitoIds } }
          ]
        },
        select: {
          id: true,
          cognitoId: true,
          name: true,
          email: true,
          phoneNumber: true,
          favorites: { select: { id: true } },
          applications: { select: { id: true } },
          leases: { select: { id: true } }
        },
        orderBy: { name: 'asc' }
      });
    } catch (tErr) {
      console.warn("Prisma tenants fetch warning:", tErr);
    }

    // Format the response to include counts
    const formattedTenants = tenants.map((tenant: any) => {
      const nameParts = (tenant.name ?? "").trim().split(/\s+/).filter(Boolean);
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
        favoriteCount: tenant.favorites?.length || 0,
        applicationCount: tenant.applications?.length || 0,
        leaseCount: tenant.leases?.length || 0
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
              id: ct._id || ct.userId || String(Math.floor(Math.random() * 100000)),
              cognitoId: ct.userId || ct._id,
              name: ct.name || ct.email,
              firstName: firstName || ct.name,
              lastName: lastName || "",
              email: ct.email,
              phoneNumber: ct.phoneNumber || "",
              favoriteCount: 0,
              applicationCount: 0,
              leaseCount: 0,
            });
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
    return NextResponse.json([], { status: 200 });
  }
}
