import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request, ['admin']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const idParam = url.searchParams.get('id');
    if (!idParam) {
      return NextResponse.json({ message: 'Missing property id' }, { status: 400 });
    }

    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid property id' }, { status: 400 });
    }

    const existing = await prisma.property.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: 'Property not found' }, { status: 404 });
    }

    // Delete dependent records in a transaction
    const propIds = [id];
    await prisma.$transaction([
      prisma.review.deleteMany({ where: { propertyId: { in: propIds } } }),
      prisma.application.deleteMany({ where: { propertyId: { in: propIds } } }),
      prisma.lease.deleteMany({ where: { propertyId: { in: propIds } } }),
      prisma.room.deleteMany({ where: { propertyId: { in: propIds } } }),
      prisma.property.deleteMany({ where: { id: { in: propIds } } }),
    ]);

    return NextResponse.json({ message: 'Property deleted', id });
  } catch (error: any) {
    console.error('Error deleting property (admin):', error);
    return NextResponse.json({ message: error?.message || 'Error deleting property' }, { status: 500 });
  }
}
