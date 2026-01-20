import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { deleteFileFromS3 } from '@/lib/s3';

// DELETE handler for removing a photo from a property
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      select: { id: true, photoUrls: true }
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

    const { photoUrl } = body;

    if (!photoUrl || typeof photoUrl !== 'string') {
      return NextResponse.json({ message: 'photoUrl is required and must be a string' }, { status: 400 });
    }

    // Get current photo URLs
    const currentPhotoUrls = (property.photoUrls as string[]) || [];
    
    // Check if the photo URL exists in the property
    const photoIndex = currentPhotoUrls.indexOf(photoUrl);
    if (photoIndex === -1) {
      return NextResponse.json({ message: 'Photo not found in property' }, { status: 404 });
    }

    // Remove the photo URL from the array
    const updatedPhotoUrls = currentPhotoUrls.filter(url => url !== photoUrl);

    // Update the property in the database
    const updatedProperty = await prisma.property.update({
      where: { id: propertyId },
      data: {
        photoUrls: updatedPhotoUrls
      }
    });

    // Delete the file from S3 (non-blocking - if it fails, the database is still updated)
    try {
      await deleteFileFromS3(photoUrl);
      console.log(`Successfully deleted photo from S3: ${photoUrl}`);
    } catch (s3Error) {
      console.error(`Warning: Failed to delete photo from S3: ${photoUrl}`, s3Error);
      // Continue execution - database update was successful
    }

    return NextResponse.json({ 
      message: 'Photo deleted successfully',
      photoUrls: updatedProperty.photoUrls,
      deletedPhotoUrl: photoUrl,
      propertyId
    }, { status: 200 });

  } catch (error) {
    console.error("Unexpected error in photo deletion:", error);
    return NextResponse.json({ 
      message: 'Unexpected error during photo deletion',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
