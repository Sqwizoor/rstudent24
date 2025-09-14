import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET handler for a manager's properties
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
    
    // Only allow managers to access their own properties or admins to access any manager's properties
    if (authResult.userRole !== 'admin' && authResult.userId !== id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    
    // Build the query
    const query: any = {
      where: {
        managerCognitoId: id,
      },
      include: {
        location: true,
      },
    };
    
    // Add status filter if provided
    if (status) {
      query.where.status = status;
    }
    
    // Find properties for this manager
    const properties = await prisma.property.findMany(query);

    return NextResponse.json(properties);
  } catch (err: any) {
    console.error("Error retrieving manager properties:", err);
    return NextResponse.json(
      { message: `Error retrieving manager properties: ${err.message}` },
      { status: 500 }
    );
  }
}

// POST handler for creating a new property for a manager
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Ensure params is properly awaited
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Only allow managers to create properties for themselves or admins to create for any manager
    if (authResult.userRole !== 'admin' && authResult.userId !== id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    
    // Parse the request body
    const body = await request.json();
    
    // Create the property
    const property = await prisma.property.create({
      data: {
        name: body.name,
        description: body.description,
        pricePerMonth: parseFloat(body.pricePerMonth),
        securityDeposit: parseFloat(body.securityDeposit || 0),
        photoUrls: body.photoUrls || [],
        amenities: body.amenities || [],
        highlights: body.highlights || [],
        isPetsAllowed: body.isPetsAllowed || false,
        isParkingIncluded: body.isParkingIncluded || false,
        isNsfassAccredited: body.isNsfassAccredited || false,
        beds: parseInt(body.beds),
        baths: parseFloat(body.baths),
        squareFeet: parseInt(body.squareFeet),
        propertyType: body.propertyType,
        locationId: body.locationId,
        managerCognitoId: id,
      },
      include: {
        location: true,
      },
    });

    return NextResponse.json(property, { status: 201 });
  } catch (err: any) {
    console.error("Error creating property:", err);
    return NextResponse.json(
      { message: `Error creating property: ${err.message}` },
      { status: 500 }
    );
  }
}
