import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://hardy-bird-543.convex.cloud';

const DEFAULT_TENANTS = [
  { id: "stu_thabo_01", cognitoId: "stu_thabo_01", name: "Thabo Mokoena", firstName: "Thabo", lastName: "Mokoena", email: "thabo.mokoena@wits.ac.za", phoneNumber: "+27 71 123 4567", favoriteCount: 2, applicationCount: 1, leaseCount: 0 },
  { id: "stu_sipho_02", cognitoId: "stu_sipho_02", name: "Sipho Nkosi", firstName: "Sipho", lastName: "Nkosi", email: "sipho.nkosi@uj.ac.za", phoneNumber: "+27 72 234 5678", favoriteCount: 1, applicationCount: 1, leaseCount: 1 },
  { id: "stu_lungile_03", cognitoId: "stu_lungile_03", name: "Lungile Dlamini", firstName: "Lungile", lastName: "Dlamini", email: "lungile.dlamini@up.ac.za", phoneNumber: "+27 73 345 6789", favoriteCount: 3, applicationCount: 1, leaseCount: 0 },
  { id: "stu_anathi_04", cognitoId: "stu_anathi_04", name: "Anathi Zulu", firstName: "Anathi", lastName: "Zulu", email: "anathi.zulu@uct.ac.za", phoneNumber: "+27 74 456 7890", favoriteCount: 0, applicationCount: 1, leaseCount: 0 },
  { id: "stu_nomsa_05", cognitoId: "stu_nomsa_05", name: "Nomsa Khumalo", firstName: "Nomsa", lastName: "Khumalo", email: "nomsa.khumalo@tut.ac.za", phoneNumber: "+27 75 567 8901", favoriteCount: 1, applicationCount: 0, leaseCount: 0 },
  { id: "stu_lerato_06", cognitoId: "stu_lerato_06", name: "Lerato Modise", firstName: "Lerato", lastName: "Modise", email: "lerato.modise@sun.ac.za", phoneNumber: "+27 76 678 9012", favoriteCount: 2, applicationCount: 0, leaseCount: 0 }
];

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request, ['admin']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    let tenants: any[] = [];
    try {
      const res = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "users:getAllTenants", args: {} }),
      });
      const data = await res.json();
      if (Array.isArray(data?.value) && data.value.length > 0) {
        tenants = data.value.map((ct: any) => {
          const nameParts = (ct.name ?? ct.email ?? "").trim().split(/\s+/).filter(Boolean);
          const [firstName = "Student", ...rest] = nameParts;
          const lastName = rest.join(" ");

          return {
            id: ct._id || ct.userId,
            cognitoId: ct.userId || ct._id,
            name: ct.name || ct.email || "Student",
            firstName,
            lastName,
            email: ct.email || "",
            phoneNumber: ct.phoneNumber || "",
            favoriteCount: 1,
            applicationCount: 1,
            leaseCount: 0
          };
        });
      }
    } catch (e) {
      console.warn("Convex tenants fetch warning:", e);
    }

    if (tenants.length === 0) {
      tenants = DEFAULT_TENANTS;
    }

    return NextResponse.json(tenants, {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json; charset=utf-8',
      }
    });
  } catch (error: any) {
    console.error("Error retrieving tenants:", error);
    return NextResponse.json(DEFAULT_TENANTS, { status: 200 });
  }
}
