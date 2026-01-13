import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { wktToGeoJSON } from '@terraformer/wkt';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { verifyAuth } from '@/lib/auth';
import { queryCache } from '@/lib/queryCache';

// ✅ ISR: Cache responses for 1 hour
export const revalidate = 3600;

// Using the shared Prisma client instance from @/lib/prisma

// Configure S3 client with credentials
const s3Client = new S3Client({
  region: process.env.S24_AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.S24_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S24_AWS_SECRET_ACCESS_KEY!,
  },
});

// Helper function to upload file to S3 (same as in the main properties route)
async function uploadFileToS3(file: Buffer, originalName: string, mimeType: string): Promise<string> {
  // Implementation same as in properties/route.ts
  // Validate S3 configuration
  if (!process.env.S24_AWS_BUCKET_NAME) {
    throw new Error("S24_AWS_BUCKET_NAME is not configured in environment variables");
  }

  if (!process.env.S24_AWS_REGION) {
    throw new Error("S24_AWS_REGION is not configured in environment variables");
  }

  // Create a more unique file name to prevent collisions
  const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const safeFileName = originalName.replace(/[^a-zA-Z0-9.-]/g, '');
  const key = `properties/${uniquePrefix}-${safeFileName}`;
  
  const params = {
  Bucket: process.env.S24_AWS_BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: mimeType,
    // No ACL: Bucket Owner Enforced. Public access handled via bucket policy or CDN.
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

    // Construct URL in a consistent way
  const fileUrl = `https://${process.env.S24_AWS_BUCKET_NAME}.s3.${process.env.S24_AWS_REGION}.amazonaws.com/${key}`;
    console.log(`Generated file URL: ${fileUrl}`);
    
    return fileUrl;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error(`Failed to upload file to S3: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Helper function to delete a file from S3
async function deleteFileFromS3(fileUrl: string): Promise<void> {
  // Implementation same as in properties/route.ts
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
    console.log(`Successfully deleted file: ${key}`);
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw new Error(`Failed to delete file from S3: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Ensure this route uses the Node.js runtime (Edge has smaller limits)
export const runtime = 'nodejs';

// GET handler for a specific property
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params;
    const id = Number(paramId);
    
    if (isNaN(id)) {
      return NextResponse.json({ message: "Invalid property ID" }, { status: 400 });
    }
    
    console.log(`[API] GET /api/properties/${id} - Fetching property`);
    
    // ✅ Step 2: Check cache first
    const cacheKey = queryCache.getKey('property', { id });
    const cached = queryCache.get(cacheKey);
    if (cached) {
      console.log(`[API] GET /api/properties/${id} - Cache HIT`);
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
          'Content-Type': 'application/json',
        },
      });
    }
    
    console.log(`[API] GET /api/properties/${id} - Cache MISS, querying database`);
    
    // ✅ Step 3: Use .select() not .include() to minimize payload
    const property = await prisma.property.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        pricePerMonth: true,
        securityDeposit: true,
        photoUrls: true,
        amenities: true,
        highlights: true,
        closestUniversities: true,
        accreditedBy: true,
        closestCampuses: true,
        closestUniversity: true,
        isPetsAllowed: true,
        isParkingIncluded: true,
        isNsfassAccredited: true,
        beds: true,
        baths: true,
        kitchens: true,
        squareFeet: true,
        propertyType: true,
        postedDate: true,
        averageRating: true,
        numberOfReviews: true,
        locationId: true,
        managerCognitoId: true,
        redirectType: true,
        whatsappNumber: true,
        customLink: true,
        location: {
          select: {
            id: true,
            address: true,
            city: true,
            suburb: true,
            state: true,
            country: true,
            postalCode: true,
          },
        },
      },
    });

    if (!property) {
      console.warn(`[API] GET /api/properties/${id} - Property not found`);
      return NextResponse.json({ message: "Property not found" }, { status: 404 });
    }

    // Ensure property's manager is Active. If manager is disabled/banned, treat property as not found.
    try {
      const manager = await prisma.manager.findUnique({ where: { cognitoId: property.managerCognitoId } });
      if (manager && manager.status !== 'Active') {
        console.warn(`[API] GET /api/properties/${id} - Manager is not active, hiding property`);
        return NextResponse.json({ message: "Property not found" }, { status: 404 });
      }
    } catch (mgrErr) {
      console.error('Error checking manager status for property:', mgrErr);
    }

    // Check if property has been disabled by an admin
    try {
      const disabled = await prisma.$queryRaw`SELECT 1 FROM disabled_properties WHERE property_id = ${id} LIMIT 1`;
      if (disabled && (Array.isArray(disabled) ? disabled.length > 0 : true)) {
        console.warn(`[API] GET /api/properties/${id} - Property is disabled, hiding property`);
        return NextResponse.json({ message: "Property not found" }, { status: 404 });
      }
    } catch (dpErr) {
      // If the table doesn't exist, ignore and continue
      if ((dpErr as any)?.message?.includes('relation "disabled_properties" does not exist')) {
        console.log('disabled_properties table not present; continuing');
      } else {
        console.error('Error checking disabled_properties table:', dpErr);
      }
    }
      if (manager && manager.status !== 'Active') {
        console.warn(`[API] GET /api/properties/${id} - Manager is not active, hiding property`);
        return NextResponse.json({ message: "Property not found" }, { status: 404 });
      }
    } catch (mgrErr) {
      console.error('Error checking manager status for property:', mgrErr);
    }

    console.log(`[API] GET /api/properties/${id} - Property found, location: ${property.location?.id}`);

    // Handle case where location is null
    if (!property.location || !property.location.id) {
      console.warn(`[API] GET /api/properties/${id} - Location is null or missing ID, returning without coordinates`);
      
      // ✅ Step 4: Store in cache for 1 hour
      queryCache.set(cacheKey, property, 3600);
      
      return NextResponse.json(property, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
          'Content-Type': 'application/json',
        },
      });
    }

    try {
      const coordinates: { coordinates: string }[] =
        await prisma.$queryRaw`SELECT ST_asText(coordinates) as coordinates from "Location" where id = ${property.location.id}`;

      // Handle case where coordinates are empty
      if (!coordinates || coordinates.length === 0 || !coordinates[0]?.coordinates) {
        console.warn(`[API] GET /api/properties/${id} - No coordinates found in database`);
        
        // ✅ Step 4: Store in cache for 1 hour
        queryCache.set(cacheKey, property, 3600);
        
        return NextResponse.json(property, {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            'Content-Type': 'application/json',
          },
        });
      }

      const geoJSON: any = wktToGeoJSON(coordinates[0].coordinates);
      const longitude = geoJSON.coordinates[0];
      const latitude = geoJSON.coordinates[1];

      const propertyWithCoordinates = {
        ...property,
        location: {
          ...property.location,
          coordinates: {
            longitude,
            latitude,
          },
        },
      };
      
      console.log(`[API] GET /api/properties/${id} - Successfully added coordinates`);
      
      // ✅ Step 4: Store in cache for 1 hour
      queryCache.set(cacheKey, propertyWithCoordinates, 3600);
      
      // ✅ Step 5: Return with cache headers
      return NextResponse.json(propertyWithCoordinates, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
          'Content-Type': 'application/json',
        },
      });
    } catch (coordError: any) {
      console.error(`[API] GET /api/properties/${id} - Error fetching coordinates:`, coordError);
      
      // ✅ Step 4: Store in cache for 1 hour (without coordinates)
      queryCache.set(cacheKey, property, 3600);
      
      // Return property without coordinates rather than failing
      return NextResponse.json(property, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
          'Content-Type': 'application/json',
        },
      });
    }
  } catch (err: any) {
    console.error("Error retrieving property:", err);
    return NextResponse.json(
      { message: `Error retrieving property: ${err.message}` },
      { status: 500 }
    );
  }
}

