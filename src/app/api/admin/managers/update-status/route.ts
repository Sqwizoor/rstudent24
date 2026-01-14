import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { ManagerStatus } from '@prisma/client';

// GET handler for updating manager status (admin only)
// Using GET with URL parameters to avoid body parsing issues in Next.js
export async function GET(request: NextRequest) {
  try {
    // Verify authentication and role
    const authResult = await verifyAuth(request, ['admin']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Log request details for debugging
    console.log('Request URL:', request.url);
    
    // Get parameters from URL instead of body
    const url = new URL(request.url);
    const cognitoId = url.searchParams.get('cognitoId');
    const status = url.searchParams.get('status');
    const notes = url.searchParams.get('notes');
    
    console.log('URL parameters:', { cognitoId, status, notes });

    // Validate required fields
    if (!cognitoId || !status) {
      return NextResponse.json({ 
        message: "Missing required fields",
        missingFields: {
          cognitoId: !cognitoId,
          status: !status
        }
      }, { status: 400 });
    }

    console.log(`Attempting to update manager with cognitoId: ${cognitoId} to status: ${status}`);

    // Check if manager exists
    const existingManager = await prisma.manager.findUnique({
      where: { cognitoId },
    });

    if (!existingManager) {
      return NextResponse.json({ 
        message: "Manager not found"
      }, { status: 404 });
    }

    // Validate the status value
    const validStatuses = ['Pending', 'Active', 'Disabled', 'Banned'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        message: `Invalid status value. Must be one of: ${validStatuses.join(', ')}`
      }, { status: 400 });
    }

    console.log(`Updating manager ${existingManager.name} (${cognitoId}) from ${existingManager.status} to ${status}`);
    
    // Update manager status
    const updatedManager = await prisma.manager.update({
      where: { cognitoId },
      data: {
        status: status as ManagerStatus,
        // If status is Active and manager wasn't previously Active, set approvedAt
        ...(status === 'Active' && existingManager.status !== 'Active' ? { approvedAt: new Date() } : {}),
        // We ignore notes since there's no notes field in the Manager schema
      },
    });

    console.log(`Successfully updated manager status. New status: ${updatedManager.status}`);
    // Cascade delete logic removed to preserve data for banned/disabled landlords
    // Properties will be hidden from public view by the GET /api/properties endpoint filtering
    // Applications and other data will remain accessible to users who have already applied
    return NextResponse.json(updatedManager);
  } catch (error: any) {
    console.error("Unhandled error in manager status update:", error);
    return NextResponse.json(
      { message: `Error updating manager status: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
