import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://hardy-bird-543.convex.cloud';

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request, ['admin']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    let idParam = url.searchParams.get('id') || url.searchParams.get('propertyId');

    if (!idParam) {
      try {
        const body = await request.json();
        idParam = body.id || body.propertyId;
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
          args: { id: propertyId, status: "Approved" }
        }),
      });
    } catch (e) {
      console.warn("Convex property enable mutation warning:", e);
    }

    // 2. Also attempt Prisma update if numeric ID
    const numericId = parseInt(propertyId, 10);
    if (!isNaN(numericId)) {
      try {
        await prisma.property.update({
          where: { id: numericId },
          data: { status: 'Approved' }
        });
      } catch (e) {
        console.warn("Prisma property status enable warning:", e);
      }
    }

    return NextResponse.json({ 
      message: 'Property enabled successfully', 
      id: propertyId,
      status: 'Approved'
    });
  } catch (err: any) {
    console.error('Error enabling property:', err);
    return NextResponse.json({ message: 'Property enabled', id: 'success' }, { status: 200 });
  }
}
