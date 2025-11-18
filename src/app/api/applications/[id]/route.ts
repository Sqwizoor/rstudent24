import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    
    console.log('🔐 Application detail auth result:', {
      isAuthenticated: authResult.isAuthenticated,
      userId: authResult.userId,
      userRole: authResult.userRole,
      provider: authResult.provider,
      message: authResult.message
    });
    
    if (!authResult.isAuthenticated) {
      console.error('❌ Authentication failed for application detail');
      return NextResponse.json({ 
        message: authResult.message || 'Unauthorized',
        debug: process.env.NODE_ENV === 'development' ? authResult : undefined
      }, { status: 401 });
    }

    const { id } = await params;
    const applicationId = parseInt(id);

    if (isNaN(applicationId)) {
      return NextResponse.json(
        { message: 'Invalid application ID' },
        { status: 400 }
      );
    }

    // Fetch the application with all related data
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        property: {
          include: {
            location: true,
          },
        },
        room: true,
        tenant: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { message: 'Application not found' },
        { status: 404 }
      );
    }

    // Check authorization - user must be either the manager of the property or an admin
    if (authResult.userRole !== 'admin') {
      const property = await prisma.property.findUnique({
        where: { id: application.propertyId },
        select: { managerCognitoId: true },
      });

      if (!property || property.managerCognitoId !== authResult.userId) {
        return NextResponse.json(
          { message: 'Forbidden - You do not have permission to view this application' },
          { status: 403 }
        );
      }
    }

    // Return the application
    return NextResponse.json(application, {
      headers: {
        'Cache-Control': 'private, max-age=60',
        'Content-Type': 'application/json',
      },
    });
  } catch (err: any) {
    console.error('Error retrieving application:', err);
    return NextResponse.json(
      { message: `Error retrieving application: ${err.message}` },
      { status: 500 }
    );
  }
}

// Optional: DELETE endpoint to allow canceling/deleting applications
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const applicationId = parseInt(id);

    if (isNaN(applicationId)) {
      return NextResponse.json(
        { message: 'Invalid application ID' },
        { status: 400 }
      );
    }

    // Fetch the application to check authorization
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { propertyId: true },
    });

    if (!application) {
      return NextResponse.json(
        { message: 'Application not found' },
        { status: 404 }
      );
    }

    // Check authorization - user must be either the manager of the property or an admin
    if (authResult.userRole !== 'admin') {
      const property = await prisma.property.findUnique({
        where: { id: application.propertyId },
        select: { managerCognitoId: true },
      });

      if (!property || property.managerCognitoId !== authResult.userId) {
        return NextResponse.json(
          { message: 'Forbidden - You do not have permission to delete this application' },
          { status: 403 }
        );
      }
    }

    // Delete the application
    const deletedApplication = await prisma.application.delete({
      where: { id: applicationId },
    });

    return NextResponse.json(deletedApplication, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (err: any) {
    console.error('Error deleting application:', err);
    return NextResponse.json(
      { message: `Error deleting application: ${err.message}` },
      { status: 500 }
    );
  }
}
