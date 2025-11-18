import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// Define interfaces for type safety
interface Location {
  id: number;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

interface Property {
  id: number;
  title: string;
  address: string;
  location: Location;
}

interface Tenant {
  id: number;
  cognitoId: string;
  name: string;
  email: string;
  phoneNumber: string;
}

interface Application {
  id: number;
  status: string;
  tenant: Tenant;
  property: Property;
}

// GET handler for tenants associated with a manager's properties
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Ensure params is properly awaited
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Only allow managers to access their own tenants or admins to access any manager's tenants
    if (authResult.userRole !== 'admin' && authResult.userId !== id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const propertyId = searchParams.get('propertyId');
    
    // Find properties for this manager with location data included
    const properties = await prisma.property.findMany({
      where: {
        managerCognitoId: id,
      },
      select: {
        id: true,
      },
    });
    
    // Get property IDs
    const propertyIds = properties.map((property: { id: number }) => property.id);
    
    if (propertyIds.length === 0) {
      return NextResponse.json([]);
    }
    
    // Find applications for these properties
    // Make sure to include both property and location data
    const applicationsQuery: any = {
      where: {
        propertyId: {
          in: propertyIds,
        },
      },
      include: {
        tenant: true,
        property: {
          include: {
            location: true,
          },
        },
      },
    };
    
    // Add status filter if provided
    if (status && status !== 'all') {
      applicationsQuery.where.status = status;
    }
    
    // Add property filter if provided
    if (propertyId) {
      const propertyIdNum = parseInt(propertyId);
      if (!isNaN(propertyIdNum) && propertyIds.includes(propertyIdNum)) {
        applicationsQuery.where.propertyId = propertyIdNum;
      } else {
        return NextResponse.json({ message: 'Invalid property ID' }, { status: 400 });
      }
    }
    
    const applications = await prisma.application.findMany(applicationsQuery);
    
    // Extract unique tenants from applications
    const tenantMap = new Map();
    
    applications.forEach((app: Application) => {
      if (app.tenant && app.property) {
        const tenant = app.tenant;
        const property = app.property;
        const location = property.location;
        
        // If tenant is not in map or we're updating with an approved application
        if (!tenantMap.has(tenant.cognitoId) || 
            (app.status === 'approved' && tenantMap.get(tenant.cognitoId).status !== 'approved')) {
          
          tenantMap.set(tenant.cognitoId, {
            ...tenant,
            propertyDetails: {
              id: property.id,
              title: property.title,
              address: property.address,
              city: location?.city || 'Unknown',
              status: app.status
            },
            applicationStatus: app.status,
            applicationId: app.id
          });
        }
      }
    });
    
    // Convert map to array
    const tenants = Array.from(tenantMap.values());
    
    return NextResponse.json(tenants);
  } catch (err: any) {
    console.error("Error retrieving manager tenants:", err);
    return NextResponse.json(
      { message: `Error retrieving manager tenants: ${err.message}` },
      { status: 500 }
    );
  }
}
