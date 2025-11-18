import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

// Export route configuration for file upload limits
export const maxDuration = 60; // Maximum execution time in seconds
export const dynamic = 'force-dynamic'; // Disable static optimization for this route

// File size limits
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file
const MAX_TOTAL_SIZE = 20 * 1024 * 1024; // 20MB total

// S3 configuration
const s3Client = new S3Client({
  region: process.env.S24_AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.S24_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S24_AWS_SECRET_ACCESS_KEY || ''
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
  Bucket: process.env.S24_AWS_BUCKET_NAME || 'realstatee',
        Key: fileName,
        Body: file,
        ContentType: mimeType,
      },
    });

    // Wait for upload to complete
    await upload.done();
    console.log('Successfully uploaded file:', fileName);
    
  // ACL not set: rely on bucket policy / ownership settings
    
    // Generate the URL
  const fileUrl = `https://${process.env.S24_AWS_BUCKET_NAME || 'realstatee'}.s3.${process.env.S24_AWS_REGION || 'eu-north-1'}.amazonaws.com/${fileName}`;
    console.log('Generated file URL:', fileUrl);
    
    return fileUrl;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
}

// Define interface for room data
interface RoomData {
  name: string;
  description: string;
  pricePerMonth: number;
  securityDeposit: number;
  topUp?: number;
  squareFeet: number;
  beds: number;
  baths: number;
  roomType: string;
  capacity: number;
  isAvailable: boolean;
  availableFrom: Date | null;
  amenities: string[];
  features: string[];
  photoUrls: string[];
  bathroomPrivacy?: 'PRIVATE' | 'SHARED';
  kitchenPrivacy?: 'PRIVATE' | 'SHARED';
}

