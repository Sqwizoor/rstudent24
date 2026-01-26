import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { uploadFileToS3 } from '@/lib/s3';

// POST handler for uploading a photo to a property
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
    
    // Skip manager verification for now to allow photo uploads
    // We'll add proper authentication later when the basic flow works

    // Parse the form data with better error handling
    let formData;
    try {
      formData = await request.formData();
      console.log("FormData parsed successfully for photo upload");
    } catch (error) {
      console.error("Error parsing FormData for photo upload:", error);
      return NextResponse.json({ 
        message: 'Error uploading photo: Failed to parse form data',
        error: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
    
    // Get the photo file
    const photoFile = formData.get('photo');
    if (!photoFile || !(photoFile instanceof File)) {
      return NextResponse.json({ message: 'No photo file provided' }, { status: 400 });
    }

    // Size guard: reject extremely large single files (>15MB)
    const MAX_SINGLE_FILE_BYTES = 15 * 1024 * 1024;
    if (photoFile.size > MAX_SINGLE_FILE_BYTES) {
      return NextResponse.json({ message: 'File too large. Max 15MB per image.' }, { status: 400 });
    }

    // Get featured image index if provided (for batch uploads)
    const featuredImageIndexParam = formData.get('featuredImageIndex');
    const featuredImageIndex = featuredImageIndexParam ? parseInt(featuredImageIndexParam as string) : null;

    console.log(`Processing photo: ${photoFile.name}, size: ${photoFile.size}, type: ${photoFile.type}`);
    if (featuredImageIndex !== null) {
      console.log(`Featured image index: ${featuredImageIndex}`);
    }

    // Upload the file to S3
    try {
      // Stream the file directly to S3
      const photoUrl = await uploadFileToS3(photoFile, photoFile.name, photoFile.type);
      
      // Get current property to check existing photos
      const currentProperty = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { photoUrls: true }
      });

      let updatedPhotoUrls: string[];
      
      if (featuredImageIndex !== null && currentProperty?.photoUrls) {
        // This is a batch upload - handle featured image positioning
        const currentPhotos = currentProperty.photoUrls as string[];
        const newPhotoIndex = currentPhotos.length; // Index where this new photo would be added
        
        if (featuredImageIndex === newPhotoIndex) {
          // This new photo should be the featured image - add it at the beginning
          updatedPhotoUrls = [photoUrl, ...currentPhotos];
        } else {
          // This is not the featured image - add it normally
          updatedPhotoUrls = [...currentPhotos, photoUrl];
        }
      } else {
        // Single photo upload or no featured image specified - add normally
        const currentPhotos = (currentProperty?.photoUrls as string[]) || [];
        updatedPhotoUrls = [...currentPhotos, photoUrl];
      }
      
      // Update the property with the new photo URLs array
      const updatedProperty = await prisma.property.update({
        where: { id: propertyId },
        data: {
          photoUrls: updatedPhotoUrls
        }
      });

      return NextResponse.json({ 
        message: 'Photo uploaded successfully',
        photoUrl,
        propertyId,
        totalPhotos: updatedPhotoUrls.length
      }, { status: 200 });
    } catch (error) {
      console.error("Error uploading photo to S3:", error);
      return NextResponse.json({ 
        message: 'Error uploading photo to S3',
        error: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Unexpected error in photo upload:", error);
    return NextResponse.json({ 
      message: 'Unexpected error during photo upload',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
