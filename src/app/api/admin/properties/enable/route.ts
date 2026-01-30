import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request, ['admin']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const idParam = url.searchParams.get('id');
    if (!idParam) return NextResponse.json({ message: 'Missing id' }, { status: 400 });

    const id = parseInt(idParam, 10);
    if (isNaN(id)) return NextResponse.json({ message: 'Invalid id' }, { status: 400 });

    // Ensure table exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS disabled_properties (
        property_id INTEGER PRIMARY KEY,
        disabled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        disabled_by TEXT
      )
    `);

    // Delete the disabled marker
    await prisma.$executeRawUnsafe(`DELETE FROM disabled_properties WHERE property_id = ${id}`);

    // Invalidate the Next.js cache so the re-enabled property appears on the frontend immediately
    revalidateTag('properties', {});

    return NextResponse.json({ message: 'Property enabled', id });
  } catch (err: any) {
    console.error('Error enabling property:', err);
    return NextResponse.json({ message: err?.message || 'Server error' }, { status: 500 });
  }
}
