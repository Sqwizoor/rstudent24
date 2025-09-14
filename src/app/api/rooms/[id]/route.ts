import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

// S3 configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

// Helper function to upload file to S3
async function uploadFileToS3(file: Buffer, originalName: string, mimeType: string): Promise<string> {
  // Clean up the filename
  const cleanFileName = originalName.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase();
  
  // Create a unique filename with timestamp to prevent overwriting
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000000);
  const fileName = `rooms/${timestamp}-${random}-${cleanFileName}`;
  
  try {
    // Upload to S3
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: process.env.AWS_BUCKET_NAME || 'realstatee',
        Key: fileName,
        Body: file,
        ContentType: mimeType,
      },
    });

    // Wait for upload to complete
    await upload.done();
    console.log('Successfully uploaded file:', fileName);
    
    // Generate the URL
    const fileUrl = `https://${process.env.AWS_BUCKET_NAME || 'realstatee'}.s3.${process.env.AWS_REGION || 'eu-north-1'}.amazonaws.com/${fileName}`;
    console.log('Generated file URL:', fileUrl);
    
    return fileUrl;
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw error;
  }
}

// PUT handler for updating a room
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get room ID from params
    const { id } = await params;
    const roomId = parseInt(id);
    
    if (isNaN(roomId)) {
      return NextResponse.json({ message: 'Invalid room ID' }, { status: 400 });
    }

    // Check if room exists
    const existingRoom = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!existingRoom) {
      return NextResponse.json({ message: 'Room not found' }, { status: 404 });
    }

    // Parse form data
    const formData = await request.formData();
    
    console.log('Updating room:', roomId);
    
    // Extract room data
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const pricePerMonth = parseFloat(formData.get('pricePerMonth') as string);
    const securityDeposit = parseFloat(formData.get('securityDeposit') as string) || 0;
    const squareFeet = parseInt(formData.get('squareFeet') as string) || null;
    const roomType = formData.get('roomType') as string;
    const capacity = parseInt(formData.get('capacity') as string) || 1;
    const isAvailable = formData.get('isAvailable') === 'true';
    const availableFromStr = formData.get('availableFrom') as string;
    
    // Parse amenities and features
    const amenities = formData.getAll('amenities') as string[];
    const features = formData.getAll('features') as string[];
    
    // Parse availableFrom date
    let availableFrom: Date | null = null;
    if (availableFromStr && availableFromStr !== 'null' && availableFromStr !== 'undefined') {
      availableFrom = new Date(availableFromStr);
      if (isNaN(availableFrom.getTime())) {
        availableFrom = null;
      }
    }

    // Validate required fields
    if (!name || isNaN(pricePerMonth)) {
      return NextResponse.json({ 
        message: 'Missing required fields: name and pricePerMonth are required' 
      }, { status: 400 });
    }

    // Handle photo uploads
    let photoUrls = existingRoom.photoUrls || []; // Keep existing photos by default
    
    const photoFiles = formData.getAll('photos') as File[];
    const singlePhoto = formData.get('photo') as File;
    
    // Combine all photo files
    const allPhotoFiles: File[] = [];
    if (singlePhoto && singlePhoto.size > 0) {
      allPhotoFiles.push(singlePhoto);
    }
    if (photoFiles && photoFiles.length > 0) {
      allPhotoFiles.push(...photoFiles.filter(file => file.size > 0));
    }

    console.log(`Found ${allPhotoFiles.length} photos to upload for room update`);

    // If new photos are provided, upload them and replace existing ones
    if (allPhotoFiles.length > 0) {
      const uploadPromises = allPhotoFiles.map(async (file) => {
        try {
          // Limit file size to 5MB to prevent 413 errors
          if (file.size > 5 * 1024 * 1024) {
            console.warn(`File ${file.name} is too large (${file.size} bytes), skipping`);
            return null;
          }
          
          console.log(`Uploading photo: ${file.name}, size: ${file.size}`);
          const buffer = Buffer.from(await file.arrayBuffer());
          return await uploadFileToS3(buffer, file.name, file.type);
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          return null;
        }
      });

      const uploadResults = await Promise.all(uploadPromises);
      const successfulUploads = uploadResults.filter(url => url !== null) as string[];
      
      console.log(`Successfully uploaded ${successfulUploads.length} photos for room update`);
      
      // Only update photo URLs if we have successful uploads
      if (successfulUploads.length > 0) {
        photoUrls = successfulUploads;
      }
    }

    // Update the room in the database
    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: {
        name,
        description: description || null,
        pricePerMonth,
        securityDeposit,
        squareFeet,
        roomType: roomType as any,
        capacity,
        isAvailable,
        availableFrom,
        amenities,
        features,
        photoUrls,
      },
    });

    console.log('Room updated successfully:', updatedRoom.id);

    return NextResponse.json(updatedRoom);
  } catch (error) {
    console.error('Error updating room:', error);
    return NextResponse.json({ 
      message: 'Error updating room',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// DELETE handler for deleting a room
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get room ID from params
    const { id } = await params;
    const roomId = parseInt(id);
    
    if (isNaN(roomId)) {
      return NextResponse.json({ message: 'Invalid room ID' }, { status: 400 });
    }

    // Check if room exists
    const existingRoom = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!existingRoom) {
      return NextResponse.json({ message: 'Room not found' }, { status: 404 });
    }

    // Delete the room
    await prisma.room.delete({
      where: { id: roomId },
    });

    console.log('Room deleted successfully:', roomId);

    return NextResponse.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json({ 
      message: 'Error deleting room',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// GET handler for getting a specific room
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get room ID from params
    const { id } = await params;
    const roomId = parseInt(id);
    
    if (isNaN(roomId)) {
      return NextResponse.json({ message: 'Invalid room ID' }, { status: 400 });
    }

    // Get the room
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        property: true,
      },
    });

    if (!room) {
      return NextResponse.json({ message: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json(room);
  } catch (error) {
    console.error('Error fetching room:', error);
    return NextResponse.json({ 
      message: 'Error fetching room',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
