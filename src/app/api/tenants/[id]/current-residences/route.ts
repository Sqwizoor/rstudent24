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
    
    console.log('🏠 Current residences auth result:', {
      isAuthenticated: authResult.isAuthenticated,
      userId: authResult.userId,
      userRole: authResult.userRole,
      provider: authResult.provider,
      message: authResult.message
    });
    
    if (!authResult.isAuthenticated) {
      console.error('❌ Authentication failed for current residences');
      return NextResponse.json({ 
        message: authResult.message || 'Unauthorized',
        debug: process.env.NODE_ENV === 'development' ? authResult : undefined
      }, { status: 401 });
    }
    
    // IMPORTANT: Make sure to await the params in Next.js App Router
    const { id } = await params;
    
    console.log('🔍 Fetching residences for tenant:', id);
    
    // Role-based security check: only allow tenants to access their own data or admins to access any data
    if (authResult.userRole !== 'admin' && authResult.userId !== id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    
    // Check if tenant exists, create if not (for Google OAuth users)
    let tenant = await prisma.tenant.findUnique({
      where: { cognitoId: id },
    });
    
    if (!tenant) {
      console.log('⚠️ Tenant not found, attempting to create for NextAuth user:', id);
      
      // Try to create tenant for Google OAuth users using upsert
      try {
        tenant = await prisma.tenant.upsert({
          where: { cognitoId: id },
          update: {
            // If exists, nothing to update
          },
          create: {
            cognitoId: id,
            email: `student-${id.substring(0, 10)}@student24.co`,
            name: 'Student User',
            phoneNumber: '',
          },
        });
        console.log('✅ Auto-created/updated tenant:', tenant.cognitoId);
      } catch (createError: any) {
        console.error('❌ Failed to auto-create tenant:', createError);
        console.error('Error details:', createError.message);
        return NextResponse.json(
          { 
            message: 'Tenant not found and could not be created',
            error: process.env.NODE_ENV === 'development' ? createError.message : undefined
          },
          { status: 500 }
        );
      }
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
