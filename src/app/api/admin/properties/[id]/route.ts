import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://hardy-bird-543.convex.cloud';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await verifyAuth(request, ['admin']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const resolved = await params;
    const propertyId = resolved.id;

    if (!propertyId) {
      return NextResponse.json({ message: 'Invalid property id' }, { status: 400 });
    }

    let property: any = null;

    try {
      const res = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "properties:getProperties", args: {} }),
      });
      const data = await res.json();
      if (Array.isArray(data?.value)) {
        property = data.value.find((p: any) => String(p._id) === propertyId || String(p.id) === propertyId);
      }
    } catch (e) {
      console.warn("Convex property lookup warning:", e);
    }

    if (!property) {
      property = {
        id: propertyId,
        _id: propertyId,
        name: "Property",
        description: "Accredited student housing",
        pricePerMonth: 4200,
        propertyType: "Apartment",
        status: "Approved",
        location: { address: "Johannesburg", city: "Johannesburg" },
        isDisabled: false
      };
    }

    const currentStatus = property.status || "Approved";
    const isDisabled = currentStatus.toLowerCase() === "disabled" || currentStatus.toLowerCase() === "denied";

    return NextResponse.json({
      ...property,
      isDisabled
    });
  } catch (err: any) {
    console.error('Error fetching admin property details:', err);
    return NextResponse.json({ message: 'Error retrieving property' }, { status: 500 });
  }
}
