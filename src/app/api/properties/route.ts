import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import axios from 'axios';
import { verifyAuth } from '@/lib/auth';
import type { Property } from '@/types/property';

// Using the shared Prisma client instance from @/lib/prisma

// Configure S3 client with credentials
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Enhanced upload function with better error handling
async function uploadFileToS3(file: Buffer, originalName: string, mimeType: string): Promise<string> {
  // Validate S3 configuration
  if (!process.env.AWS_BUCKET_NAME) {
    throw new Error("AWS_BUCKET_NAME is not configured in environment variables");
  }

  if (!process.env.AWS_REGION) {
    throw new Error("AWS_REGION is not configured in environment variables");
  }

  // Validate file
  if (!file) {
    throw new Error("Invalid file data - missing file buffer");
  }

  // Create a more unique file name to prevent collisions
  const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const safeFileName = originalName.replace(/[^a-zA-Z0-9.-]/g, '');
  const key = `properties/${uniquePrefix}-${safeFileName}`;
  
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: mimeType,
  // ACL removed (Bucket Owner Enforced). Use bucket policy/CloudFront for access control.
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
    
    // ACL setting skipped: bucket uses Object Ownership (Bucket owner enforced)

    // Construct URL in a consistent way
    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    console.log(`Generated file URL: ${fileUrl}`);
    
    return fileUrl;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error(`Failed to upload file to S3: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Helper function to delete a file from S3
async function deleteFileFromS3(fileUrl: string): Promise<void> {
  // Validate S3 configuration
  if (!process.env.AWS_BUCKET_NAME) {
    throw new Error("AWS_BUCKET_NAME is not configured in environment variables");
  }

  try {
    // Extract the key from the URL
    const urlPath = new URL(fileUrl).pathname;
    const key = urlPath.startsWith('/') ? urlPath.substring(1) : urlPath;

    const deleteParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    };

    await s3Client.send(new DeleteObjectCommand(deleteParams));
    console.log(`Successfully deleted file: ${key}`);
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw new Error(`Failed to delete file from S3: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// GET handler for properties
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const favoriteIds = searchParams.get('favoriteIds');
    const priceMin = searchParams.get('priceMin');
    const priceMax = searchParams.get('priceMax');
    const beds = searchParams.get('beds');
    const baths = searchParams.get('baths');
    const propertyType = searchParams.get('propertyType');
    const squareFeetMin = searchParams.get('squareFeetMin');
    const squareFeetMax = searchParams.get('squareFeetMax');
    const amenities = searchParams.get('amenities');
    const availableFrom = searchParams.get('availableFrom');
    const latitude = searchParams.get('latitude');
    const longitude = searchParams.get('longitude');
    const propertyName = searchParams.get('propertyName'); // New parameter for property name search
    const limitParam = searchParams.get('limit');
    let limit = 50;
    if (limitParam) {
      const parsed = parseInt(limitParam, 10);
      if (!isNaN(parsed)) {
        limit = Math.min(Math.max(parsed, 1), 100); // enforce 1..100
      }
    }

    console.log('API Query params:', { propertyName, latitude, longitude });

    const whereConditions: Prisma.Sql[] = [];

    if (favoriteIds) {
      const favoriteIdsArray = favoriteIds.split(",").map(Number);
      whereConditions.push(
        Prisma.sql`p.id IN (${Prisma.join(favoriteIdsArray)})`
      );
    }

    if (priceMin) {
      whereConditions.push(
        Prisma.sql`p."pricePerMonth" >= ${Number(priceMin)}`
      );
    }

    if (priceMax) {
      whereConditions.push(
        Prisma.sql`p."pricePerMonth" <= ${Number(priceMax)}`
      );
    }

    if (beds && beds !== "any") {
      whereConditions.push(Prisma.sql`p.beds >= ${Number(beds)}`);
    }

    if (baths && baths !== "any") {
      whereConditions.push(Prisma.sql`p.baths >= ${Number(baths)}`);
    }

    if (squareFeetMin) {
      whereConditions.push(
        Prisma.sql`p."squareFeet" >= ${Number(squareFeetMin)}`
      );
    }

    if (squareFeetMax) {
      whereConditions.push(
        Prisma.sql`p."squareFeet" <= ${Number(squareFeetMax)}`
      );
    }

    if (propertyName && propertyName !== "any") {
      // Search in property name, property description, and location address/city
      const searchTerm = `%${propertyName.toLowerCase()}%`;
      console.log('Searching for property name:', propertyName, 'with search term:', searchTerm);
      whereConditions.push(
        Prisma.sql`(
          LOWER(p.name) LIKE ${searchTerm} OR 
          LOWER(p.description) LIKE ${searchTerm} OR
          LOWER(l.address) LIKE ${searchTerm} OR
          LOWER(l.city) LIKE ${searchTerm}
        )`
      );
    }

    if (propertyType && propertyType !== "any") {
      whereConditions.push(
        Prisma.sql`p."propertyType" = ${propertyType}::"PropertyType"`
      );
    }

    if (amenities && amenities !== "any") {
      const amenitiesArray = amenities.split(",");
      whereConditions.push(Prisma.sql`p.amenities @> ${amenitiesArray}`);
    }

    if (availableFrom && availableFrom !== "any") {
      const date = new Date(availableFrom);
      if (!isNaN(date.getTime())) {
        whereConditions.push(
          Prisma.sql`EXISTS (
            SELECT 1 FROM "Lease" l 
            WHERE l."propertyId" = p.id 
            AND l."startDate" <= ${date.toISOString()}
          )`
        );
      }
    }

    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      
      // Only apply geographical filtering if coordinates are meaningful (not 0,0)
      if (lat !== 0 || lng !== 0) {
        const radiusInKilometers = 1000;
        const degrees = radiusInKilometers / 111; // Converts kilometers to degrees

        whereConditions.push(
          Prisma.sql`ST_DWithin(
            l.coordinates::geometry,
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
            ${degrees}
          )`
        );
      }
    }

  const completeQuery = Prisma.sql`
      SELECT 
        p.*,
        l.id as "locationId", 
        json_build_object(
          'id', l.id,
          'address', l.address,
          'city', l.city,
          'state', l.state,
          'country', l.country,
          'postalCode', l."postalCode",
          'coordinates', json_build_object(
            'longitude', ST_X(l."coordinates"::geometry),
            'latitude', ST_Y(l."coordinates"::geometry)
          )
        ) as location
      FROM "Property" p
      JOIN "Location" l ON p."locationId" = l.id
      ${
        whereConditions.length > 0
          ? Prisma.sql`WHERE ${Prisma.join(whereConditions, " AND ")}`
          : Prisma.empty
      }
      ORDER BY p.id DESC
      LIMIT ${limit}
    `;

    let properties: Property[] = [];
    try {
      properties = await prisma.$queryRaw(completeQuery) as Property[];
    } catch (err: any) {
      // If connection pool timeout, retry once with smaller limit to reduce pressure
      if (err?.code === 'P2024' && limit > 10) {
        console.warn('P2024 timeout – retrying with smaller limit (10)');
        const retryQuery = Prisma.sql`${completeQuery} LIMIT 10`; // append limit safeguard
        try {
          properties = await prisma.$queryRaw(retryQuery) as Property[];
        } catch (retryErr) {
          throw retryErr;
        }
      } else {
        throw err;
      }
    }

    console.log(`Query returned ${properties.length} properties for search:`, { propertyName, latitude, longitude });

    return NextResponse.json(properties);
  } catch (error: any) {
    console.error("Error retrieving properties:", error);
    return NextResponse.json(
      { message: `Error retrieving properties: ${error.message}` },
      { status: 500 }
    );
  }
}

