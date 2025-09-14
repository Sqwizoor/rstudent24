import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// Using the shared Prisma client instance from @/lib/prisma

// GET handler for a specific tenant
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Properly await the params object to fix the Next.js dynamic route parameter issue
    const { id } = await context.params;
    
    console.log("Tenant API GET request for ID:", id);
    
    if (!id) {
      console.log("Invalid tenant ID provided");
      return NextResponse.json({ message: "Invalid tenant ID" }, { status: 400 });
    }

    // Authentication check
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.log("No auth header - proceeding anyway for debugging");
      // In production, you'd return 401 here
    }
    
    console.log("Finding tenant with Cognito ID:", id);
    
    // Find tenant by Cognito ID - fix the include statement to use only valid fields
    try {
      // Basic query first without includes
      const tenant = await prisma.tenant.findUnique({
        where: { cognitoId: id }
      });

      if (!tenant) {
        console.log("Tenant not found for ID:", id);
        return NextResponse.json({ message: "Tenant not found" }, { status: 404 });
      }

      // Get related data with correct field names from Prisma schema
      // Using only the fields that are valid according to the error message
      const tenantWithRelations = await prisma.tenant.findUnique({
        where: { id: tenant.id },
        include: {
          favorites: true,
          // Use the correct fields as shown in the error message
          properties: true,
          applications: true,
          leases: true
        }
      });

      console.log("Successfully retrieved tenant data");
      return NextResponse.json(tenantWithRelations || tenant);
    } catch (dbError: any) {
      console.error("Database error finding tenant:", dbError);
      return NextResponse.json(
        { message: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error("Unexpected error retrieving tenant:", err);
    return NextResponse.json(
      { message: `Error retrieving tenant: ${err.message}` },
      { status: 500 }
    );
  }
}

// PUT handler for updating a tenant
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Get the ID from the context object and ensure params is awaited
    const { id } = await context.params;
    
    if (!id) {
      return NextResponse.json({ message: "Invalid tenant ID" }, { status: 400 });
    }
    
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Only allow tenants to update their own data or admins to update any tenant
    if (authResult.userRole !== 'admin' && authResult.userId !== id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    
    // Check if tenant exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { cognitoId: id },
    });

    if (!existingTenant) {
      return NextResponse.json({ message: "Tenant not found" }, { status: 404 });
    }

    // Parse the request body with error handling
    let body;
    try {
      body = await request.json();
      console.log('Received update data:', body);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { message: `Error parsing request body: ${parseError instanceof Error ? parseError.message : 'Unknown error'}` },
        { status: 400 }
      );
    }
    
    if (!body) {
      console.error('Empty request body');
      return NextResponse.json({ message: 'Empty request body' }, { status: 400 });
    }
    
    // Prepare update data with field name mapping
    const updateData: any = {};
    
    // Map fields from the frontend to the database fields
    if (body.email) updateData.email = body.email;
    if (body.name) {
      // If name is provided as a single field, split it into firstName and lastName
      const nameParts = body.name.split(' ');
      if (nameParts.length > 1) {
        updateData.firstName = nameParts[0];
        updateData.lastName = nameParts.slice(1).join(' ');
      } else {
        updateData.firstName = body.name;
      }
    }
    if (body.phoneNumber) updateData.phone = body.phoneNumber;
    
    console.log('Update data after mapping:', updateData);
    
    // Update tenant
    const updatedTenant = await prisma.tenant.update({
      where: { cognitoId: id },
      data: updateData,
    });

    return NextResponse.json(updatedTenant);
  } catch (err: any) {
    console.error("Error updating tenant:", err);
    return NextResponse.json(
      { message: `Error updating tenant: ${err.message}` },
      { status: 500 }
    );
  }
}

// DELETE handler for deleting a tenant (admin only)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Get the ID from the context object and ensure params is awaited
    const { id } = await context.params;
    
    if (!id) {
      return NextResponse.json({ message: "Invalid tenant ID" }, { status: 400 });
    }
    
    // Verify authentication and role
    const authResult = await verifyAuth(request, ['admin']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if tenant exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { cognitoId: id },
    });

    if (!existingTenant) {
      return NextResponse.json({ message: "Tenant not found" }, { status: 404 });
    }

    // Delete tenant
    await prisma.tenant.delete({
      where: { cognitoId: id },
    });

    return NextResponse.json({ message: "Tenant deleted successfully", id });
  } catch (err: any) {
    console.error("Error deleting tenant:", err);
    return NextResponse.json(
      { message: `Error deleting tenant: ${err.message}` },
      { status: 500 }
    );
  }
}
