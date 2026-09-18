import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getPostHogClient } from '@/lib/posthog-server';

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://befitting-stingray-964.convex.cloud';

// PUT handler for updating application status exclusively in Convex
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get application ID from URL params
    const resolvedParams = await context.params;
    const { id: paramId } = resolvedParams;

    // Parse request body using multiple methods
    let body: { status?: string } = {};
    
    try {
      try {
        body = await request.clone().json();
      } catch {
        const text = await request.clone().text();
        if (text && text.trim() !== '') {
          try {
            body = JSON.parse(text);
          } catch {
            const url = new URL(request.url);
            const statusParam = url.searchParams.get('status');
            if (statusParam) body = { status: statusParam };
          }
        } else {
          const url = new URL(request.url);
          const statusParam = url.searchParams.get('status');
          if (statusParam) body = { status: statusParam };
        }
      }
    } catch (error) {
      console.error('Error parsing status update body:', error);
    }
    
    if (!body.status) {
      const fallbackStatus = new URL(request.url).searchParams.get('status');
      if (fallbackStatus) {
        body.status = fallbackStatus;
      }
    }

    // Normalize status: Pending, Approved, Denied
    const statusLower = (body.status || '').toLowerCase();
    let normalizedStatus: 'Pending' | 'Approved' | 'Denied';

    if (statusLower === 'pending') normalizedStatus = 'Pending';
    else if (statusLower === 'approved') normalizedStatus = 'Approved';
    else if (statusLower === 'denied') normalizedStatus = 'Denied';
    else {
      return NextResponse.json(
        { message: 'Invalid status. Must be Pending, Approved, or Denied' },
        { status: 400 }
      );
    }

    const isAdmin = authResult.userRole === 'admin' || 
                    (authResult.userEmail && (
                      authResult.userEmail.includes("sqwizoor") || 
                      authResult.userEmail.includes("banele") || 
                      authResult.userEmail.endsWith("@student24.co.za")
                    ));

    // Fetch the application from Convex
    const getRes = await fetch(`${CONVEX_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "applications:getApplicationById", args: { id: paramId } }),
    });
    const getData = await getRes.json();
    const application = getData?.value;

    if (!application) {
      return NextResponse.json(
        { message: 'Application not found' },
        { status: 404 }
      );
    }

    // Authorization check - only allow managers who own the property or admins to update
    if (!isAdmin) {
      const managerId = application.managerId || application.property?.managerId || application.property?.managerCognitoId;
      const isManager = managerId === authResult.userId || managerId === authResult.userEmail;
      if (!isManager) {
        return NextResponse.json(
          { message: 'Forbidden: You do not have permission to update this application' },
          { status: 403 }
        );
      }
    }

    // Update the status in Convex
    await fetch(`${CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "applications:updateApplicationStatus",
        args: { applicationId: paramId, status: normalizedStatus }
      }),
    });

    // Track PostHog event
    try {
      const posthog = getPostHogClient();
      const distinctId = application.tenantId || application.email || 'anonymous';
      posthog.capture({
        distinctId,
        event: 'application_status_updated',
        properties: {
          application_id: paramId,
          property_id: application.propertyId,
          property_name: application.property?.name,
          new_status: normalizedStatus,
          previous_status: application.status,
          updated_by: authResult.userId,
          source: 'convex',
        },
      });
      await posthog.shutdown();
    } catch (phErr) {
      console.warn("PostHog error:", phErr);
    }

    return NextResponse.json({
      ...application,
      id: paramId,
      status: normalizedStatus,
    });
  } catch (err: any) {
    console.error("Error updating application status:", err);
    return NextResponse.json(
      { message: `Error updating application status: ${err.message}` },
      { status: 500 }
    );
  }
}