// POST handler for creating a property
export async function POST(request: NextRequest) {
  try {
    // Verify authentication and role
    const authResult = await verifyAuth(request, ['manager']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Parse the JSON data with improved error handling
    let propertyData;
    try {
      // Get the raw text first to debug any issues
      const rawText = await request.text();
      console.log("Raw request body:", rawText);
      
      if (!rawText || rawText.trim() === '') {
        return NextResponse.json({ 
          message: 'Error creating property: Empty request body',
        }, { status: 400 });
      }
      
      try {
        propertyData = JSON.parse(rawText);
        console.log("Property data received:", propertyData);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        return NextResponse.json({ 
          message: 'Error creating property: Invalid JSON format',
          error: parseError instanceof Error ? parseError.message : String(parseError),
          rawBody: rawText.substring(0, 500) // Include part of the raw body for debugging
        }, { status: 400 });
      }
    } catch (error) {
      console.error("Error reading request body:", error);
      return NextResponse.json({ 
        message: 'Error creating property: Failed to read request body',
        error: error instanceof Error ? error.message : String(error)
      }, { status: 400 });
    }
    
    // Extract property data
    const address = propertyData.address as string;
    const city = propertyData.city as string;
  const state = propertyData.state as string;
  const suburb = propertyData.suburb as string;
    const country = propertyData.country as string;
    const postalCode = propertyData.postalCode as string;
    const managerCognitoId = propertyData.managerCognitoId as string;
    
    // No files are handled in this endpoint anymore - they're uploaded separately
    
    // Validate required fields
    if (!address || !city || !country || !managerCognitoId) {
      return NextResponse.json({ 
        message: "Missing required fields",
        missingFields: {
          address: !address,
          city: !city,
          country: !country,
          postalCode: !postalCode,
          managerCognitoId: !managerCognitoId
        }
      }, { status: 400 });
    }

    // No file uploads in this endpoint - we'll use an empty array for photoUrls
    // Photos will be uploaded separately via the /properties/{id}/photos endpoint
    const photoUrls: string[] = [];

    // Create location first
    try {
      // Construct address string dynamically based on available components
  const addressParts = [address, suburb && suburb.trim() !== '' ? suburb : null, city].filter(Boolean) as string[];
      
      // Add state only if it's provided and valid
      if (state && state.trim() !== '') {
        addressParts.push(state);
      }
      
      // Add postal code if available
      if (postalCode && postalCode.trim() !== '') {
        addressParts.push(postalCode);
      }
      
      // Always add country
      addressParts.push(country);
      
      // Join parts into a single string
      const addressString = addressParts.join(', ');
      
      // Get coordinates from address using Google Maps Geocoding API
      const geocodingResponse = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          addressString
        )}&key=${process.env.GOOGLE_MAPS_API_KEY}`
      );

      if (
        geocodingResponse.data.status === "OK" &&
        geocodingResponse.data.results[0]
      ) {
        const { lat, lng } = geocodingResponse.data.results[0].geometry.location;
        
        // Create location using raw query
        const locationResult = await prisma.$queryRaw<{ id: number }[]>`
          INSERT INTO "Location" ("address", "city", "state", "country", "postalCode", "coordinates")
          VALUES (
            ${addressParts.join(', ')},
            ${city},
            ${state || 'N/A'},  -- Provide a default value if state is null
            ${country},
            ${postalCode || null},
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
          )
          RETURNING id
        `;
        
        if (!locationResult || locationResult.length === 0) {
          throw new Error("Failed to create location");
        }
        
        const locationId = locationResult[0].id;

        // Extract property data fields from JSON
        const extractedPropertyData: any = {};
        for (const [key, value] of Object.entries(propertyData)) {
          if (key !== 'address' && key !== 'city' && key !== 'state' && 
              key !== 'country' && key !== 'postalCode' && 
              key !== 'managerCognitoId' && key !== 'photoUrls') {
            extractedPropertyData[key] = value;
          }
        }

        // Create property with proper type handling
        const newProperty = await prisma.property.create({
          data: {
            ...extractedPropertyData,
            photoUrls,
            locationId: locationId,
            managerCognitoId,
            // Parse array fields
            amenities: Array.isArray(propertyData.amenities) 
              ? propertyData.amenities 
              : typeof propertyData.amenities === "string"
                ? propertyData.amenities.split(",")
                : [],
            highlights: Array.isArray(propertyData.highlights)
              ? propertyData.highlights
              : typeof propertyData.highlights === "string"
                ? propertyData.highlights.split(",")
                : [],
            // Parse boolean fields
            isPetsAllowed: typeof propertyData.isPetsAllowed === "boolean" 
              ? propertyData.isPetsAllowed 
              : propertyData.isPetsAllowed === "true",
            isParkingIncluded: typeof propertyData.isParkingIncluded === "boolean" 
              ? propertyData.isParkingIncluded 
              : propertyData.isParkingIncluded === "true",
            isNsfassAccredited: typeof propertyData.isNsfassAccredited === "boolean" 
              ? propertyData.isNsfassAccredited 
              : propertyData.isNsfassAccredited === "true",
            // Parse numeric fields (property price is derived from rooms; default to 0 here)
            pricePerMonth: 0,
            securityDeposit: typeof propertyData.securityDeposit === "number" 
              ? propertyData.securityDeposit 
              : parseFloat(propertyData.securityDeposit) || 0,
            beds: typeof propertyData.beds === "number" 
              ? propertyData.beds 
              : parseInt(propertyData.beds) || 1,
            baths: typeof propertyData.baths === "number" 
              ? propertyData.baths 
              : parseFloat(propertyData.baths) || 1,
            squareFeet: typeof propertyData.squareFeet === "number" 
              ? propertyData.squareFeet 
              : parseInt(propertyData.squareFeet) || 0,
          },
          include: {
            location: true,
            manager: true,
          },
        });

        // Fetch the updated location to get coordinates
        const updatedLocation = await prisma.$queryRaw<{ x: number, y: number }[]>`
          SELECT 
            ST_X(coordinates::geometry) as x,
            ST_Y(coordinates::geometry) as y
          FROM "Location"
          WHERE id = ${locationId}
        `;

        // Add coordinates to the response
        const propertyWithCoordinates = {
          ...newProperty,
          location: {
            ...newProperty.location,
            coordinates: {
              latitude: updatedLocation[0]?.y || lat,
              longitude: updatedLocation[0]?.x || lng,
            },
          },
        };

        console.log("Property created successfully:", propertyWithCoordinates);
        return NextResponse.json(propertyWithCoordinates, { status: 201 });
      } else {
        throw new Error("Could not geocode the address");
      }
    } catch (locationError: any) {
      console.error("Error creating location:", locationError);
      return NextResponse.json({ 
        message: `Error creating location: ${locationError.message}`,
        details: locationError
      }, { status: 500 });
    }
  } catch (err: any) {
    console.error("Unhandled error in createProperty:", err);
    return NextResponse.json(
      { message: `Error creating property: ${err.message}` },
      { status: 500 }
    );
  }
}
