import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { verifyAuth } from '@/lib/auth';

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
    const authResult = await verifyAuth(request, ['admin']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    let limit = 200;
    if (limitParam) {
      const parsed = parseInt(limitParam, 10);
      if (!isNaN(parsed)) {
        limit = Math.min(Math.max(parsed, 1), 500);
      }
    }

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
        ) as location,
        json_build_object(
          'id', m.id,
          'name', m.name,
          'cognitoId', m."cognitoId"
        ) as manager,
        CASE WHEN dp.property_id IS NOT NULL THEN true ELSE false END AS "isDisabled"
      FROM "Property" p
      LEFT JOIN "Location" l ON p."locationId" = l.id
      LEFT JOIN "Manager" m ON p."managerCognitoId" = m."cognitoId"
      LEFT JOIN disabled_properties dp ON dp.property_id = p.id
      ORDER BY p.id DESC
      LIMIT ${limit}
    `;

    let properties = [];
    try {
      properties = (await prisma.$queryRaw(baseQuery)) as any[];
    } catch (dbErr) {
      console.warn('Prisma admin properties query warning:', dbErr);
    }

    // Merge properties from Convex
    try {
      const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://hardy-bird-543.convex.cloud';
      const res = await fetch(`${CONVEX_URL}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: 'properties:getProperties', args: {} }),
      });
      const data = await res.json();

      if (Array.isArray(data?.value)) {
        const existingIds = new Set(properties.map((p) => String(p.id)));
        for (const cp of data.value) {
          if (!existingIds.has(String(cp._id))) {
            existingIds.add(String(cp._id));
            const photoUrls = Array.isArray(cp.photoUrls) ? cp.photoUrls : [];

            properties.push({
              id: cp._id,
              name: cp.name || 'Untitled Property',
              description: cp.description || '',
              pricePerMonth: cp.pricePerMonth || 3500,
              securityDeposit: cp.securityDeposit || 0,
              photoUrls,
              amenities: cp.amenities || [],
              highlights: cp.highlights || [],
              isPetsAllowed: cp.isPetsAllowed || false,
              isParkingIncluded: cp.isParkingIncluded || false,
              beds: cp.beds || 1,
              baths: cp.baths || 1,
              squareFeet: cp.squareFeet || 0,
              status: cp.status || 'Approved',
              location: {
                address: cp.address || '',
                city: cp.city || '',
                state: cp.state || '',
                country: cp.country || 'South Africa',
              },
              manager: {
                id: cp.managerId,
                name: cp.managerId,
                email: cp.managerId,
              },
              isDisabled: false,
            });
          }
        }
      }
    } catch (convexErr) {
      console.warn('Convex admin properties merge warning:', convexErr);
    }

    return NextResponse.json(properties, {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  } catch (error: any) {
    console.error('Error retrieving admin properties:', error);
    return NextResponse.json(
      { message: `Error retrieving admin properties: ${error.message}` },
      { status: 500 }
    );
  }
}
