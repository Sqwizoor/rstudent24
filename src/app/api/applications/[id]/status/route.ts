import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// PUT handler for updating application status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get application ID from URL params
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    if (isNaN(id)) {
      return NextResponse.json(
        { message: 'Invalid application ID' },
        { status: 400 }
      );
    }

    // Parse request body using multiple methods to handle different scenarios
    let body: any = { status: 'Approved' }; // Default fallback value if parsing fails
    
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
          const text = await request.text();
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
    
    console.log('Raw status value received:', body.status);
    
    // Normalize status to match Prisma enum exactly (case-sensitive!)
    // Prisma ApplicationStatus enum values are: Pending, Denied, Approved
    let normalizedStatus: 'Pending' | 'Approved' | 'Denied';
    
    // Normalize status to match enum exactly regardless of input case
    const statusLower = (body.status || '').toLowerCase();
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
      data: { status: normalizedStatus }, // Use normalized status that matches Prisma enum exactly
      include: {
        property: {
          include: {
            location: true
          }
        },
        tenant: true
      }
    });

    // If application is approved, we could automatically create a lease here
    // This would depend on your business logic
    let lease = null;
    if (normalizedStatus === 'Approved') { // Use normalized status here
      // Check if a lease already exists for this application
      // Note: Lease model doesn't have a status field according to the schema
      const existingLease = await prisma.lease.findFirst({
        where: {
          propertyId: application.propertyId,
          tenantCognitoId: application.tenantCognitoId,
          // Current date falls between start and end date (i.e., active lease)
          startDate: { lte: new Date() },
          endDate: { gte: new Date() }
        }
      });

      // Only create a lease if one doesn't exist
      if (!existingLease) {
        // Create a new lease
        try {
          console.log('Creating new lease for approved application');
          
          // Use price from property if available, otherwise fallback
          const rentAmount = application.property.pricePerMonth || 
                           application.property.price || 
                           1000; // Fallback default
                           
          lease = await prisma.lease.create({
            data: {
              propertyId: application.propertyId,
              tenantCognitoId: application.tenantCognitoId,
              startDate: new Date(),
              endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // Default to 1 year lease
              rent: rentAmount,
              deposit: rentAmount, // Default deposit equal to one month's rent
            }
          });
          console.log('Lease created successfully:', lease);
        } catch (leaseError) {
          console.error('Error creating lease:', leaseError);
          // Continue without throwing - we don't want to fail the application status update
          // if lease creation fails
        }
      } else {
        console.log('Using existing lease:', existingLease);
        lease = existingLease;
      }
    }

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