// POST handler for the create-room endpoint
// This is a specialized endpoint that handles room creation with JSON data
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check content length early to prevent processing oversized requests
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_TOTAL_SIZE) {
      console.log(`Request rejected: Content-Length ${contentLength} exceeds limit of ${MAX_TOTAL_SIZE}`);
      return NextResponse.json({ 
        message: `Request too large. Maximum size is ${Math.round(MAX_TOTAL_SIZE / 1024 / 1024)}MB`,
      }, { status: 413 });
    }

    // Get property ID from params
    const { id } = await params;
    const propertyId = parseInt(id);
    
    console.log('Request to create-room endpoint received for property ID:', propertyId);
    
    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return NextResponse.json({ message: 'Property not found' }, { status: 404 });
    }

    // Process the request based on content type
    const contentType = request.headers.get('content-type') || '';
    console.log('Content type received:', contentType);
    
    let roomData: RoomData;
    
    // Handle the request based on content-type
    if (contentType.includes('multipart/form-data')) {
      try {
        const formData = await request.formData();
        console.log('FormData entries:', [...formData.entries()].map(([key]) => key).join(', '));
        
        if ([...formData.entries()].length === 0) {
          return NextResponse.json({ 
            message: 'Error creating room: Empty form data',
          }, { status: 400 });
        }
        
        // Extract room data from FormData
        roomData = {
          name: formData.get('name')?.toString() || '',
          description: formData.get('description')?.toString() || '',
          pricePerMonth: parseFloat(formData.get('pricePerMonth')?.toString() || '0'),
          securityDeposit: parseFloat(formData.get('securityDeposit')?.toString() || '0'),
          topUp: parseFloat(formData.get('topUp')?.toString() || '0'),
          squareFeet: parseInt(formData.get('squareFeet')?.toString() || '0'),
          beds: parseInt(formData.get('beds')?.toString() || '1'),
          baths: parseFloat(formData.get('baths')?.toString() || '1'),
          roomType: formData.get('roomType')?.toString() || 'PRIVATE',
          capacity: parseInt(formData.get('capacity')?.toString() || '1'),
          isAvailable: formData.get('isAvailable') === 'true',
          availableFrom: formData.get('availableFrom') ? new Date(formData.get('availableFrom')?.toString() || '') : null,
          // Handle arrays - use getAll() to get all values for amenities and features
          amenities: formData.getAll('amenities') as string[],
          features: formData.getAll('features') as string[],
          photoUrls: [] as string[],
          bathroomPrivacy: (() => { const v = formData.get('bathroomPrivacy')?.toString(); return v ? (v.toUpperCase() as 'PRIVATE' | 'SHARED') : undefined; })(),
          kitchenPrivacy: (() => { const v = formData.get('kitchenPrivacy')?.toString(); return v ? (v.toUpperCase() as 'PRIVATE' | 'SHARED') : undefined; })(),
        };
        
        // Process photo uploads with size validation
        const photoUrls: string[] = [];
        let totalSize = 0;
        
        // Try to get photos using both possible keys
        let photoEntries = formData.getAll('photos');
        console.log(`Found ${photoEntries.length} photos in FormData with key 'photos'`);
        
        // If no photos found with 'photos' key, try 'photo' key
        if (photoEntries.length === 0) {
          photoEntries = formData.getAll('photo');
          console.log(`Found ${photoEntries.length} photos in FormData with key 'photo'`);
        }
        
        // Also check if there are any entries with the key 'photoUrls'
        const photoUrlsEntries = formData.getAll('photoUrls');
        if (photoUrlsEntries.length > 0) {
          console.log(`Found ${photoUrlsEntries.length} entries with key 'photoUrls'`);
          
          // If they're files, add them to photoEntries
          for (const entry of photoUrlsEntries) {
            if (entry instanceof File) {
              photoEntries = [...photoEntries, entry];
            }
          }
        }

        // Calculate total size first
        for (const photoEntry of photoEntries) {
          if (photoEntry instanceof File) {
            totalSize += photoEntry.size;
          }
        }

        // Check total size limit
        if (totalSize > MAX_TOTAL_SIZE) {
          return NextResponse.json({ 
            message: `Total file size (${Math.round(totalSize / 1024 / 1024)}MB) exceeds limit of ${Math.round(MAX_TOTAL_SIZE / 1024 / 1024)}MB`,
          }, { status: 413 });
        }
        
        // Now process all found photo entries
        if (photoEntries && photoEntries.length > 0) {
          console.log(`Processing ${photoEntries.length} photos for room (total size: ${Math.round(totalSize / 1024 / 1024)}MB)`);
          
          // Upload each photo to S3
          for (const photoEntry of photoEntries) {
            try {
              if (photoEntry instanceof File) {
                // Check individual file size limit
                if (photoEntry.size > MAX_FILE_SIZE) {
                  console.warn(`File ${photoEntry.name} is too large (${Math.round(photoEntry.size / 1024 / 1024)}MB), maximum is ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`);
                  return NextResponse.json({ 
                    message: `File ${photoEntry.name} is too large. Maximum file size is ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`,
                  }, { status: 413 });
                }
                
                console.log(`Processing photo as File: ${photoEntry.name}, size: ${Math.round(photoEntry.size / 1024 / 1024 * 100) / 100}MB, type: ${photoEntry.type}`);
                const photoBuffer = Buffer.from(await photoEntry.arrayBuffer());
                const photoUrl = await uploadFileToS3(photoBuffer, photoEntry.name, photoEntry.type);
                console.log('Successfully uploaded to S3, URL:', photoUrl);
                photoUrls.push(photoUrl);
              } else {
                console.log('Photo entry is not a File instance:', typeof photoEntry);
              }
            } catch (uploadError) {
              console.error('Error uploading photo:', uploadError);
              return NextResponse.json({ 
                message: `Error uploading photo ${photoEntry instanceof File ? photoEntry.name : 'unknown'}`,
                error: uploadError instanceof Error ? uploadError.message : String(uploadError)
              }, { status: 500 });
            }
          }
        }
        
        // Log results of photo processing
        console.log(`Processed ${photoUrls.length} photos, URLs:`, photoUrls);
        
        // Add photoUrls to roomData
        roomData.photoUrls = photoUrls;
        
        console.log('FormData processed successfully');
      } catch (formError) {
        console.error('Error parsing FormData:', formError);
        return NextResponse.json({ 
          message: 'Error creating room: Invalid form data',
          error: formError instanceof Error ? formError.message : String(formError)
        }, { status: 400 });
      }
    } else if (contentType.includes('application/json')) {
      try {
        // For JSON content type, parse the request body as JSON
  const jsonData = await request.json();
  roomData = jsonData as RoomData;
        console.log('JSON data parsed successfully');
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        return NextResponse.json({ 
          message: 'Error creating room: Invalid JSON data',
          error: jsonError instanceof Error ? jsonError.message : String(jsonError)
        }, { status: 400 });
      }
    } else {
      // Unknown content type
      console.error('Unsupported content-type:', contentType);
      return NextResponse.json({ 
        message: `Error creating room: Unsupported content-type: ${contentType}`,
      }, { status: 400 });
    }
      
    // Check if we have valid room data
    if (!roomData || typeof roomData !== 'object') {
      return NextResponse.json({ 
        message: 'Error creating room: No valid room data provided',
      }, { status: 400 });
    }
      
      console.log('Room data processed:', roomData);
      
      // Derive privacy features for storage without DB migration
      const derivedFeatures: string[] = [];
      if (roomData.bathroomPrivacy) {
        derivedFeatures.push(`Bathroom:${roomData.bathroomPrivacy}`);
      }
      if (roomData.kitchenPrivacy) {
        derivedFeatures.push(`Kitchen:${roomData.kitchenPrivacy}`);
      }

      // Create the room in the database
      const createdRoom = await prisma.room.create({
        data: {
          name: roomData.name,
          description: roomData.description || '',
          pricePerMonth: roomData.pricePerMonth,
          securityDeposit: roomData.securityDeposit || 0,
          topUp: roomData.topUp ?? 0,
          squareFeet: roomData.squareFeet || 0,
          roomType: roomData.roomType || 'PRIVATE',
          capacity: roomData.capacity || 1,
          isAvailable: roomData.isAvailable === false ? false : true,
          propertyId: propertyId,
          amenities: Array.isArray(roomData.amenities) ? roomData.amenities : [],
          features: [
            ...((Array.isArray(roomData.features) ? roomData.features : []))
              .filter(f => !/^Bathroom:|^Kitchen:/.test(f)),
            ...derivedFeatures,
          ],
          photoUrls: Array.isArray(roomData.photoUrls) ? roomData.photoUrls : [],
          availableFrom: roomData.availableFrom ? new Date(roomData.availableFrom) : null,
          beds: roomData.beds || 1,
          baths: roomData.baths || 1,
        },
      });
      
      console.log('Room created successfully:', createdRoom);

      try {
        const minPrice = await prisma.room.aggregate({
          where: { propertyId },
          _min: { pricePerMonth: true },
        });
        const minVal = minPrice._min.pricePerMonth ?? createdRoom.pricePerMonth;
        await prisma.property.update({
          where: { id: propertyId },
          data: { pricePerMonth: minVal },
        });
        console.log(`Updated property ${propertyId} pricePerMonth to min room price:`, minVal);
      } catch (e) {
        console.warn('Failed to update property min price after room create:', e);
      }

      return NextResponse.json(createdRoom, { status: 201 });
  } catch (error) {
    console.error("Error in create-room endpoint:", error);
    return NextResponse.json({ 
      message: 'Error processing room creation request',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Helper function to process array fields from FormData
function processArrayField(fieldValue: FormDataEntryValue | null): string[] {
  if (!fieldValue) return [];
  
  const valueStr = fieldValue.toString();
  if (!valueStr) return [];
  
  // Try to parse as JSON first
  try {
    const parsed = JSON.parse(valueStr);
    return Array.isArray(parsed) ? parsed : [valueStr];
  } catch {
    // If not valid JSON, treat as comma-separated string
    return valueStr.split(',').map(item => item.trim()).filter(Boolean);
  }
}
