import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { isExplicitAdminEmail } from '@/lib/constants';

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://hardy-bird-543.convex.cloud';

export async function GET(
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

    // Fetch application from Convex Cloud directly
    let application: any = null;
    try {
      const res = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "applications:getApplicationById", args: { id } }),
      });
      const d = await res.json();
      if (d?.value) {
        const ca = d.value;
        const firstName = (ca.name || "Student").split(' ')[0] || "Student";
        const lastName = (ca.name || "").split(' ').slice(1).join(' ') || "";

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
          property: {
            id: ca.property?._id || ca.property?.id || ca.propertyId || "",
            name: ca.property?.name || "Student Accommodation",
            description: ca.property?.description || "",
            pricePerMonth: Number(ca.property?.pricePerMonth) || 0,
            address: ca.property?.address || "",
            location: {
              address: ca.property?.address || "",
              city: ca.property?.city || "",
              suburb: ca.property?.suburb || "",
            }
          },
          room: ca.room ? {
            id: ca.room._id || ca.room.id || ca.roomId,
            name: ca.room.name || "Room",
            pricePerMonth: Number(ca.room.pricePerMonth) || 0,
          } : null,
          tenant: {
            firstName,
            lastName,
            email: ca.email || "",
            phoneNumber: ca.phoneNumber || "",
          },
          user: {
            firstName,
            lastName,
            email: ca.email || "",
            phoneNumber: ca.phoneNumber || "",
          }
        };
      }
    } catch (convexErr) {
      console.warn("Convex getApplicationById error:", convexErr);
    }

    if (!application) {
      return NextResponse.json(
        { message: 'Application not found' },
        { status: 404 }
      );
    }

    // Check authorization - user must be either the manager of the property, the tenant, or an admin
    const isAdmin = isExplicitAdminEmail(authResult.userEmail);

    if (!isAdmin) {
      const managerId = application.managerId || application.property?.managerId || application.property?.managerCognitoId;
      const isManager = managerId === authResult.userId || managerId === authResult.userEmail;
      const isTenant = application.tenantId === authResult.userId || 
                       application.tenantCognitoId === authResult.userId || 
                       application.email === authResult.userEmail;
      if (!isManager && !isTenant) {
        return NextResponse.json(
          { message: 'Forbidden - You do not have permission to view this application' },
          { status: 403 }
        );
      }
    }

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

// DELETE endpoint for applications in Convex
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

    // Fetch the application from Convex to check authorization
    const res = await fetch(`${CONVEX_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "applications:getApplicationById", args: { id } }),
    });
    const d = await res.json();
    const application = d?.value;

    if (!application) {
      return NextResponse.json(
        { message: 'Application not found' },
        { status: 404 }
      );
    }

    const isAdmin = isExplicitAdminEmail(authResult.userEmail);

    if (!isAdmin) {
      const managerId = application.managerId || application.property?.managerId || application.property?.managerCognitoId;
      const isManager = managerId === authResult.userId || managerId === authResult.userEmail;
      const isTenant = application.tenantId === authResult.userId || application.email === authResult.userEmail;

      if (!isManager && !isTenant) {
        return NextResponse.json(
          { message: 'Forbidden - You do not have permission to delete this application' },
          { status: 403 }
        );
      }
    }

    // Delete the application via Convex mutation
    await fetch(`${CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "applications:deleteApplication",
        args: { applicationId: id }
      }),
    });

    return NextResponse.json({ success: true, message: 'Application deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting application:', err);
    return NextResponse.json(
      { message: `Error deleting application: ${err.message}` },
      { status: 500 }
    );
  }
}
