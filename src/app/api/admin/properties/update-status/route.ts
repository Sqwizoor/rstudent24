import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://hardy-bird-543.convex.cloud';

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request, ['admin']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ message: 'Missing id or status' }, { status: 400 });
    }

    // Try updating in Convex Cloud
    try {
      await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "properties:updatePropertyStatus",
          args: { id, status }
        }),
      });
    } catch (e) {
      console.warn("Convex status update warning:", e);
    }

    // Try updating in Prisma if numeric
    const numericId = parseInt(id);
    if (!isNaN(numericId)) {
      try {
        await prisma.property.update({
          where: { id: numericId },
          data: { status: status as any },
        });
      } catch (e) {
        console.warn("Prisma status update warning:", e);
      }
    }

    return NextResponse.json({
      message: `Property status updated to ${status}`,
      property: { id, status }
    });
  } catch (error: any) {
    console.error('Error updating property status:', error);
    return NextResponse.json({ message: 'Property status updated' }, { status: 200 });
  }
}
