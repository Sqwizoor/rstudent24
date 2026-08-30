import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://hardy-bird-543.convex.cloud';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, role, phoneNumber } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = (name || cleanEmail.split("@")[0]).trim();
    const cleanRole = role === "landlord" ? "manager" : "tenant";
    const userId = `usr_${Buffer.from(cleanEmail).toString("hex").slice(0, 16)}`;

    // 1. Sync to Convex as primary datastore
    try {
      const mutationName = cleanRole === "manager" ? "users:upsertManager" : "users:upsertTenant";
      const convexRes = await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: mutationName,
          args: {
            userId,
            email: cleanEmail,
            name: cleanName,
            phoneNumber: phoneNumber || undefined,
          },
        }),
      });

      if (convexRes.ok) {
        console.log(`✅ Registered user ${cleanEmail} (${cleanRole}) in Convex`);
      }
    } catch (convexErr) {
      console.warn("Convex registration warning:", convexErr);
    }

    // 2. Sync to Prisma if available
    try {
      if (cleanRole === "manager") {
        await prisma.manager.upsert({
          where: { cognitoId: userId },
          update: { email: cleanEmail, name: cleanName, phoneNumber: phoneNumber || null },
          create: {
            cognitoId: userId,
            email: cleanEmail,
            name: cleanName,
            phoneNumber: phoneNumber || null,
          },
        });
      } else {
        await prisma.tenant.upsert({
          where: { cognitoId: userId },
          update: { email: cleanEmail, name: cleanName, phoneNumber: phoneNumber || null },
          create: {
            cognitoId: userId,
            email: cleanEmail,
            name: cleanName,
            phoneNumber: phoneNumber || null,
          },
        });
      }
    } catch (prismaErr) {
      // Ignore Prisma errors as Convex is source of truth
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: cleanEmail,
        name: cleanName,
        role: cleanRole,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to register account" },
      { status: 500 }
    );
  }
}