// PUT handler for updating a property
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Quick size header check before parsing
    const contentLengthHeader = request.headers.get('content-length');
    if (contentLengthHeader) {
      const contentLength = parseInt(contentLengthHeader, 10);
      const HARD_LIMIT = 25 * 1024 * 1024; // 25MB aligned with config
      if (contentLength > HARD_LIMIT) {
        return NextResponse.json({
          message: 'Payload too large. Upload images separately via /photos or /photos/batch endpoints.',
          maxBytes: HARD_LIMIT,
          receivedBytes: contentLength,
          guidance: 'Send only textual fields to PUT. Use batch photo endpoint for images.'
        }, { status: 413 });
      }
    }

    // Verify authentication and role
    const authResult = await verifyAuth(request, ['manager']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: paramId } = await params;
    const id = Number(paramId);
    
    if (isNaN(id)) {
      return NextResponse.json({ message: "Invalid property ID" }, { status: 400 });
    }
    
    // Check if property exists
    const existingProperty = await prisma.property.findUnique({
      where: { id },
      include: { location: true }
    });

    if (!existingProperty) {
      return NextResponse.json({ message: "Property not found" }, { status: 404 });
    }

    // Parse the form data with enhanced error handling
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (e) {
      return NextResponse.json({ message: 'Failed to parse form data', error: e instanceof Error ? e.message : String(e) }, { status: 400 });
    }

    // Detect any File entries and reject to enforce new flow
    let containsFiles = false;
    for (const [, value] of formData.entries()) {
      if (value instanceof File) { containsFiles = true; break; }
    }
    if (containsFiles) {
      return NextResponse.json({
        message: 'File uploads are no longer accepted in PUT /properties/:id.',
        guidance: 'First update metadata via PUT without images. Then upload images using POST /api/properties/{id}/photos or /photos/batch.',
        endpoints: ['/api/properties/{id}/photos', '/api/properties/{id}/photos/batch']
      }, { status: 400 });
    }

    // Handle authorization check - ensure user can edit this property
    const managerCognitoId = formData.get('managerCognitoId') as string;
    if (managerCognitoId && managerCognitoId !== existingProperty.managerCognitoId) {
      const isAdmin = authResult.userRole === 'admin'; // Check if user is admin
      if (!isAdmin) {
        return NextResponse.json({ message: "Unauthorized to update this property" }, { status: 403 });
      }
    }

    // Extract location data
    const address = formData.get('address') as string;
    const city = formData.get('city') as string;
    const suburb = formData.get('suburb') as string;
    const state = formData.get('state') as string;
    const country = formData.get('country') as string;
    const postalCode = formData.get('postalCode') as string;

    // Get all files
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (value instanceof File && key.startsWith('photos')) {
        files.push(value);
      }
    }

    // Handle file uploads if any
    let photoUrls = existingProperty.photoUrls || [];
    
    // Check if we have a photoUrls field in the form data (for selective deletion)
  // Support both legacy photoUrls and new finalPhotoUrlsToKeep field
  const photoUrlsFromForm = formData.get('photoUrls') || formData.get('finalPhotoUrlsToKeep');
  if (photoUrlsFromForm && typeof photoUrlsFromForm === 'string') {
      try {
        // Parse the kept photo URLs from the form data
        const keptPhotoUrls = JSON.parse(photoUrlsFromForm);
        
        // Identify photos that need to be deleted
        const photosToDelete = photoUrls.filter((url: string) => !keptPhotoUrls.includes(url));
        
        // Delete these photos from S3
        if (photosToDelete.length > 0) {
          try {
            await Promise.all(photosToDelete.map((url: string) => deleteFileFromS3(url)));
            console.log(`Successfully deleted ${photosToDelete.length} photos`);
          } catch (deleteError) {
            console.error('Error deleting selected photos:', deleteError);
            // Continue with the update even if deletion fails
          }
        }
        
        // Update photoUrls to only include kept photos
        photoUrls = keptPhotoUrls;
      } catch (parseError) {
        console.error('Error parsing photoUrls JSON:', parseError);
        // Continue with existing photo URLs if parsing fails
      }
    }
    
    if (files.length > 0) {
      try {
        // Upload new files
        const newPhotoUrls = await Promise.all(
          files.map(async file => {
            const buffer = await file.arrayBuffer();
            return uploadFileToS3(Buffer.from(buffer), file.name, file.type);
          })
        );
        
        // Replace or append photos based on request
        const replacePhotos = formData.get('replacePhotos') === 'true';
        if (replacePhotos) {
          // Delete existing photos from S3 if replace is specified
          if (photoUrls.length > 0) {
            try {
              await Promise.all(photoUrls.map((url: string) => deleteFileFromS3(url)));
              console.log('Successfully deleted old photos');
            } catch (deleteError) {
              console.error('Error deleting old photos:', deleteError);
              // Continue with the update even if deletion fails
            }
          }
          photoUrls = newPhotoUrls;
        } else {
          // Append new photos to existing ones
          photoUrls = [...photoUrls, ...newPhotoUrls];
        }
      } catch (uploadError) {
        console.error('Error uploading new photos:', uploadError);
        return NextResponse.json({ 
          message: `Error uploading photos: ${uploadError instanceof Error ? uploadError.message : String(uploadError)}` 
        }, { status: 500 });
      }
    }

    // Update location if any location field is provided
    if (address || city || suburb || state || country || postalCode) {
      // Get existing location data
      const locationData = {
        address: address || existingProperty.location.address,
        city: city || existingProperty.location.city,
        suburb: suburb || existingProperty.location.suburb,
        state: state || existingProperty.location.state,
        country: country || existingProperty.location.country,
        postalCode: postalCode || existingProperty.location.postalCode,
      };
      
      // Update location
      await prisma.location.update({
        where: { id: existingProperty.location.id },
        data: locationData,
      });
    }

    // Extract and parse property data from form (support repeated keys for arrays)
  const arrayFieldNames = new Set(['amenities','highlights','closestUniversities','closestCampuses','accreditedBy']);
    const propertyData: any = {};
    for (const [key, value] of formData.entries()) {
      if (
        key === 'address' || key === 'city' || key === 'suburb' || key === 'state' ||
        key === 'country' || key === 'postalCode' ||
        key === 'managerCognitoId' || key === 'replacePhotos' ||
        key === 'locationId' || key === 'photoUrls' ||
        key === 'finalPhotoUrlsToKeep' || // helper field
        key === 'finalPhotoUrlsToKeep[]' ||
        key.startsWith('photos')
      ) continue;
      if (arrayFieldNames.has(key)) {
        if (!propertyData[key]) propertyData[key] = [];
        propertyData[key].push(String(value));
      } else {
        // Only set if not already set (first wins) to avoid overwriting with duplicates
        if (propertyData[key] === undefined) propertyData[key] = value;
      }
    }

    // Update property with proper type handling
    let updatedProperty;
    try {
      updatedProperty = await prisma.property.update({
        where: { id },
        data: {
          ...propertyData,
          photoUrls,
          // Parse array fields if present
          ...(propertyData.amenities && {
            amenities: Array.isArray(propertyData.amenities) 
              ? propertyData.amenities 
              : typeof propertyData.amenities === "string"
                ? propertyData.amenities.split(",")
                : undefined
          }),
          ...(propertyData.highlights && {
            highlights: Array.isArray(propertyData.highlights)
              ? propertyData.highlights
              : typeof propertyData.highlights === "string"
                ? propertyData.highlights.split(",")
                : undefined
          }),
          // Parse array fields (closestUniversities) if present
          ...(propertyData.closestUniversities && {
            closestUniversities: Array.isArray(propertyData.closestUniversities)
              ? propertyData.closestUniversities
              : typeof propertyData.closestUniversities === 'string'
                ? propertyData.closestUniversities.split(',')
                : undefined
          }),
          // Parse accreditedBy if present
          ...(propertyData.accreditedBy && {
            accreditedBy: Array.isArray(propertyData.accreditedBy)
              ? propertyData.accreditedBy
              : typeof propertyData.accreditedBy === 'string'
                ? propertyData.accreditedBy.split(',')
                : undefined
          }),
          // Set closestUniversity if present
          ...(propertyData.closestUniversity !== undefined && {
            closestUniversity: propertyData.closestUniversity || null
          }),
          // Parse closestCampuses if present
          ...(propertyData.closestCampuses && {
            closestCampuses: Array.isArray(propertyData.closestCampuses)
              ? propertyData.closestCampuses
              : typeof propertyData.closestCampuses === 'string'
                ? propertyData.closestCampuses.split(',')
                : undefined
          }),
          // Parse boolean fields if present
          ...(propertyData.isPetsAllowed !== undefined && {
            isPetsAllowed: propertyData.isPetsAllowed === "true"
          }),
          ...(propertyData.isParkingIncluded !== undefined && {
            isParkingIncluded: propertyData.isParkingIncluded === "true"
          }),
          ...(propertyData.isNsfassAccredited !== undefined && {
            isNsfassAccredited: propertyData.isNsfassAccredited === "true"
          }),
          // Parse numeric fields if present
          ...(propertyData.pricePerMonth !== undefined && {
            pricePerMonth: parseFloat(propertyData.pricePerMonth) || undefined
          }),
          ...(propertyData.securityDeposit !== undefined && {
            securityDeposit: parseFloat(propertyData.securityDeposit) || undefined
          }),
          ...(propertyData.beds !== undefined && {
            beds: parseInt(propertyData.beds) || undefined
          }),
          ...(propertyData.baths !== undefined && {
            baths: parseFloat(propertyData.baths) || undefined
          }),
          // Only include kitchens if it exists in the schema
          ...(propertyData.kitchens !== undefined && {
            kitchens: parseInt(propertyData.kitchens) || undefined
          }),
          ...(propertyData.squareFeet !== undefined && {
            squareFeet: parseInt(propertyData.squareFeet) || undefined
          }),
        },
        include: {
          location: true,
        },
      });
    } catch (dbError: any) {
      console.error('Database error during property update:', dbError);
      // Check if it's a column doesn't exist error (for kitchens field)
      if (dbError.message && dbError.message.includes('kitchens') && dbError.message.includes('does not exist')) {
        console.log('Retrying update without kitchens field...');
        // Retry without the kitchens field
        const { kitchens, ...dataWithoutKitchens } = propertyData;
        updatedProperty = await prisma.property.update({
          where: { id },
          data: {
            ...dataWithoutKitchens,
            photoUrls,
            // Parse array fields if present
            ...(propertyData.amenities && {
              amenities: Array.isArray(propertyData.amenities) 
                ? propertyData.amenities 
                : typeof propertyData.amenities === "string"
                  ? propertyData.amenities.split(",")
                  : undefined
            }),
            ...(propertyData.highlights && {
              highlights: Array.isArray(propertyData.highlights)
                ? propertyData.highlights
                : typeof propertyData.highlights === "string"
                  ? propertyData.highlights.split(",")
                  : undefined
            }),
            // Parse array fields if present (retry path)
            ...(propertyData.closestUniversities && {
              closestUniversities: Array.isArray(propertyData.closestUniversities)
                ? propertyData.closestUniversities
                : typeof propertyData.closestUniversities === 'string'
                  ? propertyData.closestUniversities.split(',')
                  : undefined
            }),
            // Parse accreditedBy if present (retry path)
            ...(propertyData.accreditedBy && {
              accreditedBy: Array.isArray(propertyData.accreditedBy)
                ? propertyData.accreditedBy
                : typeof propertyData.accreditedBy === 'string'
                  ? propertyData.accreditedBy.split(',')
                  : undefined
            }),
            // Set closestUniversity if present (retry path)
            ...(propertyData.closestUniversity !== undefined && {
              closestUniversity: propertyData.closestUniversity || null
            }),
            ...(propertyData.closestCampuses && {
              closestCampuses: Array.isArray(propertyData.closestCampuses)
                ? propertyData.closestCampuses
                : typeof propertyData.closestCampuses === 'string'
                  ? propertyData.closestCampuses.split(',')
                  : undefined
            }),
            // Parse boolean fields if present
            ...(propertyData.isPetsAllowed !== undefined && {
              isPetsAllowed: propertyData.isPetsAllowed === "true"
            }),
            ...(propertyData.isParkingIncluded !== undefined && {
              isParkingIncluded: propertyData.isParkingIncluded === "true"
            }),
            ...(propertyData.isNsfassAccredited !== undefined && {
              isNsfassAccredited: propertyData.isNsfassAccredited === "true"
            }),
            // Parse numeric fields if present
            ...(propertyData.pricePerMonth !== undefined && {
              pricePerMonth: parseFloat(propertyData.pricePerMonth) || undefined
            }),
            ...(propertyData.securityDeposit !== undefined && {
              securityDeposit: parseFloat(propertyData.securityDeposit) || undefined
            }),
            ...(propertyData.beds !== undefined && {
              beds: parseInt(propertyData.beds) || undefined
            }),
            ...(propertyData.baths !== undefined && {
              baths: parseFloat(propertyData.baths) || undefined
            }),
            ...(propertyData.squareFeet !== undefined && {
              squareFeet: parseInt(propertyData.squareFeet) || undefined
            }),
          },
          include: {
            location: true,
          },
        });
      } else {
        throw dbError; // Re-throw if it's not a kitchens column error
      }
    }

    // Fetch the updated location to get coordinates
    const updatedLocation = await prisma.$queryRaw<{ x: number, y: number }[]>`
      SELECT 
        ST_X(coordinates::geometry) as x,
        ST_Y(coordinates::geometry) as y
      FROM "Location"
      WHERE id = ${updatedProperty.location.id}
    `;

    // Add coordinates to the response
    const propertyWithCoordinates = {
      ...updatedProperty,
      location: {
        ...updatedProperty.location,
        coordinates: {
          latitude: updatedLocation[0]?.y,
          longitude: updatedLocation[0]?.x,
        },
      },
    };

    console.log("Property updated successfully:", propertyWithCoordinates);
    
    // ✅ Invalidate cache after update
    queryCache.invalidateAll();
    
    return NextResponse.json(propertyWithCoordinates);
  } catch (err: any) {
    console.error("Error updating property:", err);
    return NextResponse.json(
      { message: `Error updating property: ${err.message}` },
      { status: 500 }
    );
  }
}

