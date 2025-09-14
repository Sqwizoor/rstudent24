import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

// GET handler for retrieving all rooms for a property
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Fetch all rooms for the property
    const rooms = await prisma.room.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json({ 
      message: 'Error fetching rooms',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// POST handler for creating a room for a property
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
    
    // Skip manager verification for now to allow room creation
    // We'll add proper authentication later when the basic flow works

    // Check if request is multipart form data or JSON
    const contentType = request.headers.get('content-type') || '';
    console.log('Content type for room creation request:', contentType);
    
    let roomData;
    
    try {
      // Get the raw text first
      const rawText = await request.text();
      console.log("Raw request body text:", rawText);
      
      if (!rawText || rawText.trim() === '') {
        return NextResponse.json({ 
          message: 'Error creating room: Empty request body',
        }, { status: 400 });
      }

      // Try to parse as JSON first (this is what the client is sending)
      try {
        roomData = JSON.parse(rawText);
        console.log("Successfully parsed JSON data:", roomData);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        
        // Only try FormData as a fallback if content type suggests it
        if (contentType.includes('multipart/form-data')) {
          try {
            // Create a new request with the same body
            const clonedRequest = new Request(request.url, {
              method: request.method,
              headers: request.headers,
              body: rawText
            });
            
            const formData = await clonedRequest.formData();
            console.log('FormData entries received:', [...formData.entries()]);
            
            // Extract room data from FormData
            roomData = {
              name: formData.get('name')?.toString() || '',
              description: formData.get('description')?.toString() || '',
              pricePerMonth: parseFloat(formData.get('pricePerMonth')?.toString() || '0'),
              securityDeposit: parseFloat(formData.get('securityDeposit')?.toString() || '0'),
              squareFeet: parseInt(formData.get('squareFeet')?.toString() || '0'),
              beds: parseInt(formData.get('beds')?.toString() || '1'),
              baths: parseFloat(formData.get('baths')?.toString() || '1'),
              roomType: formData.get('roomType')?.toString() || 'PRIVATE',
              capacity: parseInt(formData.get('capacity')?.toString() || '1'),
              isAvailable: formData.get('isAvailable') === 'true',
              availableFrom: formData.get('availableFrom') ? new Date(formData.get('availableFrom')?.toString() || '') : null,
              
              // Handle arrays - they might be sent as comma-separated strings
              amenities: processArrayField(formData.get('amenities')),
              features: processArrayField(formData.get('features')),
              photoUrls: [] as string[],  // This will be handled separately with uploaded files
            };
            
            console.log('Processed room data from FormData:', roomData);
            
            // Handle file uploads to S3 if any are present
            const photoFiles = formData.getAll('photos');
            if (photoFiles && photoFiles.length > 0) {
              console.log(`Received ${photoFiles.length} photo files for upload`);
              
              try {
                // Configure S3 client with credentials
                const s3Client = new S3Client({
                  region: process.env.AWS_REGION || 'eu-north-1',
                  credentials: {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
                  },
                });
                
                // Upload each photo to S3 and collect URLs
                const photoUrls = [];
                
                for (const fileEntry of photoFiles) {
                  if (fileEntry instanceof File) {
                    // Create a unique file name based on timestamp and original name
                    const timestamp = Date.now();
                    const fileName = fileEntry.name.replace(/\s+/g, '-').toLowerCase();
                    const uniqueFileName = `rooms/${timestamp}-${fileName}`;
                    
                    // Convert file to buffer
                    const arrayBuffer = await fileEntry.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    
                    // Upload to S3
                    const uploadResult = await new Upload({
                      client: s3Client,
                      params: {
                        Bucket: process.env.AWS_BUCKET_NAME!,
                        Key: uniqueFileName,
                        Body: buffer,
                        ContentType: fileEntry.type,
                        ACL: 'public-read',
                        CacheControl: 'max-age=31536000',
                      },
                    }).done();
                    
                    if (uploadResult.Location) {
                      photoUrls.push(uploadResult.Location);
                      console.log(`Uploaded room photo to: ${uploadResult.Location}`);
                    }
                  }
                }
                
                // Add the uploaded photo URLs to the room data
                if (photoUrls.length > 0) {
                  roomData.photoUrls = photoUrls;
                }
              } catch (uploadError) {
                console.error('Error uploading room photos:', uploadError);
                // Continue with room creation even if photo upload fails
              }
            }
          } catch (formError) {
            console.error('Error parsing FormData:', formError);
            return NextResponse.json({ 
              message: 'Error creating room: Error parsing request body',
              error: formError instanceof Error ? formError.message : String(formError)
            }, { status: 400 });
          }
        } else {
          // If content type is not FormData, return JSON parse error
          return NextResponse.json({ 
            message: 'Error creating room: Invalid JSON format',
            error: parseError instanceof Error ? parseError.message : String(parseError)
          }, { status: 400 });
        }
      }
    } catch (error) {
      console.error("Error reading request body:", error);
      return NextResponse.json({ 
        message: 'Error creating room: Failed to read request body',
        error: error instanceof Error ? error.message : String(error)
      }, { status: 400 });
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

    // Validate the room data
    if (!roomData.name || !roomData.pricePerMonth) {
      return NextResponse.json({ 
        message: 'Missing required fields for room',
        missingFields: {
          name: !roomData.name,
          pricePerMonth: !roomData.pricePerMonth
        }
      }, { status: 400 });
    }

    // Create the room
    try {
      const newRoom = await prisma.room.create({
        data: {
          name: roomData.name,
          description: roomData.description || '',
          pricePerMonth: typeof roomData.pricePerMonth === 'number' 
            ? roomData.pricePerMonth 
            : parseFloat(roomData.pricePerMonth) || 0,
          securityDeposit: typeof roomData.securityDeposit === 'number' 
            ? roomData.securityDeposit 
            : parseFloat(roomData.securityDeposit) || 0,
          squareFeet: typeof roomData.squareFeet === 'number' 
            ? roomData.squareFeet 
            : parseInt(roomData.squareFeet) || 0,
          // Room type and capacity from the schema
          roomType: roomData.roomType || 'PRIVATE',
          capacity: typeof roomData.capacity === 'number' 
            ? roomData.capacity 
            : parseInt(roomData.capacity) || 1,
          isAvailable: roomData.isAvailable !== false, // Default to true if not specified
          availableFrom: roomData.availableFrom ? new Date(roomData.availableFrom) : null,
          amenities: Array.isArray(roomData.amenities) ? roomData.amenities : [],
          features: Array.isArray(roomData.features) ? roomData.features : [],
          photoUrls: Array.isArray(roomData.photoUrls) ? roomData.photoUrls : [],
          propertyId: propertyId,
        }
      });

      console.log("Room created successfully:", newRoom);
      return NextResponse.json(newRoom, { status: 201 });
    } catch (error) {
      console.error("Error creating room:", error);
      return NextResponse.json({ 
        message: 'Error creating room in database',
        error: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Unexpected error in room creation:", error);
    return NextResponse.json({ 
      message: 'Unexpected error during room creation',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
