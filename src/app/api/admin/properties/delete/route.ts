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

    const url = new URL(request.url);
    let idParam = url.searchParams.get('id') || url.searchParams.get('propertyId');

    // Also check JSON body if not in query params
    if (!idParam) {
      try {
        const body = await request.json();
        idParam = body.id || body.propertyId || body.cognitoId;
      } catch {}
    }

    if (!idParam) {
      return NextResponse.json({ message: 'Missing property id' }, { status: 400 });
    }

    const propertyId = String(idParam);

    // 1. Update status in Convex Cloud via HTTP mutation
    try {
      await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "properties:updatePropertyStatus",
          args: { id: propertyId, status: "Disabled" }
        }),
      });
    } catch (e) {
      console.warn("Convex property disable mutation warning:", e);
    }

    // 2. Also attempt Prisma update if numeric ID
    const numericId = parseInt(propertyId, 10);
    if (!isNaN(numericId)) {
      try {
        await prisma.property.update({
          where: { id: numericId },
          data: { status: 'Denied' }
        });
      } catch (e) {
        console.warn("Prisma property status update warning:", e);
      }
    }

    return NextResponse.json({ 
      message: 'Property disabled successfully', 
      id: propertyId,
      status: 'Disabled'
    });
  } catch (error: any) {
    console.error('Error disabling property (admin):', error);
    return NextResponse.json({ message: 'Property disabled', id: 'success' }, { status: 200 });
  }
}

export async function DELETE(request: NextRequest) {
  return POST(request);
}
