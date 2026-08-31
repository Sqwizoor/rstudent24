import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

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

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request, ['admin']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let managers: any[] = [];
    try {
      const res = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "users:getAllManagers", args: {} }),
      });
      const data = await res.json();
      if (Array.isArray(data?.value) && data.value.length > 0) {
        managers = data.value.map((cm: any) => ({
          id: cm._id || cm.userId,
          cognitoId: cm.userId || cm._id,
          name: cm.name || cm.email || "Landlord",
          email: cm.email || "",
          phoneNumber: cm.phoneNumber || "",
          status: cm.status || "Active",
          createdAt: cm.createdAt ? new Date(cm.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
      }
    } catch (e) {
      console.warn("Convex manager fetch warning:", e);
    }

    if (managers.length === 0) {
      managers = DEFAULT_MANAGERS;
    }

    if (status && status !== 'all') {
      managers = managers.filter(m => m.status?.toLowerCase() === status.toLowerCase());
    }

    return NextResponse.json(managers, {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json; charset=utf-8',
      }
    });
  } catch (error: any) {
    console.error("Error retrieving managers:", error);
    return NextResponse.json(DEFAULT_MANAGERS, { status: 200 });
  }
}
