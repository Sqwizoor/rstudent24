import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://befitting-stingray-964.convex.cloud';

const MIGRATED_LANDLORD_LOOKUP: Record<string, string> = {
  "manager@example.com": "70cca9cc-b0c1-7064-d6d6-8f92e52d4790",
  "banelesouthflow@gmail.com": "602ca91c-5001-70c7-a78a-e9b1e36ce93e",
  "info@maginvest.co.za": "e0ccb98c-e091-702a-0944-0c6416c31a2b",
  "alexsouthflow2@gmail.com": "708c39ec-60d1-70d6-bd79-286d43e5cf40",
  "marelismit@hotmail.com": "a0bcb94c-9021-70ba-90de-a0a8b41d12dc",
  "marketingadmin@mosaicgroup.co.za": "30bc291c-2021-70ee-bb87-d158fbaebee2",
  "matthieusnaith@gmail.com": "f07c499c-5051-70a6-1948-e5b0bc72b25e",
  "kian@conurban.co.za": "505ca9fc-c0c1-7068-94ff-fe61d5a3e8c0",
  "lenhlendaba@gmail.com": "000c092c-d031-7024-5b34-27ee476b4abb",
  "nicola.makuwa@icloud.com": "70bcd9cc-d0f1-70c0-4edc-6508f5254d5b",
  "lefufisha@gmail.com": "e0fc796c-0091-7016-4f0d-67b8a56c4d9c",
  "info@27cluver.co.za": "e00ce9ac-f031-70e5-2d3f-f88e95460f2b",
  "sibandablessed724@gmail.com": "208c796c-00b1-7015-d53a-ad27f2b677ff",
  "info@staysouthpoint.co.za": "50bc293c-c0c1-70b1-c593-4b2d2a4f1f40",
  "gina.moonsamy@gmail.com": "800cc96c-b091-70c2-7102-c338f616081c",
  "rosaliefloresfranco@gmail.com": "40ccb93c-60c1-70c0-bfe2-16551e4395a1",
  "princetinendi@yahoo.com": "e0bc69bc-e031-7009-14c9-c0f65dfad6d3",
  "lizen@cityprop.co.za": "40fc393c-a091-705e-7cab-c137b8a51f0d",
  "allistairem@gmail.com": "405c093c-2051-702e-e86d-8a625d775b0e",
  "infokiarashomestay@gmail.com": "d04cc9ac-1001-708d-2b4c-9d877fbdf21b",
  "shaeekahisra@gmail.com": "60fc69fc-7071-702c-c927-f70b14e6d334",
  "meevsuu@hotmail.com": "f04cb9ac-6041-7060-a1da-90eacad6fb62",
  "magitshimaanisa2@gmail.com": "e0ec19cc-c051-70ee-144b-01240730cf3f",
  "tsp.mjadu@gmail.com": "e0dc292c-d011-7071-e0de-4a65f863ebd7",
  "clip-plod-lesser@duck.com": "a0dc393c-a001-7078-2d0f-c1281d72a110",
  "wayne@centraladvisory.co.za": "407c79dc-c0f1-702e-e58e-1bcef352493d",
  "parklanejohn@hotmail.com": "e0fce95c-d081-7011-3934-5fe8e083a64d",
  "kmeyiswa021@student.wethinkcode.co.za": "80fc493c-50b1-70d9-15eb-ddf0684334dd",
  "unathindlovu28@gmail.com": "d04c697c-f061-7015-5342-9f4fd8909467",
  "angiep@louwcoetzee.co.za": "b00cb9ac-70f1-7079-8921-25cd4d45eabc",
  "zwelakhe.samuel@gmail.com": "101c293c-5081-7043-8179-30abb82807dc"
};

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
        manager = data.value.find((m: any) => 
          String(m._id) === id || 
          String(m.userId) === id || 
          (m.email && m.email.toLowerCase() === id.toLowerCase())
        );
      }
    } catch (e) {
      console.warn("Convex manager find error:", e);
    }

    if (!manager) {
      manager = DEFAULT_MANAGERS.find(m => 
        m.id === id || 
        m.cognitoId === id || 
        m.email.toLowerCase() === id.toLowerCase()
      ) || DEFAULT_MANAGERS[0];
    }

    const managerEmail = (manager.email || "").toLowerCase();
    const migratedId = managerEmail ? MIGRATED_LANDLORD_LOOKUP[managerEmail] : (MIGRATED_LANDLORD_LOOKUP[id.toLowerCase()] || "");

    const searchIds = new Set<string>();
    if (id) searchIds.add(id);
    if (manager.userId) searchIds.add(String(manager.userId));
    if (manager._id) searchIds.add(String(manager._id));
    if (managerEmail) searchIds.add(managerEmail);
    if (migratedId) searchIds.add(migratedId);

    // Query Convex Cloud for properties managed by this manager
    try {
      const res = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "properties:getProperties", args: { status: "all" } }),
      });
      const data = await res.json();
      if (Array.isArray(data?.value)) {
        properties = data.value
          .filter((p: any) => {
            const pMgr = String(p.managerId || p.managerCognitoId || p.landlordId || "");
            return searchIds.has(pMgr) || (p.email && searchIds.has(p.email.toLowerCase()));
          })
          .map((p: any) => ({
            id: p._id,
            name: p.name || p.title || "Accommodation",
            address: p.address || "",
            city: p.city || "",
            state: p.state || "",
            pricePerMonth: p.pricePerMonth || p.price || 3500,
            status: p.status || "Approved",
            roomCount: p.roomCount || p.beds || 1,
            tenantCount: 0,
            tenants: []
          }));
      }
    } catch (e) {
      console.warn("Convex manager properties find error:", e);
    }

    // Query Convex Cloud for tenants / applications for this manager
    const tenantDetails: any[] = [];
    const seenTenants = new Set<string>();

    for (const sid of searchIds) {
      try {
        const res = await fetch(`${CONVEX_URL}/api/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: "applications:getManagerApplications", args: { managerId: sid } }),
        });
        const data = await res.json();
        if (Array.isArray(data?.value)) {
          for (const app of data.value) {
            const key = app.tenantId || app.email || app._id;
            if (!seenTenants.has(key)) {
              seenTenants.add(key);
              const studentName = app.name || 
                (app.tenant ? `${app.tenant.firstName || ''} ${app.tenant.lastName || ''}`.trim() : '') ||
                (app.user ? `${app.user.firstName || ''} ${app.user.lastName || ''}`.trim() : '') ||
                "Student Tenant";

              tenantDetails.push({
                id: app._id,
                name: studentName,
                email: app.email || app.tenant?.email || "",
                phoneNumber: app.phoneNumber || app.tenant?.phoneNumber || "",
                propertyName: app.property?.name || app.property?.title || "Property",
                status: app.status || "Pending",
              });
            }
          }
        }
      } catch (err) {
        console.warn(`Convex manager tenants query error for ${sid}:`, err);
      }
    }

    const totalRooms = properties.reduce((acc, p) => acc + (p.roomCount || 0), 0);
    const totalTenants = tenantDetails.length;

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
      tenantDetails,
    });
  } catch (error: any) {
    console.error("Error retrieving manager details:", error);
    return NextResponse.json({ message: "Error retrieving manager details" }, { status: 500 });
  }
}
