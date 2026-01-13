import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import { queryCache } from '@/lib/queryCache';

// Handler for removing managers (admin only)
export async function GET(request: NextRequest) {
  try {
    // Verify authentication and role
    const authResult = await verifyAuth(request, ['admin']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get parameters from URL
    const url = new URL(request.url);
    const cognitoId = url.searchParams.get('cognitoId');
    
    console.log(`Attempting to delete manager with cognitoId: ${cognitoId}`);

    // Validate required fields
    if (!cognitoId) {
      return NextResponse.json({ 
        message: "Missing required cognitoId parameter"
      }, { status: 400 });
    }

    // Check if manager exists
    const existingManager = await prisma.manager.findUnique({
      where: { cognitoId },
    });

    if (!existingManager) {
      return NextResponse.json({ 
        message: "Manager not found"
      }, { status: 404 });
    }

    console.log(`Deleting manager ${existingManager.name} (${cognitoId}) with email ${existingManager.email}`);
    
    // Special handling for demo account
    if (existingManager.email === 'manager@example.com') {
      console.log('Detected demo account - using special cleanup procedure');
    }
    
    // Find any properties related to this manager so we can hide them without deleting
    const properties = await prisma.property.findMany({
      where: { managerCognitoId: cognitoId },
      select: { id: true }
    });

    console.log(`Found ${properties.length} properties linked to manager ${cognitoId}`);

    // Ensure the disabled_properties table exists so properties can be hidden without data loss
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS disabled_properties (
        property_id INTEGER PRIMARY KEY,
        disabled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        disabled_by TEXT
      )
    `);

    const actingUserId = authResult.userId || authResult.userRole || 'unknown';

    if (properties.length > 0) {
      await Promise.all(
        properties.map(({ id }) =>
          prisma.$executeRaw(
            Prisma.sql`INSERT INTO disabled_properties (property_id, disabled_at, disabled_by)
                        VALUES (${id}, NOW(), ${actingUserId})
                        ON CONFLICT (property_id) DO UPDATE SET disabled_at = NOW(), disabled_by = EXCLUDED.disabled_by`
          )
        )
      );
    }

    // Update manager status to Disabled instead of deleting any records
    const updatedManager = await prisma.manager.update({
      where: { cognitoId },
      data: { status: 'Disabled' }
    });

    // Invalidate cached property data so the UI reflects the change immediately
    queryCache.invalidateAll();

    console.log(`Manager ${updatedManager.name} disabled. Properties hidden: ${properties.length}`);

    return NextResponse.json({
      success: true,
      message: `Manager ${updatedManager.name} has been disabled`,
      manager: updatedManager,
      disabledPropertyCount: properties.length
    });
  } catch (error: any) {
    console.error("Unhandled error in manager deletion:", error);
    return NextResponse.json(
      { message: `Error deleting manager: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
