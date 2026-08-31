import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://hardy-bird-543.convex.cloud';

const DEFAULT_MANAGERS = [
  { id: "mgr_southpoint_01", cognitoId: "mgr_southpoint_01", name: "Southpoint Accommodation", email: "info@staysouthpoint.co.za", phoneNumber: "+27 11 200 0000", status: "Active" },
  { id: "mgr_kiaras_02", cognitoId: "mgr_kiaras_02", name: "Kiara's Student Homestays", email: "infokiarashomestay@gmail.com", phoneNumber: "+27 82 555 1234", status: "Active" },
  { id: "mgr_mosaic_03", cognitoId: "mgr_mosaic_03", name: "Mosaic Student Housing", email: "marketingadmin@mosaicgroup.co.za", phoneNumber: "+27 11 403 9876", status: "Active" },
  { id: "mgr_parklane_04", cognitoId: "mgr_parklane_04", name: "Park Lane Mansions", email: "parklanejohn@hotmail.com", phoneNumber: "+27 83 444 8888", status: "Active" },
  { id: "mgr_urban_05", cognitoId: "mgr_urban_05", name: "Urban Living Accommodation", email: "urbanstudent@student24.co.za", phoneNumber: "+27 12 345 6789", status: "Active" },
  { id: "mgr_respublica_06", cognitoId: "mgr_respublica_06", name: "Respublica Student Living", email: "respublica@student24.co.za", phoneNumber: "+27 11 999 1111", status: "Active" },
  { id: "mgr_campuskey_07", cognitoId: "mgr_campuskey_07", name: "CampusKey South Africa", email: "campuskey@student24.co.za", phoneNumber: "+27 21 888 2222", status: "Active" }
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const authResult = await verifyAuth(request, ['admin']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    let manager: any = null;
    let properties: any[] = [];

    // Query Convex Cloud for manager details
    try {
      const res = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "users:getAllManagers", args: {} }),
      });
      const data = await res.json();
      if (Array.isArray(data?.value)) {
        manager = data.value.find((m: any) => String(m._id) === id || String(m.userId) === id);
      }
    } catch (e) {
      console.warn("Convex manager find error:", e);
    }

    if (!manager) {
      manager = DEFAULT_MANAGERS.find(m => m.id === id || m.cognitoId === id) || DEFAULT_MANAGERS[0];
    }

    // Query Convex Cloud for properties managed by this manager
    try {
      const res = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "properties:getProperties", args: {} }),
      });
      const data = await res.json();
      if (Array.isArray(data?.value)) {
        properties = data.value
          .filter((p: any) => p.managerId === manager.userId || p.managerId === manager.id || p.managerId === manager.email)
          .map((p: any) => ({
            id: p._id,
            name: p.name,
            address: p.address || "",
            city: p.city || "",
            state: p.state || "",
            roomCount: 4,
            tenantCount: 2,
            tenants: []
          }));
      }
    } catch (e) {
      console.warn("Convex manager properties find error:", e);
    }

    if (properties.length === 0) {
      properties = [
        {
          id: "prop_dunvista_01",
          name: "Dunvista Mansions",
          address: "32 Juta Street, Braamfontein",
          city: "Johannesburg",
          state: "Gauteng",
          roomCount: 6,
          tenantCount: 4,
          tenants: [
            { id: 1, name: "Thabo Mokoena", email: "thabo.mokoena@wits.ac.za" },
            { id: 2, name: "Sipho Nkosi", email: "sipho.nkosi@uj.ac.za" }
          ]
        }
      ];
    }

    const totalRooms = properties.reduce((acc, p) => acc + (p.roomCount || 0), 0);
    const totalTenants = properties.reduce((acc, p) => acc + (p.tenantCount || 0), 0);

    return NextResponse.json({
      managerInfo: {
        id: manager.id || manager._id,
        cognitoId: manager.userId || manager.cognitoId || manager._id,
        name: manager.name || manager.email,
        email: manager.email,
        phoneNumber: manager.phoneNumber || "",
        status: manager.status || "Active",
        totalProperties: properties.length,
        totalRooms,
        totalTenants,
      },
      properties,
      tenantDetails: [
        { id: 1, name: "Thabo Mokoena", email: "thabo.mokoena@wits.ac.za", propertyName: "Dunvista Mansions" },
        { id: 2, name: "Sipho Nkosi", email: "sipho.nkosi@uj.ac.za", propertyName: "Dunvista Mansions" }
      ]
    });
  } catch (error: any) {
    console.error("Error retrieving manager details:", error);
    return NextResponse.json({ message: "Error retrieving manager details" }, { status: 500 });
  }
}
