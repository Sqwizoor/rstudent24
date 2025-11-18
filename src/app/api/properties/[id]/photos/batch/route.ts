import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

// Configure S3 client with credentials
const s3Client = new S3Client({
  region: process.env.S24_AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.S24_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S24_AWS_SECRET_ACCESS_KEY!,
  },
});

// Upload function for single file
async function uploadFileToS3(file: Buffer, originalName: string, mimeType: string): Promise<string> {
  // Validate S3 configuration
  if (!process.env.S24_AWS_BUCKET_NAME) {
    throw new Error("S24_AWS_BUCKET_NAME is not configured in environment variables");
  }

  if (!process.env.S24_AWS_REGION) {
    throw new Error("S24_AWS_REGION is not configured in environment variables");
  }

  // Create a unique file name
  const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const safeFileName = originalName.replace(/[^a-zA-Z0-9.-]/g, '');
  const key = `properties/${uniquePrefix}-${safeFileName}`;
  
  const params = {
  Bucket: process.env.S24_AWS_BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: mimeType,
    CacheControl: 'public, max-age=86400',
  };

  try {
    console.log(`Starting S3 upload for file: ${params.Key}`);
    
    // Use the Upload utility for better handling of large files
    const upload = new Upload({
      client: s3Client,
      params: params,
    });

    const result = await upload.done();
    console.log(`Successfully uploaded file: ${params.Key}`);
    // ACL removed; bucket policy or proxy must handle public access

    // Construct URL in a consistent way
  const fileUrl = `https://${process.env.S24_AWS_BUCKET_NAME}.s3.${process.env.S24_AWS_REGION}.amazonaws.com/${key}`;
    console.log(`Generated file URL: ${fileUrl}`);
    
    return fileUrl;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error(`Failed to upload file to S3: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// POST handler for batch uploading photos to a property with featured image support
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const contentLengthHeader = request.headers.get('content-length');
    const HARD_LIMIT = 30 * 1024 * 1024; // sync with config
    if (contentLengthHeader) {
      const len = parseInt(contentLengthHeader, 10);
      if (len > HARD_LIMIT) {
        return NextResponse.json({
          message: 'Request Entity Too Large: raw multipart exceeds 30MB limit before parsing.',
          receivedBytes: len,
          maxBytes: HARD_LIMIT,
          guidance: 'Use sequential single-file uploads. Large images will auto-compress and retry. '
        }, { status: 413 });
      }
    }

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

    // Parse the form data
    let formData;
    try {
      formData = await request.formData();
      console.log("FormData parsed successfully for batch photo upload");
    } catch (error) {
      console.error("Error parsing FormData for batch photo upload:", error);
      return NextResponse.json({ 
        message: 'Error uploading photos: Failed to parse form data',
        error: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
    
    // Get all photo files
    const photoFiles = formData.getAll('photos') as File[];
    if (photoFiles.length === 0) {
      return NextResponse.json({ message: 'No photo files provided' }, { status: 400 });
    }

    // Basic guards
    const MAX_FILES_PER_BATCH = 40; // safeguard to prevent abuse
    if (photoFiles.length > MAX_FILES_PER_BATCH) {
      return NextResponse.json({ message: `Too many files in one batch. Max ${MAX_FILES_PER_BATCH}.` }, { status: 400 });
    }
    const MAX_SINGLE_FILE_BYTES = 15 * 1024 * 1024; // 15MB
    let totalBytes = 0;
    for (const f of photoFiles) {
      if (f.size > MAX_SINGLE_FILE_BYTES) {
        return NextResponse.json({ message: `File ${f.name} exceeds 15MB limit.` }, { status: 400 });
      }
      totalBytes += f.size;
    }

    // Check cumulative size against hard limit
    if (totalBytes > HARD_LIMIT) {
      return NextResponse.json({
        message: 'Request Entity Too Large: total file size exceeds 30MB limit.',
        receivedBytes: totalBytes,
        maxBytes: HARD_LIMIT,
        guidance: 'Reduce number of images or let client auto-chunk (<=7.5MB per batch).'
      }, { status: 413 });
    }

    // Get featured image index (default to 0)
    const featuredImageIndexParam = formData.get('featuredImageIndex');
    const featuredImageIndex = featuredImageIndexParam ? parseInt(featuredImageIndexParam as string) : 0;

    console.log(`Processing ${photoFiles.length} photos for property ${propertyId}`);
    console.log(`Featured image index: ${featuredImageIndex}`);

    // Upload all files to S3
    const uploadedUrls: string[] = [];
    const uploadPromises = photoFiles.map(async (file, index) => {
      console.log(`Processing photo ${index + 1}: ${file.name}, size: ${file.size}, type: ${file.type}`);
      
      try {
        const buffer = await file.arrayBuffer();
        const photoUrl = await uploadFileToS3(Buffer.from(buffer), file.name, file.type);
        return { url: photoUrl, index };
      } catch (error) {
        console.error(`Error uploading photo ${file.name}:`, error);
        throw new Error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

    try {
      const uploadResults = await Promise.all(uploadPromises);
      
      // Sort by original index to maintain order
      uploadResults.sort((a, b) => a.index - b.index);
      const sortedUrls = uploadResults.map(result => result.url);
      
      // Reorder URLs so featured image is first
      const reorderedUrls: string[] = [];
      if (featuredImageIndex < sortedUrls.length) {
        // Add featured image first
        reorderedUrls.push(sortedUrls[featuredImageIndex]);
        // Add remaining images
        sortedUrls.forEach((url, index) => {
          if (index !== featuredImageIndex) {
            reorderedUrls.push(url);
          }
        });
      } else {
        // Featured index is out of bounds, use original order
        reorderedUrls.push(...sortedUrls);
      }

      // Update the property with the new photo URLs (append to existing)
      const currentProperty = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { photoUrls: true }
      });
      
      const existingPhotos = (currentProperty?.photoUrls as string[]) || [];
      const allPhotos = [...existingPhotos, ...reorderedUrls];

      const updatedProperty = await prisma.property.update({
        where: { id: propertyId },
        data: {
          photoUrls: allPhotos
        }
      });

      return NextResponse.json({ 
        message: 'Photos uploaded successfully',
        photoUrls: reorderedUrls, // Return only the newly uploaded photos
        allPhotoUrls: allPhotos, // Return all photos including existing ones
        propertyId,
        totalPhotos: allPhotos.length,
        newPhotosCount: reorderedUrls.length
      }, { status: 200 });
      
    } catch (error) {
      console.error("Error uploading photos to S3:", error);
      return NextResponse.json({ 
        message: 'Error uploading photos to S3',
        error: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Unexpected error in batch photo upload:", error);
    return NextResponse.json({ 
      message: 'Unexpected error during batch photo upload',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
