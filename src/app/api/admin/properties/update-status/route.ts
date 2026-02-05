import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { revalidateTag } from "next/cache";

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

    const validStatuses = ['Pending', 'Approved', 'Denied'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ message: 'Invalid status. Must be Pending, Approved, or Denied.' }, { status: 400 });
    }

    const updatedProperty = await prisma.property.update({
      where: { id: parseInt(id) },
      data: { status: status as any } as any,
    });

    // Handle 'Approved' status by removing from disabled_properties if it was there
    if (status === 'Approved') {
      try {
        await prisma.$executeRawUnsafe(
          `DELETE FROM disabled_properties WHERE property_id = ${parseInt(id)}`
        );
      } catch (err) {
        console.warn('Could not remove from disabled_properties:', err);
      }
    } else if (status === 'Denied') {
        // If denied, maybe we should also disable it
        try {
            const adminId = authResult.userId || 'admin';
            await prisma.$executeRawUnsafe(
                `INSERT INTO disabled_properties (property_id, disabled_at, disabled_by)
                 VALUES (${parseInt(id)}, NOW(), '${adminId.replace(/'/g, "''")}')
                 ON CONFLICT (property_id) DO UPDATE SET disabled_at = NOW(), disabled_by = EXCLUDED.disabled_by`
            );
        } catch (err) {
            console.warn('Could not add to disabled_properties:', err);
        }
    }

    revalidateTag('properties', {});

    return NextResponse.json(updatedProperty);
  } catch (error: any) {
    console.error('Error updating property status:', error);
    return NextResponse.json({ message: error?.message || 'Error updating property status' }, { status: 500 });
  }
}
