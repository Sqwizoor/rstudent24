import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET handler for tenant current residences
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
    
    // IMPORTANT: Make sure to await the params in Next.js App Router
    const { id } = await params;
    
    // Role-based security check: only allow tenants to access their own data or admins to access any data
    if (authResult.userRole !== 'admin' && authResult.userId !== id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    
    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { cognitoId: id },
    });
    
    if (!tenant) {
      return NextResponse.json(
        { message: 'Tenant not found' },
        { status: 404 }
      );
    }
    
    // Get tenant's current residences (properties with active leases based on dates)
    const today = new Date();
    
    const currentResidences = await prisma.property.findMany({
      where: {
        leases: {
          some: {
            tenantCognitoId: id,
            // Filter for current leases where today is between start and end dates
            startDate: { lte: today },
            endDate: { gte: today }
          },
        },
      },
      include: {
        location: true,
        leases: {
          where: {
            tenantCognitoId: id,
            // Filter for current leases where today is between start and end dates
            startDate: { lte: today },
            endDate: { gte: today }
          },
        },
      },
    });
    
    return NextResponse.json(currentResidences);
  } catch (err: any) {
    console.error("Error retrieving tenant current residences:", err);
    return NextResponse.json(
      { message: `Error retrieving tenant current residences: ${err.message}` },
      { status: 500 }
    );
  }
}
