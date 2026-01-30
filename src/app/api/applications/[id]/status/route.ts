import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { getPostHogClient } from '@/lib/posthog-server';

// PUT handler for updating application status
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
    const id = parseInt(paramId);
    if (isNaN(id)) {
      return NextResponse.json(
        { message: 'Invalid application ID' },
        { status: 400 }
      );
    }

    // Parse request body using multiple methods to handle different scenarios
    let body: { status?: string } = {};
    
    try {
      // Get the request method and headers for logging
      console.log('Request method:', request.method);
      const headers = Object.fromEntries(request.headers.entries());
      console.log('Request headers:', headers);
      
      // Try multiple methods to get the body
      try {
        // First try regular json parsing
        body = await request.clone().json();
        console.log('Successfully parsed body with request.json():', body);
      } catch (jsonError) {
        console.log('Failed to parse with request.json(), trying text parsing...', jsonError);
        
        try {
          // If that fails, try getting as text and parsing
          const text = await request.clone().text();
          console.log('Raw request text:', text);
          
          if (text && text.trim() !== '') {
            try {
              body = JSON.parse(text);
              console.log('Successfully parsed body from text:', body);
            } catch (parseError) {
              console.log('Failed to parse text as JSON:', parseError);
              
              // Try to extract from URL if it's in the query string
              const url = new URL(request.url);
              const statusParam = url.searchParams.get('status');
              if (statusParam) {
                body = { status: statusParam };
                console.log('Using status from URL parameter:', body);
              }
            }
          } else {
            console.log('Request body text is empty, checking for status in URL');
            // Try to extract from URL
            const url = new URL(request.url);
            const statusParam = url.searchParams.get('status');
            if (statusParam) {
              body = { status: statusParam };
              console.log('Using status from URL parameter:', body);
            }
          }
        } catch (textError) {
          console.log('Failed to get request text:', textError);
        }
      }
    } catch (error) {
      console.error('General error processing request:', error);
      // Continue with the default body value
      console.log('Using default body:', body);
    }
    
    if (!body.status) {
      const fallbackStatus = new URL(request.url).searchParams.get('status');
      if (fallbackStatus) {
        body.status = fallbackStatus;
      }
    }

    console.log('Raw status value received:', body.status);
    
    // Normalize status to match Prisma enum exactly (case-sensitive!)
    // Prisma ApplicationStatus enum values are: Pending, Denied, Approved
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
    
    console.log('Normalized status value for Prisma:', normalizedStatus);

    // Find the application
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        property: true
      }
    });

    if (!application) {
      return NextResponse.json(
        { message: 'Application not found' },
        { status: 404 }
      );
    }

    // Authorization check - only allow managers who own the property or admins to update
    if (
      authResult.userRole !== 'admin' && 
      application.property.managerCognitoId !== authResult.userId
    ) {
      return NextResponse.json(
        { message: 'Forbidden: You do not have permission to update this application' },
        { status: 403 }
      );
    }

    // Update the application status using the normalized value
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: { status: normalizedStatus },
      include: {
        property: {
          include: {
            location: true,
          },
        },
        tenant: true,
        room: true,
      },
    });

    // If application is approved, optionally create a lease
    let lease = null;
    if (normalizedStatus === 'Approved' && application.tenantCognitoId) {
      const existingLease = await prisma.lease.findFirst({
        where: {
          propertyId: application.propertyId,
          tenantCognitoId: application.tenantCognitoId,
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
        },
      });

      if (!existingLease) {
        try {
          console.log('Creating new lease for approved application');

          const propertyDetails = updatedApplication.property ?? application.property;
          const rentAmount = propertyDetails?.pricePerMonth ??
                             (propertyDetails as any)?.price ??
                             1000;

          lease = await prisma.lease.create({
            data: {
              propertyId: application.propertyId,
              tenantCognitoId: application.tenantCognitoId,
              startDate: new Date(),
              endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
              rent: rentAmount,
              deposit: rentAmount,
            },
          });
          console.log('Lease created successfully:', lease);

          try {
            const tenant = await prisma.tenant.findUnique({
              where: { cognitoId: application.tenantCognitoId },
              select: { referredBy: true },
            });

            if (tenant?.referredBy) {
              console.log('Tenant was referred with code:', tenant.referredBy);

              const referral = await prisma.referral.findFirst({
                where: { referralCode: tenant.referredBy },
                select: { id: true, referrerCognitoId: true, referredCognitoId: true, isCompleted: true },
              });

              if (referral && !referral.isCompleted) {
                console.log('Found referral record, generating vouchers for both parties');

                await prisma.referral.update({
                  where: { id: referral.id },
                  data: {
                    isCompleted: true,
                    completedAt: new Date(),
                    voucherGenerated: true,
                  },
                });

                const referrerVoucherCode = `UBER-${referral.referrerCognitoId.substring(0, 8)}-${Date.now()}`;
                await prisma.voucher.create({
                  data: {
                    code: referrerVoucherCode,
                    ownerCognitoId: referral.referrerCognitoId,
                    discountAmount: 100,
                    discountPercent: null,
                    status: 'Active',
                    expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                    referralId: referral.id,
                  },
                });

                console.log('✅ Generated R100 voucher for referrer:', referral.referrerCognitoId);

                const referredVoucherCode = `UBER-${application.tenantCognitoId.substring(0, 8)}-${Date.now()}`;
                await prisma.voucher.create({
                  data: {
                    code: referredVoucherCode,
                    ownerCognitoId: application.tenantCognitoId,
                    discountAmount: 100,
                    discountPercent: null,
                    status: 'Active',
                    expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                    referralId: referral.id,
                  },
                });

                console.log('✅ Generated R100 voucher for referred tenant:', application.tenantCognitoId);
              }
            }
          } catch (referralError) {
            console.error('Error processing referral vouchers:', referralError);
          }
        } catch (leaseError) {
          console.error('Error creating lease:', leaseError);
        }
      } else {
        console.log('Using existing lease:', existingLease);
        lease = existingLease;
      }
    }

    // Track application_status_updated event with PostHog (server-side)
    const posthog = getPostHogClient();
    const distinctId = application.tenantCognitoId || application.email || 'anonymous';
    posthog.capture({
      distinctId,
      event: 'application_status_updated',
      properties: {
        application_id: id,
        property_id: application.propertyId,
        property_name: application.property?.name,
        new_status: normalizedStatus,
        previous_status: application.status,
        updated_by: authResult.userId,
        lease_created: lease !== null,
      },
    });
    await posthog.shutdown();

    return NextResponse.json({
      ...updatedApplication,
      lease
    });
  } catch (err: any) {
    console.error("Error updating application status:", err);
    return NextResponse.json(
      { message: `Error updating application status: ${err.message}` },
      { status: 500 }
    );
  }
}
