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

    let application: any = null;

    if (!isNaN(applicationId)) {
      try {
        // Fetch the application with all related data from Prisma
        application = await prisma.application.findUnique({
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
      } catch (e) {
        console.warn("Prisma application lookup warning:", e);
      }
    }

    // If not found in Prisma, lookup from Convex
    if (!application) {
      try {
        const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://befitting-stingray-964.convex.cloud';
        const res = await fetch(`${CONVEX_URL}/api/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: "applications:getApplicationById", args: { id } }),
        });
        const d = await res.json();
        if (d?.value) {
          const ca = d.value;
          application = {
            id: ca._id || ca.id,
            propertyId: ca.propertyId,
            tenantCognitoId: ca.tenantId,
            name: ca.name || "Student",
            email: ca.email || "",
            phoneNumber: ca.phoneNumber || "",
            message: ca.message || "",
            status: ca.status || "Pending",
            applicationDate: ca.applicationDate || new Date(ca.createdAt || Date.now()).toISOString(),
            createdAt: new Date(ca.createdAt || Date.now()),
            managerId: ca.managerId,
            property: ca.property ? {
              id: ca.property._id || ca.property.id,
              name: ca.property.name,
              description: ca.property.description,
              pricePerMonth: ca.property.pricePerMonth,
              address: ca.property.address || "",
              location: {
                address: ca.property.address || "",
                city: ca.property.city || "",
                suburb: ca.property.suburb || "",
              }
            } : null,
            room: ca.room ? {
              id: ca.room._id || ca.room.id,
              name: ca.room.name,
              pricePerMonth: ca.room.pricePerMonth,
            } : null,
            tenant: {
              firstName: (ca.name || "Student").split(' ')[0] || "Student",
              lastName: (ca.name || "").split(' ').slice(1).join(' ') || "",
              email: ca.email || "",
              phoneNumber: ca.phoneNumber || "",
            },
            user: {
              firstName: (ca.name || "Student").split(' ')[0] || "Student",
              lastName: (ca.name || "").split(' ').slice(1).join(' ') || "",
              email: ca.email || "",
              phoneNumber: ca.phoneNumber || "",
            }
          };
        }
      } catch (convexErr) {
        console.warn("Convex getApplicationById error:", convexErr);
      }
    }

    if (!application) {
      return NextResponse.json(
        { message: 'Application not found' },
        { status: 404 }
      );
    }

    // Check authorization - user must be either the manager of the property or an admin
    const isAdmin = authResult.userRole === 'admin' || 
                    (authResult.userEmail && (
                      authResult.userEmail.includes("sqwizoor") || 
                      authResult.userEmail.includes("banele") || 
                      authResult.userEmail.endsWith("@student24.co.za")
                    ));

    if (!isAdmin) {
      const managerId = application.managerId || application.property?.managerId || application.property?.managerCognitoId;
      const isManager = managerId === authResult.userId || managerId === authResult.userEmail;
      const isTenant = application.tenantId === authResult.userId || application.tenantCognitoId === authResult.userId || application.email === authResult.userEmail;
      if (!isManager && !isTenant) {
        return NextResponse.json(
          { message: 'Forbidden - You do not have permission to view this application' },
          { status: 403 }
        );
      }
    }

    // Return the application
    return NextResponse.json(application, {
      headers: {
        'Cache-Control': 'no-store',
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
