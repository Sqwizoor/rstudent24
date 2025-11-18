import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// Using the shared Prisma client instance from @/lib/prisma

// GET handler for a specific manager
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Ensure params is resolved if it's a Promise
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Only allow managers to access their own data or admins to access any manager
    if (authResult.userRole !== 'admin' && authResult.userId !== id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    
    // Find manager by Cognito ID
    const manager = await prisma.manager.findUnique({
      where: { cognitoId: id },
    });

    if (!manager) {
      return NextResponse.json({ message: "Manager not found" }, { status: 404 });
    }

    return NextResponse.json(manager);
  } catch (err: any) {
    console.error("Error retrieving manager:", err);
    return NextResponse.json(
      { message: `Error retrieving manager: ${err.message}` },
      { status: 500 }
    );
  }
}

// PUT handler for updating a manager
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Ensure params is resolved if it's a Promise
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Only allow managers to update their own data or admins to update any manager
    if (authResult.userRole !== 'admin' && authResult.userId !== id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    
    // Check if manager exists
    const existingManager = await prisma.manager.findUnique({
      where: { cognitoId: id },
    });

    if (!existingManager) {
      return NextResponse.json({ message: "Manager not found" }, { status: 404 });
    }

    // Parse the request body
    const body = await request.json();
    
    // Update manager
    const updatedManager = await prisma.manager.update({
      where: { cognitoId: id },
      data: {
        email: body.email || existingManager.email,
        firstName: body.firstName || existingManager.firstName,
        lastName: body.lastName || existingManager.lastName,
        phone: body.phone || existingManager.phone,
        companyName: body.companyName || existingManager.companyName,
        // Add any other fields that can be updated
      },
    });

    return NextResponse.json(updatedManager);
  } catch (err: any) {
    console.error("Error updating manager:", err);
    return NextResponse.json(
      { message: `Error updating manager: ${err.message}` },
      { status: 500 }
    );
  }
}

// DELETE handler for deleting a manager (admin only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Ensure params is resolved if it's a Promise
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    // Verify authentication and role
    const authResult = await verifyAuth(request, ['admin']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if manager exists
    const existingManager = await prisma.manager.findUnique({
      where: { cognitoId: id },
    });

    if (!existingManager) {
      return NextResponse.json({ message: "Manager not found" }, { status: 404 });
    }

    // Delete manager
    await prisma.manager.delete({
      where: { cognitoId: id },
    });

    return NextResponse.json({ message: "Manager deleted successfully", id });
  } catch (err: any) {
    console.error("Error deleting manager:", err);
    return NextResponse.json(
      { message: `Error deleting manager: ${err.message}` },
      { status: 500 }
    );
  }
}
