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

    // Ensure disabled_properties table exists (non-destructive, used to track disabled properties without a schema migration)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS disabled_properties (
        property_id INTEGER PRIMARY KEY,
        disabled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        disabled_by TEXT
      )
    `);

    // Record the disabled property (upsert)
    const adminId = authResult.userId || 'unknown';
    await prisma.$executeRawUnsafe(
      `INSERT INTO disabled_properties (property_id, disabled_at, disabled_by)
       VALUES (${id}, NOW(), ${adminId})
       ON CONFLICT (property_id) DO UPDATE SET disabled_at = NOW(), disabled_by = EXCLUDED.disabled_by`
    );

    return NextResponse.json({ message: 'Property disabled', id });
  } catch (error: any) {
    console.error('Error disabling property (admin):', error);
    return NextResponse.json({ message: error?.message || 'Error disabling property' }, { status: 500 });
  }
}