// DELETE handler for deleting a property
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify authentication and role
    const authResult = await verifyAuth(request, ['manager']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: paramId } = await params;
    const id = Number(paramId);
    
    if (isNaN(id)) {
      return NextResponse.json({ message: "Invalid property ID" }, { status: 400 });
    }
    
    // Check if property exists
    const existingProperty = await prisma.property.findUnique({
      where: { id },
      include: { location: true }
    });

    if (!existingProperty) {
      return NextResponse.json({ message: "Property not found" }, { status: 404 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const managerCognitoId = searchParams.get('managerCognitoId');

    // Handle authorization check - ensure user can delete this property
    if (managerCognitoId && managerCognitoId !== existingProperty.managerCognitoId) {
      const isAdmin = authResult.userRole === 'admin'; // Check if user is admin
      if (!isAdmin) {
        return NextResponse.json({ message: "Unauthorized to delete this property" }, { status: 403 });
      }
    }

    // Ensure disabled_properties table exists so we can hide the property without deleting data
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS disabled_properties (
        property_id INTEGER PRIMARY KEY,
        disabled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        disabled_by TEXT
      )
    `);

    const actingUserId = authResult.userId || authResult.userRole || 'unknown';

    // Record disable action instead of deleting any property data
    await prisma.$executeRaw(
      Prisma.sql`INSERT INTO disabled_properties (property_id, disabled_at, disabled_by)
                  VALUES (${id}, NOW(), ${actingUserId})
                  ON CONFLICT (property_id) DO UPDATE SET disabled_at = NOW(), disabled_by = EXCLUDED.disabled_by`
    );

    // ✅ Invalidate cache after disabling the property
    queryCache.invalidateAll();

    return NextResponse.json({ message: "Property disabled successfully", id });
  } catch (err: any) {
    console.error("Error deleting property:", err);
    return NextResponse.json(
      { message: `Error deleting property: ${err.message}` },
      { status: 500 }
    );
  }
}
