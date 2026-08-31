import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://hardy-bird-543.convex.cloud';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    const isAdmin = auth.isAuthenticated && (
      auth.userRole === "admin" || 
      (auth.userEmail && (
        auth.userEmail.includes("sqwizoor") || 
        auth.userEmail.includes("banele") || 
        auth.userEmail.endsWith("@student24.co.za")
      ))
    );

    type ManagerRecord = {
      id: number | string;
      name: string | null;
      email: string | null;
      phoneNumber: string | null;
      status: string | null;
      cognitoId: string | null;
    };

    // 1. Fetch Prisma managers
    let prismaManagers: ManagerRecord[] = [];
    try {
      prismaManagers = await prisma.manager.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          status: true,
          cognitoId: true,
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (e) {
      console.warn("Prisma manager query warning:", e);
    }

    // 2. Fetch Convex managers
    let convexManagers: any[] = [];
    try {
      const res = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "users:getAllManagers", args: {} }),
      });
      const data = await res.json();
      if (Array.isArray(data?.value)) {
        convexManagers = data.value;
      }
    } catch (e) {
      console.warn("Convex manager query warning:", e);
    }

    // Deduplicate by email / userId
    const landlordMap = new Map<string, any>();

    // Put Convex managers in map
    for (const cm of convexManagers) {
      const key = (cm.email || cm.userId || cm._id).toLowerCase();
      landlordMap.set(key, {
        username: cm.name || cm.email || cm.userId,
        id: cm._id,
        userId: cm.userId || cm._id,
        email: cm.email ?? undefined,
        phoneNumber: cm.phoneNumber ?? undefined,
        status: cm.status ?? "Active",
        attributes: {
          email: cm.email ?? "",
          name: cm.name ?? "",
          role: "manager",
          sub: cm.userId ?? cm._id,
        },
      });
    }

    // Add Prisma managers if not already present
    for (const pm of prismaManagers) {
      const key = (pm.email || pm.cognitoId || String(pm.id)).toLowerCase();
      if (!landlordMap.has(key)) {
        landlordMap.set(key, {
          username: pm.name || pm.email || pm.cognitoId,
          id: pm.id,
          userId: pm.cognitoId || String(pm.id),
          email: pm.email ?? undefined,
          phoneNumber: pm.phoneNumber ?? undefined,
          status: pm.status ?? "Active",
          attributes: {
            email: pm.email ?? "",
            name: pm.name ?? "",
            role: "manager",
            sub: pm.cognitoId ?? String(pm.id),
          },
        });
      }
    }

    const landlords = Array.from(landlordMap.values());
    return NextResponse.json(landlords);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch landlords" }, { status: 500 });
  }
}
