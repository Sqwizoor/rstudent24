import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { revalidateTag } from "next/cache";
import { PropertyStatus } from "@prisma/client";

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

    const validStatuses = Object.values(PropertyStatus);
    if (!validStatuses.includes(status as PropertyStatus)) {
      return NextResponse.json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
    }

    const numericId = parseInt(id);

    // Update the property status
    const updatedProperty = await prisma.property.update({
      where: { id: numericId },
      data: { status: status as PropertyStatus },
    });

    console.log(`Property ${numericId} status updated to ${status}`);

    // Handle 'Approved' status by removing from disabled_properties
    if (status === 'Approved') {
      try {
        // Use deleteMany to avoid error if record doesn't exist
        await prisma.disabledProperty.deleteMany({
          where: { propertyId: numericId }
        });
      } catch (err) {
        console.warn('Could not remove from disabled_properties:', err);
      }
    } else if (status === 'Denied') {
      try {
          const adminId = authResult.userId || 'admin';
          
          await prisma.disabledProperty.upsert({
            where: { propertyId: numericId },
            create: {
              propertyId: numericId,
              disabledBy: adminId,
              disabledAt: new Date()
            },
            update: {
              disabledBy: adminId,
              disabledAt: new Date()
            }
          });
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
