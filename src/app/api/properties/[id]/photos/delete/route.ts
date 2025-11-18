import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { verifyAuth } from '@/lib/auth';

// Configure S3 client with credentials
const s3Client = new S3Client({
  region: process.env.S24_AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.S24_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S24_AWS_SECRET_ACCESS_KEY!,
  },
});

// Helper function to delete a file from S3
async function deleteFileFromS3(fileUrl: string): Promise<void> {
  // Validate S3 configuration
  if (!process.env.S24_AWS_BUCKET_NAME) {
    throw new Error("S24_AWS_BUCKET_NAME is not configured in environment variables");
  }

  try {
    // Extract the key from the URL
    const urlPath = new URL(fileUrl).pathname;
    const key = urlPath.startsWith('/') ? urlPath.substring(1) : urlPath;

    const deleteParams = {
  Bucket: process.env.S24_AWS_BUCKET_NAME,
      Key: key,
    };

    await s3Client.send(new DeleteObjectCommand(deleteParams));
    console.log(`Successfully deleted file from S3: ${key}`);
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw new Error(`Failed to delete file from S3: ${error instanceof Error ? error.message : String(error)}`);
  }
}

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
