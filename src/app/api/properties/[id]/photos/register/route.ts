import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAuth(req, ['manager']);
    if (!auth.isAuthenticated) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const { id } = await params; const propertyId = parseInt(id,10);
    if (isNaN(propertyId)) return NextResponse.json({ message: 'Invalid property id' }, { status: 400 });
    const body = await req.json();
    const { photoUrls, replace = false, featuredIndex = 0 } = body || {};
    if (!Array.isArray(photoUrls) || photoUrls.length === 0) {
      return NextResponse.json({ message: 'photoUrls array required' }, { status: 400 });
    }
    const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { photoUrls: true }});
    if (!property) return NextResponse.json({ message: 'Property not found' }, { status: 404 });

    let newArray: string[];
    if (replace) {
      newArray = [...photoUrls];
    } else {
      newArray = [...(property.photoUrls || []), ...photoUrls];
    }
    // Reorder for featured (ensure valid index)
    if (newArray.length > 1 && featuredIndex >=0 && featuredIndex < newArray.length) {
      const clone = [...newArray];
      const [feat] = clone.splice(featuredIndex,1);
      newArray = [feat, ...clone];
    }
    await prisma.property.update({ where: { id: propertyId }, data: { photoUrls: newArray }});
    return NextResponse.json({ message: 'Registered photos', total: newArray.length, photoUrls: newArray });
  } catch (e:any) {
    return NextResponse.json({ message: 'Failed to register photos', error: e.message }, { status: 500 });
  }
}
