import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await verifyAuth(request, ['admin']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const resolved = await params;
    const id = parseInt(resolved.id, 10);
    if (isNaN(id)) return NextResponse.json({ message: 'Invalid id' }, { status: 400 });

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        location: true,
        manager: true,
      },
    });

    if (!property) return NextResponse.json({ message: 'Property not found' }, { status: 404 });

    // Check disabled table
    let isDisabled = false;
    try {
      const res: any = await prisma.$queryRaw`SELECT 1 FROM disabled_properties WHERE property_id = ${id} LIMIT 1`;
      if (res && (Array.isArray(res) ? res.length > 0 : true)) isDisabled = true;
    } catch (err) {
      // ignore if table missing
      if ((err as any)?.message?.includes('relation "disabled_properties" does not exist')) {
        // no-op
      } else {
        console.error('Error checking disabled_properties:', err);
      }
    }

    return NextResponse.json({ ...property, isDisabled });
  } catch (err: any) {
    console.error('Error fetching admin property details:', err);
    return NextResponse.json({ message: err?.message || 'Server error' }, { status: 500 });
  }
}
