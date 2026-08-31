import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://hardy-bird-543.convex.cloud';

const DEFAULT_TENANTS = [
  { id: "stu_thabo_01", cognitoId: "stu_thabo_01", name: "Thabo Mokoena", firstName: "Thabo", lastName: "Mokoena", email: "thabo.mokoena@wits.ac.za", phoneNumber: "+27 71 123 4567" },
  { id: "stu_sipho_02", cognitoId: "stu_sipho_02", name: "Sipho Nkosi", firstName: "Sipho", lastName: "Nkosi", email: "sipho.nkosi@uj.ac.za", phoneNumber: "+27 72 234 5678" },
  { id: "stu_lungile_03", cognitoId: "stu_lungile_03", name: "Lungile Dlamini", firstName: "Lungile", lastName: "Dlamini", email: "lungile.dlamini@up.ac.za", phoneNumber: "+27 73 345 6789" },
  { id: "stu_anathi_04", cognitoId: "stu_anathi_04", name: "Anathi Zulu", firstName: "Anathi", lastName: "Zulu", email: "anathi.zulu@uct.ac.za", phoneNumber: "+27 74 456 7890" },
  { id: "stu_nomsa_05", cognitoId: "stu_nomsa_05", name: "Nomsa Khumalo", firstName: "Nomsa", lastName: "Khumalo", email: "nomsa.khumalo@tut.ac.za", phoneNumber: "+27 75 567 8901" },
  { id: "stu_lerato_06", cognitoId: "stu_lerato_06", name: "Lerato Modise", firstName: "Lerato", lastName: "Modise", email: "lerato.modise@sun.ac.za", phoneNumber: "+27 76 678 9012" }
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authResult = await verifyAuth(request, ['admin']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    let tenant: any = null;

    try {
      const res = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "users:getAllTenants", args: {} }),
      });
      const data = await res.json();
      if (Array.isArray(data?.value)) {
        tenant = data.value.find((t: any) => String(t._id) === id || String(t.userId) === id || String(t.email) === id);
      }
    } catch (e) {
      console.warn("Convex tenant find error:", e);
    }

    if (!tenant) {
      const matched = DEFAULT_TENANTS.find(t => t.id === id || t.cognitoId === id) || DEFAULT_TENANTS[0];
      tenant = {
        _id: matched.id,
        userId: matched.cognitoId,
        name: matched.name,
        email: matched.email,
        phoneNumber: matched.phoneNumber
      };
    }

    const nameParts = (tenant.name ?? tenant.email ?? "").trim().split(/\s+/).filter(Boolean);
    const [firstName = "Student", ...rest] = nameParts;
    const lastName = rest.join(" ");

    return NextResponse.json({
      tenantInfo: {
        id: tenant._id || tenant.userId,
        cognitoId: tenant.userId || tenant._id,
        name: tenant.name,
        firstName,
        lastName,
        email: tenant.email,
        phoneNumber: tenant.phoneNumber || "",
        favoriteCount: 2,
        applicationCount: 1,
        leaseCount: 0
      },
      favorites: [
        {
          id: 1,
          name: "Dunvista Mansions",
          address: "32 Juta Street, Braamfontein",
          landlord: "Southpoint Accommodation",
          landlordId: 1,
          landlordEmail: "info@staysouthpoint.co.za",
          propertyId: 1
        }
      ],
      applications: [
        {
          id: 1,
          propertyName: "Dunvista Mansions",
          propertyId: 1,
          landlord: "Southpoint Accommodation",
          landlordId: 1,
          landlordEmail: "info@staysouthpoint.co.za",
          status: "Pending",
          date: new Date().toISOString().split('T')[0]
        }
      ],
      leases: []
    });
  } catch (error: any) {
    console.error("Error retrieving tenant details:", error);
    return NextResponse.json({ error: "Tenant details error" }, { status: 500 });
  }
}
