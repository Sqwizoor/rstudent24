import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
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
        CASE WHEN dp.property_id IS NOT NULL THEN true ELSE false END AS "isDisabled"
      FROM "Property" p
      JOIN "Location" l ON p."locationId" = l.id
      JOIN "Manager" m ON p."managerCognitoId" = m."cognitoId"
      LEFT JOIN disabled_properties dp ON dp.property_id = p.id
      WHERE m.status = 'Active'::"ManagerStatus"
      ORDER BY p.id DESC
      LIMIT ${limit}
    `;

    const properties = (await prisma.$queryRaw(baseQuery)) as any[];
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
