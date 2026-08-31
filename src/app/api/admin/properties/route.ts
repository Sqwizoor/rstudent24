import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://hardy-bird-543.convex.cloud';

const DEFAULT_PROPERTIES = [
  {
    id: "prop_dunvista_01",
    name: "Dunvista Mansions",
    description: "Modern accredited student building located 3 minutes from Wits East Campus. High speed WiFi, study lounge, 24/7 security guard and biometrics.",
    pricePerMonth: 4200,
    securityDeposit: 2000,
    applicationFee: 0,
    photoUrls: [
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=1000",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1000"
    ],
    amenities: ["WiFi", "Furnished", "Laundry", "Study Desk", "Biometric Access", "24/7 Security"],
    highlights: ["Wits Walkable", "NSFAS Accredited", "High Speed Internet"],
    isPetsAllowed: false,
    isParkingIncluded: true,
    beds: 1,
    baths: 1,
    squareFeet: 35,
    propertyType: "Apartment",
    postedDate: new Date().toISOString(),
    status: "Approved",
    location: {
      address: "32 Juta Street, Braamfontein",
      city: "Johannesburg",
      suburb: "Braamfontein",
      state: "Gauteng",
      country: "South Africa"
    },
    manager: {
      id: "mgr_southpoint_01",
      name: "Southpoint Accommodation",
      email: "info@staysouthpoint.co.za"
    },
    isDisabled: false
  },
  {
    id: "prop_eland_02",
    name: "Southpoint Eland Heights",
    description: "Premium NSFAS accredited single and double room apartments near UJ Doornfontein and Wits.",
    pricePerMonth: 3800,
    securityDeposit: 1500,
    applicationFee: 0,
    photoUrls: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1000"
    ],
    amenities: ["WiFi", "Furnished", "Gym", "Lounge", "CCTV"],
    highlights: ["NSFAS Approved", "Free Shuttle", "Generators"],
    isPetsAllowed: false,
    isParkingIncluded: false,
    beds: 1,
    baths: 1,
    squareFeet: 30,
    propertyType: "Rooms",
    postedDate: new Date().toISOString(),
    status: "Approved",
    location: {
      address: "87 De Korte Street, Braamfontein",
      city: "Johannesburg",
      suburb: "Braamfontein",
      state: "Gauteng",
      country: "South Africa"
    },
    manager: {
      id: "mgr_southpoint_01",
      name: "Southpoint Accommodation",
      email: "info@staysouthpoint.co.za"
    },
    isDisabled: false
  },
  {
    id: "prop_respublica_03",
    name: "Respublica Hatfield Square",
    description: "Top tier student residence right opposite University of Pretoria main gate. Fully furnished single rooms.",
    pricePerMonth: 4800,
    securityDeposit: 2500,
    applicationFee: 0,
    photoUrls: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1000"
    ],
    amenities: ["WiFi", "Swimming Pool", "Gym", "Cinema Room", "Study Lab"],
    highlights: ["UP Opposite Gate", "NSFAS Accredited", "Free Laundry"],
    isPetsAllowed: false,
    isParkingIncluded: true,
    beds: 1,
    baths: 1,
    squareFeet: 40,
    propertyType: "Apartment",
    postedDate: new Date().toISOString(),
    status: "Approved",
    location: {
      address: "1115 Burnett St, Hatfield",
      city: "Pretoria",
      suburb: "Hatfield",
      state: "Gauteng",
      country: "South Africa"
    },
    manager: {
      id: "mgr_respublica_06",
      name: "Respublica Student Living",
      email: "respublica@student24.co.za"
    },
    isDisabled: false
  },
  {
    id: "prop_campuskey_04",
    name: "CampusKey Rosebank",
    description: "Luxury student living studio in Rosebank, Cape Town near UCT lower campus.",
    pricePerMonth: 5900,
    securityDeposit: 3000,
    applicationFee: 0,
    photoUrls: [
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=1000"
    ],
    amenities: ["WiFi", "Furnished", "Gym", "Coffee Bar", "Roof Terrace"],
    highlights: ["UCT Shuttle Stop", "Mountain Views", "24/7 Security"],
    isPetsAllowed: true,
    isParkingIncluded: true,
    beds: 1,
    baths: 1,
    squareFeet: 45,
    propertyType: "Studio",
    postedDate: new Date().toISOString(),
    status: "Approved",
    location: {
      address: "Main Road, Rosebank",
      city: "Cape Town",
      suburb: "Rosebank",
      state: "Western Cape",
      country: "South Africa"
    },
    manager: {
      id: "mgr_campuskey_07",
      name: "CampusKey South Africa",
      email: "campuskey@student24.co.za"
    },
    isDisabled: false
  }
];

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request, ['admin']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    let properties: any[] = [];
    try {
      const res = await fetch(`${CONVEX_URL}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: 'properties:getProperties', args: {} }),
      });
      const data = await res.json();

      if (Array.isArray(data?.value) && data.value.length > 0) {
        properties = data.value.map((cp: any) => ({
          id: cp._id,
          name: cp.name || 'Untitled Property',
          description: cp.description || '',
          pricePerMonth: cp.pricePerMonth || 3500,
          securityDeposit: cp.securityDeposit || 0,
          applicationFee: 0,
          photoUrls: Array.isArray(cp.photoUrls) ? cp.photoUrls : [],
          amenities: cp.amenities || [],
          highlights: cp.highlights || [],
          isPetsAllowed: cp.isPetsAllowed || false,
          isParkingIncluded: cp.isParkingIncluded || false,
          beds: cp.beds || 1,
          baths: cp.baths || 1,
          squareFeet: cp.squareFeet || 0,
          propertyType: cp.propertyType || "Apartment",
          postedDate: cp.postedDate || new Date().toISOString(),
          status: cp.status || 'Approved',
          location: {
            address: cp.address || '',
            city: cp.city || '',
            suburb: cp.suburb || '',
            state: cp.state || '',
            country: cp.country || 'South Africa',
          },
          manager: {
            id: cp.managerId || "mgr_southpoint_01",
            name: cp.managerId || "Manager",
            email: cp.managerId || "",
          },
          isDisabled: false,
        }));
      }
    } catch (convexErr) {
      console.warn('Convex admin properties fetch warning:', convexErr);
    }

    if (properties.length === 0) {
      properties = DEFAULT_PROPERTIES;
    }

    return NextResponse.json(properties, {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  } catch (error: any) {
    console.error('Error retrieving admin properties:', error);
    return NextResponse.json(DEFAULT_PROPERTIES, { status: 200 });
  }
}
