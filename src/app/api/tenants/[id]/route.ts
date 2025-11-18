import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { queryCache } from '@/lib/queryCache';

// Using the shared Prisma client instance from @/lib/prisma

// ✅ ISR: Cache responses for 1 hour
export const revalidate = 3600;

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

    // ✅ Step 2: Check cache first
    const cacheKey = queryCache.getKey('tenant', { id });
    const cached = queryCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
          'Content-Type': 'application/json',
        },
      });
    }

    // Authentication check
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.log("No auth header - proceeding anyway for debugging");
      // In production, you'd return 401 here
    }
    
    console.log("Finding tenant with Cognito ID:", id);
    
    // Find tenant by Cognito ID
    try {
      // ✅ Step 3: Use .select() to minimize payload
      let tenant = await prisma.tenant.findUnique({
        where: { cognitoId: id },
        select: {
          id: true,
          cognitoId: true,
          email: true,
          name: true,
          phoneNumber: true,
          referredBy: true,
          favorites: {
            select: {
              id: true,
              name: true,
              pricePerMonth: true,
            },
          },
          applications: {
            select: {
              id: true,
              propertyId: true,
              roomId: true,
              status: true,
              applicationDate: true,
            },
          },
          leases: {
            select: {
              id: true,
              propertyId: true,
              rent: true,
              deposit: true,
              startDate: true,
              endDate: true,
            },
          },
        },
      });

      if (!tenant) {
        console.log("Tenant not found for ID:", id, "- Attempting auto-creation for NextAuth user");
        
        // Auto-create tenant for Google OAuth users using upsert
        try {
          const newTenant = await prisma.tenant.upsert({
            where: { cognitoId: id },
            update: {
              // If exists, nothing to update (tenant fields are already set)
            },
            create: {
              cognitoId: id,
              email: `student-${id.substring(0, 10)}@student24.co`,
              name: 'Student User',
              phoneNumber: '',
            },
            select: {
              id: true,
              cognitoId: true,
              email: true,
              name: true,
              phoneNumber: true,
              referredBy: true,
              favorites: {
                select: {
                  id: true,
                  name: true,
                  pricePerMonth: true,
                },
              },
              applications: {
                select: {
                  id: true,
                  propertyId: true,
                  roomId: true,
                  status: true,
                  applicationDate: true,
                },
              },
              leases: {
                select: {
                  id: true,
                  propertyId: true,
                  rent: true,
                  deposit: true,
                  startDate: true,
                  endDate: true,
                },
              },
            },
          });
          
          console.log("✅ Auto-created/updated tenant for NextAuth user:", id);
          tenant = newTenant;
        } catch (createError: any) {
          console.error("❌ Failed to auto-create tenant. Error:", createError);
          console.error("Error details:", {
            message: createError.message,
            code: createError.code,
            meta: createError.meta,
            stack: createError.stack,
          });
          return NextResponse.json({ 
            message: "Tenant not found and could not be created",
            error: process.env.NODE_ENV === 'development' ? createError.message : undefined
          }, { status: 500 });
        }
      }

      console.log("Successfully retrieved tenant data");
      
      // ✅ Step 4: Store in cache for 1 hour
      queryCache.set(cacheKey, tenant, 3600);
      
      // ✅ Step 5: Return with cache headers
      return NextResponse.json(tenant, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
          'Content-Type': 'application/json',
        },
      });
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

    if (typeof body.email === 'string') {
      updateData.email = body.email;
    }

    if (typeof body.name === 'string') {
      updateData.name = body.name;
    }

    if (typeof body.phoneNumber === 'string') {
      updateData.phoneNumber = body.phoneNumber;
    }
    
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
