import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import axios from 'axios';
import { verifyAuth } from '@/lib/auth';
import type { Property } from '@/types/property';
import { queryCache } from '@/lib/queryCache';
import { uploadFileToS3, deleteFileFromS3 } from '@/lib/s3';

// ✅ ISR: Cache responses for 1 hour
export const revalidate = 3600;

// Using the shared Prisma client instance from @/lib/prisma

// GET handler for properties
export async function GET(request: NextRequest) {
  // Ensure disabled_properties table exists before querying
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS disabled_properties (
        property_id INTEGER PRIMARY KEY,
        disabled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        disabled_by TEXT
      )
    `);
  } catch (tableErr) {
    console.warn('Warning: Could not verify disabled_properties table:', tableErr);
  }

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

    // coordinates support
    const coordinates = searchParams.get('coordinates');
    const latitudeParam = searchParams.get('latitude');
    const longitudeParam = searchParams.get('longitude');

    let latNum: number | null = null;
    let lngNum: number | null = null;

    if (coordinates) {
      // coordinates=lng,lat from frontend
      const [lngStr, latStr] = coordinates.split(',');
      const parsedLat = parseFloat(latStr);
      const parsedLng = parseFloat(lngStr);
      if (Number.isFinite(parsedLat) && Number.isFinite(parsedLng)) {
        latNum = parsedLat;
        lngNum = parsedLng;
      }
    }

    if (latNum === null && latitudeParam) {
      const parsedLat = parseFloat(latitudeParam);
      if (Number.isFinite(parsedLat)) latNum = parsedLat;
    }
    if (lngNum === null && longitudeParam) {
      const parsedLng = parseFloat(longitudeParam);
      if (Number.isFinite(parsedLng)) lngNum = parsedLng;
    }

    const location = searchParams.get('location');      // city/suburb/neighborhood
    const propertyName = searchParams.get('propertyName');
    const limitParam = searchParams.get('limit');
    let limit = 50;
    if (limitParam) {
      const parsed = parseInt(limitParam, 10);
      if (!isNaN(parsed)) {
        limit = Math.min(Math.max(parsed, 1), 100);
      }
    }

    console.log('========== PROPERTIES API REQUEST ==========');
    console.log('API Query params:', {
      location,
      propertyName,
      coordinates,
      latitudeParam,
      longitudeParam,
      latNum,
      lngNum,
    });
    console.log('Full search params:', Object.fromEntries(searchParams.entries()));
    console.log('===========================================');

    // cache key
    const cacheParams = {
      favoriteIds,
      priceMin,
      priceMax,
      beds,
      baths,
      propertyType,
      squareFeetMin,
      squareFeetMax,
      amenities,
      availableFrom,
      latitude: latNum,
      longitude: lngNum,
      location,
      propertyName,
      limit,
    };

    const cacheKey = queryCache.getKey('properties', cacheParams);
    const cachedResult = queryCache.get<Property[]>(cacheKey);
    if (cachedResult) {
      console.log(
        `✅ Cache HIT for properties query - returning ${cachedResult.length} results`
      );
      return NextResponse.json(cachedResult);
    }

    const whereConditions: Prisma.Sql[] = [];

    if (favoriteIds) {
      const favoriteIdsArray = favoriteIds.split(',').map(Number);
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

    if (beds && beds !== 'any') {
      whereConditions.push(Prisma.sql`p.beds >= ${Number(beds)}`);
    }

    if (baths && baths !== 'any') {
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

    // text search (name/description/location) - ALWAYS search by property name if provided
    let nameSearchCondition: Prisma.Sql | null = null;
    if (propertyName && propertyName !== 'any') {
      const searchTerm = `%${propertyName.toLowerCase()}%`;
      console.log(
        'Searching for property name/text:',
        propertyName,
        'with search term:',
        searchTerm
      );
      // Property name search is ALWAYS applied regardless of coordinates
      nameSearchCondition = Prisma.sql`(
        LOWER(p.name) LIKE ${searchTerm} OR 
        LOWER(p.description) LIKE ${searchTerm} OR
        LOWER(l.address) LIKE ${searchTerm} OR
        LOWER(l.city) LIKE ${searchTerm} OR
        LOWER(l.suburb) LIKE ${searchTerm} OR
        LOWER(l.state) LIKE ${searchTerm}
      )`;
      // Add directly to whereConditions to ensure it's always applied
      whereConditions.push(nameSearchCondition);
    }

    if (propertyType && propertyType !== 'any') {
      whereConditions.push(
        Prisma.sql`p."propertyType" = ${propertyType}::"PropertyType"`
      );
    }

    if (amenities && amenities !== 'any') {
      const amenitiesArray = amenities.split(',');
      whereConditions.push(Prisma.sql`p.amenities @> ${amenitiesArray}`);
    }

    if (availableFrom && availableFrom !== 'any') {
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

    // coordinate validity
    const hasValidCoordinates =
      latNum !== null &&
      lngNum !== null &&
      Number.isFinite(latNum) &&
      Number.isFinite(lngNum) &&
      (latNum !== 0 || lngNum !== 0);

    // location text filter (only when no coordinates)
    let locationSearchCondition: Prisma.Sql | null = null;
    if (!hasValidCoordinates && location && location !== 'any' && location.trim() !== '') {
      const normalizedLocation = location
        .replace(/,\s*south africa/i, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();

      console.log('Location search - raw:', location, 'normalized:', normalizedLocation);

      if (normalizedLocation) {
        const escapedLocation = normalizedLocation.replace(/[%_]/g, '\\$&');
        const wildcardLocation = `%${escapedLocation}%`;

        locationSearchCondition = Prisma.sql`(
          (l.city IS NOT NULL AND LOWER(l.city) = ${normalizedLocation}) OR
          (l.suburb IS NOT NULL AND LOWER(l.suburb) = ${normalizedLocation}) OR
          (l.state IS NOT NULL AND LOWER(l.state) = ${normalizedLocation}) OR
          (l.address IS NOT NULL AND l.address != '' AND LOWER(l.address) LIKE ${wildcardLocation} ESCAPE '\\') OR
          (l.city IS NOT NULL AND l.city != '' AND LOWER(l.city) LIKE ${wildcardLocation} ESCAPE '\\') OR
          (l.suburb IS NOT NULL AND l.suburb != '' AND LOWER(l.suburb) LIKE ${wildcardLocation} ESCAPE '\\') OR
          (l.state IS NOT NULL AND l.state != '' AND LOWER(l.state) LIKE ${wildcardLocation} ESCAPE '\\')
        )`;

        console.log('Location search condition will be applied.');
      } else {
        console.log('Normalized location is empty; skipping location filter.');
      }
    }

    // combine location filters (but NOT name filters - those are already added)
    if (!hasValidCoordinates) {
      if (locationSearchCondition) {
        whereConditions.push(locationSearchCondition);
      }
    }
    // Note: nameSearchCondition is already added above if it exists

    // geographic radius filter when coordinates present
    if (hasValidCoordinates) {
      const radiusInMeters = 20000; // 20km
      console.log('Applying ST_DWithin radius filter:', {
        lng: lngNum,
        lat: latNum,
        radiusInMeters,
      });

      whereConditions.unshift(
        Prisma.sql`ST_DWithin(
          l.coordinates,
          ST_SetSRID(ST_MakePoint(${lngNum}, ${latNum}), 4326)::geography,
          ${radiusInMeters}
        )`
      );
    }

    // full query (same as your original with location JSON)
    const baseQuery = Prisma.sql`
      SELECT 
        p.*,
        (
          SELECT MIN(r."pricePerMonth")
          FROM "Room" r
          WHERE r."propertyId" = p.id AND r."isAvailable" = true
        ) as "minRoomPrice",
        (
          SELECT COUNT(*)::int
          FROM "Room" r
          WHERE r."propertyId" = p.id AND r."isAvailable" = true
        ) as "availableRooms",
        l.id as "locationId",
        json_build_object(
          'id', l.id,
          'address', l.address,
          'city', l.city,
          'suburb', l.suburb,
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
      JOIN "Manager" m ON p."managerCognitoId" = m."cognitoId"
      LEFT JOIN disabled_properties dp ON dp.property_id = p.id
      ${
        // Always require the manager to be Active and the property not to be present in disabled_properties so disabled properties don't show
        whereConditions.length > 0
          ? Prisma.sql`WHERE m.status = 'Active'::"ManagerStatus" AND ${Prisma.join(whereConditions, ' AND ')} AND dp.property_id IS NULL`
          : Prisma.sql`WHERE m.status = 'Active'::"ManagerStatus" AND dp.property_id IS NULL`
      }
    `;

    const initialQuery = Prisma.sql`${baseQuery} ORDER BY p.id DESC LIMIT ${limit}`;

    let properties: Property[] = [];
    try {
      properties = (await prisma.$queryRaw(initialQuery)) as Property[];
    } catch (err: any) {
      if (err?.code === 'P2024' && limit > 10) {
        console.warn('P2024 timeout – retrying with smaller limit (10)');
        const retryQuery = Prisma.sql`${baseQuery} ORDER BY p.id DESC LIMIT ${10}`;
        properties = (await prisma.$queryRaw(retryQuery)) as Property[];
      } else {
        throw err;
      }
    }

    console.log('========== QUERY RESULTS ==========');
    console.log(`✅ Query returned ${properties.length} properties`);
    if (properties.length > 0) {
      console.log(
        'Sample cities:',
        properties.slice(0, 5).map((p: any) => p.location?.city || 'unknown')
      );
    }
    console.log('====================================');

    const cacheTTL = location || propertyName || hasValidCoordinates ? 60 : 180;
    queryCache.set(cacheKey, properties, cacheTTL);
    console.log(`✅ Cache SET - Results cached for ${cacheTTL}s`);

    const browserCacheTTL = location || propertyName || hasValidCoordinates ? 30 : 180;
    return NextResponse.json(properties, {
      headers: {
        'Cache-Control': `public, s-maxage=${browserCacheTTL}, stale-while-revalidate=${
          browserCacheTTL * 2
        }`,
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  } catch (error: any) {
    console.error('Error retrieving properties:', error);
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
  const state = (propertyData.state as string) || (propertyData.province as string);
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
      // Ensure manager exists and is Active - prevent blocked landlords from creating properties
      const manager = await prisma.manager.findUnique({ where: { cognitoId: managerCognitoId } });
      if (!manager) {
        return NextResponse.json({ message: 'Manager account not found' }, { status: 404 });
      }
      if (manager.status !== 'Active') {
        return NextResponse.json({ message: 'Manager account is not active. Cannot create property.' }, { status: 403 });
      }
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
          INSERT INTO "Location" ("address", "city", "suburb", "state", "country", "postalCode", "coordinates")
          VALUES (
            ${addressParts.join(', ')},
            ${city},
            ${suburb || null},
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
          if (
            key !== 'address' &&
            key !== 'city' &&
            key !== 'suburb' &&
            key !== 'state' &&
            key !== 'country' &&
            key !== 'postalCode' &&
            key !== 'managerCognitoId' &&
            key !== 'photoUrls' &&
            key !== 'province' &&
            key !== 'accreditedBy' &&
            key !== 'closestUniversity' &&
            key !== 'closeToUniversity'
          ) {
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
            // Accredited by (array of University enums)
            accreditedBy: Array.isArray(propertyData.accreditedBy)
              ? propertyData.accreditedBy
              : typeof propertyData.accreditedBy === "string"
                ? propertyData.accreditedBy.split(",")
                : [],
            // Closest campuses (string website labels)
            closestCampuses: Array.isArray(propertyData.closestCampuses)
              ? propertyData.closestCampuses
              : typeof propertyData.closestCampuses === "string"
                ? propertyData.closestCampuses.split(",")
                : [],
            // Single closest university (optional)
            closestUniversity: propertyData.closestUniversity || null,
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
        
        // ✅ Invalidate cache after creation
        queryCache.invalidateAll();
        
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
