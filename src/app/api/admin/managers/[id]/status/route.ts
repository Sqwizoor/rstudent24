import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// PUT handler for updating manager status (admin only)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify authentication and role
    const authResult = await verifyAuth(request, ['admin']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get and validate the id parameter
    // In Next.js App Router, params must be awaited before accessing properties
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ message: 'Missing id parameter' }, { status: 400 });
    }
    
    console.log('Attempting to update manager status for cognitoId:', id);
    
    // Parse the request body directly without using stream operations
    let requestBody: { status?: string; notes?: string };
    
    try {
      // Parse JSON directly from the request
      requestBody = await request.json();
      console.log('Parsed request body:', requestBody);
    } catch (parseError) {
      console.error('Failed to parse request JSON:', parseError);
      return NextResponse.json({ 
        message: 'Invalid JSON format in request body. Make sure the Content-Type is application/json.' 
      }, { status: 400 });
    }
    
    // Extract status and notes from the request body
    const { status, notes } = requestBody;

    // Validate required fields
    if (!status) {
      return NextResponse.json({ 
        message: "Missing required fields",
        missingFields: {
          status: !status
        }
      }, { status: 400 });
    }

    console.log(`Attempting to update manager with cognitoId: ${id} to status: ${status}`);

    // Check if manager exists
    let existingManager;
    try {
      existingManager = await prisma.manager.findUnique({
        where: { cognitoId: id },
      });

      if (!existingManager) {
        return NextResponse.json({ 
          message: "Manager not found"
        }, { status: 404 });
      }
    } catch (dbError) {
      console.error("Error finding manager:", dbError);
      return NextResponse.json(
        { message: `Database error finding manager: ${dbError instanceof Error ? dbError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }

    // Validate the status value
    const validStatuses = ['Pending', 'Active', 'Disabled', 'Banned'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        message: `Invalid status value. Must be one of: ${validStatuses.join(', ')}`
      }, { status: 400 });
    }

    // Update manager status
    try {
      console.log(`Updating manager ${existingManager.name} (${id}) from ${existingManager.status} to ${status}`);
      
      const updatedManager = await prisma.manager.update({
        where: { cognitoId: id },
        data: {
          status,
          // If status is Active and manager wasn't previously Active, set approvedAt
          ...(status === 'Active' && existingManager.status !== 'Active' ? { approvedAt: new Date() } : {}),
          // Store notes if provided
          ...(notes ? { notes } : {})
        },
      });

      console.log(`Successfully updated manager status. New status: ${updatedManager.status}`);
      return NextResponse.json(updatedManager);
    } catch (updateError) {
      console.error("Error during manager status update operation:", updateError);
      return NextResponse.json(
        { message: `Database error updating manager: ${updateError instanceof Error ? updateError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Unhandled error in manager status update:", error);
    return NextResponse.json(
      { message: `Error updating manager status: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
