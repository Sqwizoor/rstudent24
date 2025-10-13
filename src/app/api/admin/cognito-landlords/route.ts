import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Require admin role, consistent with other admin routes
    const auth = await verifyAuth(request, ["admin"]);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    type ManagerRecord = {
      name: string | null;
      email: string | null;
      phoneNumber: string | null;
      status: string | null;
      cognitoId: string | null;
    };

    // Use DB to list managers/landlords; avoid direct SDK dependency
    const managers: ManagerRecord[] = await prisma.manager.findMany({
      select: {
        name: true,
        email: true,
        phoneNumber: true,
        status: true,
        cognitoId: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const landlords = managers.map((m: ManagerRecord) => ({
      username: m.email ?? m.cognitoId,
      userId: m.cognitoId,
      email: m.email ?? undefined,
      phoneNumber: m.phoneNumber ?? undefined,
      status: m.status ?? undefined,
      attributes: {
        email: m.email ?? "",
        name: m.name ?? "",
        role: "manager",
        sub: m.cognitoId ?? "",
      },
    }));

    return NextResponse.json(landlords);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch landlords" }, { status: 500 });
  }
}
