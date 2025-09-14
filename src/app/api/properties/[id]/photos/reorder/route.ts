import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// POST handler for reordering photos in a property
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get property ID from params
    const { id } = await params;
    const propertyId = parseInt(id);
    if (isNaN(propertyId)) {
      return NextResponse.json({ message: 'Invalid property ID' }, { status: 400 });
    }

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return NextResponse.json({ message: 'Property not found' }, { status: 404 });
    }

    // Parse the request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json({ 
        message: 'Invalid JSON in request body',
        error: error instanceof Error ? error.message : String(error)
      }, { status: 400 });
    }

    const { photoUrls } = body;

    if (!Array.isArray(photoUrls)) {
      return NextResponse.json({ message: 'photoUrls must be an array' }, { status: 400 });
    }

    // Validate that all URLs are strings
    const validUrls = photoUrls.every(url => typeof url === 'string' && url.length > 0);
    if (!validUrls) {
      return NextResponse.json({ message: 'All photo URLs must be non-empty strings' }, { status: 400 });
    }

    // Update the property with the new photo order
    const updatedProperty = await prisma.property.update({
      where: { id: propertyId },
      data: {
        photoUrls: photoUrls
      }
    });

    return NextResponse.json({ 
      message: 'Photos reordered successfully',
      photoUrls: updatedProperty.photoUrls,
      propertyId
    }, { status: 200 });

  } catch (error) {
    console.error("Unexpected error in photo reorder:", error);
    return NextResponse.json({ 
      message: 'Unexpected error during photo reordering',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
