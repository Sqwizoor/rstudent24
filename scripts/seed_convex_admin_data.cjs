/**
 * seed_convex_admin_data.cjs
 * Populates Convex Cloud (hardy-bird-543) with rich realistic Landlords, Students, Properties & Applications.
 */

const { ConvexHttpClient } = require('convex/browser');

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://hardy-bird-543.convex.cloud';
const convex = new ConvexHttpClient(CONVEX_URL);

async function main() {
  console.log(`🚀 Seeding admin data to Convex Cloud at ${CONVEX_URL}...`);

  // 1. Seed Landlords / Managers
  const managersData = [
    { userId: "mgr_southpoint_01", email: "info@staysouthpoint.co.za", name: "Southpoint Accommodation", phoneNumber: "+27 11 200 0000", status: "Active" },
    { userId: "mgr_kiaras_02", email: "infokiarashomestay@gmail.com", name: "Kiara's Student Homestays", phoneNumber: "+27 82 555 1234", status: "Active" },
    { userId: "mgr_mosaic_03", email: "marketingadmin@mosaicgroup.co.za", name: "Mosaic Student Housing", phoneNumber: "+27 11 403 9876", status: "Active" },
    { userId: "mgr_parklane_04", email: "parklanejohn@hotmail.com", name: "Park Lane Mansions", phoneNumber: "+27 83 444 8888", status: "Active" },
    { userId: "mgr_urban_05", email: "urbanstudent@student24.co.za", name: "Urban Living Accommodation", phoneNumber: "+27 12 345 6789", status: "Active" },
    { userId: "mgr_respublica_06", email: "respublica@student24.co.za", name: "Respublica Student Living", phoneNumber: "+27 11 999 1111", status: "Active" },
    { userId: "mgr_campuskey_07", email: "campuskey@student24.co.za", name: "CampusKey South Africa", phoneNumber: "+27 21 888 2222", status: "Active" }
  ];

  console.log(`\n── Seeding ${managersData.length} Landlords...`);
  for (const m of managersData) {
    try {
      const res = await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "users:upsertManager",
          args: {
            userId: m.userId,
            email: m.email,
            name: m.name,
            phoneNumber: m.phoneNumber
          }
        })
      });
      if (res.ok) console.log(`  ✓ Landlord: ${m.name}`);
    } catch (e) {
      console.warn(`Failed landlord ${m.name}:`, e.message);
    }
  }

  // 2. Seed Tenants / Students
  const tenantsData = [
    { userId: "stu_thabo_01", email: "thabo.mokoena@wits.ac.za", name: "Thabo Mokoena", phoneNumber: "+27 71 123 4567" },
    { userId: "stu_sipho_02", email: "sipho.nkosi@uj.ac.za", name: "Sipho Nkosi", phoneNumber: "+27 72 234 5678" },
    { userId: "stu_lungile_03", email: "lungile.dlamini@up.ac.za", name: "Lungile Dlamini", phoneNumber: "+27 73 345 6789" },
    { userId: "stu_anathi_04", email: "anathi.zulu@uct.ac.za", name: "Anathi Zulu", phoneNumber: "+27 74 456 7890" },
    { userId: "stu_nomsa_05", email: "nomsa.khumalo@tut.ac.za", name: "Nomsa Khumalo", phoneNumber: "+27 75 567 8901" },
    { userId: "stu_lerato_06", email: "lerato.modise@sun.ac.za", name: "Lerato Modise", phoneNumber: "+27 76 678 9012" }
  ];

  console.log(`\n── Seeding ${tenantsData.length} Student Tenants...`);
  for (const t of tenantsData) {
    try {
      const res = await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "users:upsertTenant",
          args: {
            userId: t.userId,
            email: t.email,
            name: t.name,
            phoneNumber: t.phoneNumber
          }
        })
      });
      if (res.ok) console.log(`  ✓ Tenant: ${t.name}`);
    } catch (e) {
      console.warn(`Failed tenant ${t.name}:`, e.message);
    }
  }

  // 3. Seed Properties
  const propertiesData = [
    {
      name: "Dunvista Mansions",
      description: "Modern accredited student building located 3 minutes from Wits East Campus. High speed WiFi, study lounge, 24/7 security guard and biometrics.",
      pricePerMonth: 4200,
      securityDeposit: 2000,
      beds: 1,
      baths: 1,
      kitchens: 1,
      squareFeet: 35,
      propertyType: "Apartment",
      status: "Approved",
      address: "32 Juta Street, Braamfontein",
      city: "Johannesburg",
      suburb: "Braamfontein",
      country: "South Africa",
      latitude: -26.1925,
      longitude: 28.0371,
      managerId: "mgr_southpoint_01",
      isPetsAllowed: false,
      isParkingIncluded: true,
      isNsfassAccredited: true,
      amenities: ["WiFi", "Furnished", "Laundry", "Study Desk", "Biometric Access", "24/7 Security"],
      highlights: ["Wits Walkable", "NSFAS Accredited", "High Speed Internet"],
      photoUrls: [
        "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=1000",
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1000"
      ],
      postedDate: new Date().toISOString(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      name: "Southpoint Eland Heights",
      description: "Premium NSFAS accredited single and double room apartments near UJ Doornfontein and Wits.",
      pricePerMonth: 3800,
      securityDeposit: 1500,
      beds: 1,
      baths: 1,
      kitchens: 1,
      squareFeet: 30,
      propertyType: "Rooms",
      status: "Approved",
      address: "87 De Korte Street, Braamfontein",
      city: "Johannesburg",
      suburb: "Braamfontein",
      country: "South Africa",
      latitude: -26.1931,
      longitude: 28.0355,
      managerId: "mgr_southpoint_01",
      isPetsAllowed: false,
      isParkingIncluded: false,
      isNsfassAccredited: true,
      amenities: ["WiFi", "Furnished", "Gym", "Lounge", "CCTV"],
      highlights: ["NSFAS Approved", "Free Shuttle", "Generators"],
      photoUrls: [
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1000"
      ],
      postedDate: new Date().toISOString(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      name: "Respublica Hatfield Square",
      description: "Top tier student residence right opposite University of Pretoria main gate. Fully furnished single rooms.",
      pricePerMonth: 4800,
      securityDeposit: 2500,
      beds: 1,
      baths: 1,
      kitchens: 1,
      squareFeet: 40,
      propertyType: "Apartment",
      status: "Approved",
      address: "1115 Burnett St, Hatfield",
      city: "Pretoria",
      suburb: "Hatfield",
      country: "South Africa",
      latitude: -25.7489,
      longitude: 28.2381,
      managerId: "mgr_respublica_06",
      isPetsAllowed: false,
      isParkingIncluded: true,
      isNsfassAccredited: true,
      amenities: ["WiFi", "Swimming Pool", "Gym", "Cinema Room", "Study Lab"],
      highlights: ["UP Opposite Gate", "NSFAS Accredited", "Free Laundry"],
      photoUrls: [
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1000"
      ],
      postedDate: new Date().toISOString(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      name: "CampusKey Rosebank",
      description: "Luxury student living studio in Rosebank, Cape Town near UCT lower campus.",
      pricePerMonth: 5900,
      securityDeposit: 3000,
      beds: 1,
      baths: 1,
      kitchens: 1,
      squareFeet: 45,
      propertyType: "Studio",
      status: "Approved",
      address: "Main Road, Rosebank",
      city: "Cape Town",
      suburb: "Rosebank",
      country: "South Africa",
      latitude: -33.9575,
      longitude: 18.4725,
      managerId: "mgr_campuskey_07",
      isPetsAllowed: true,
      isParkingIncluded: true,
      isNsfassAccredited: true,
      amenities: ["WiFi", "Furnished", "Gym", "Coffee Bar", "Roof Terrace"],
      highlights: ["UCT Shuttle Stop", "Mountain Views", "24/7 Security"],
      photoUrls: [
        "https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=1000"
      ],
      postedDate: new Date().toISOString(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ];

  console.log(`\n── Seeding ${propertiesData.length} Properties...`);
  const propertyIds = [];
  for (const p of propertiesData) {
    try {
      const res = await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "properties:createPropertyWithStatus",
          args: {
            ...p,
            images: []
          }
        })
      });
      if (res.ok) {
        const data = await res.json();
        propertyIds.push(data.value);
        console.log(`  ✓ Property: ${p.name}`);
      }
    } catch (e) {
      console.warn(`Failed property ${p.name}:`, e.message);
    }
  }

  // 4. Seed Applications
  if (propertyIds.length > 0) {
    const appsData = [
      { propertyId: propertyIds[0], tenantId: "stu_thabo_01", managerId: "mgr_southpoint_01", name: "Thabo Mokoena", email: "thabo.mokoena@wits.ac.za", phoneNumber: "+27 71 123 4567", message: "Hi, I would like to move in for the 2026 academic year.", status: "Pending" },
      { propertyId: propertyIds[0], tenantId: "stu_sipho_02", managerId: "mgr_southpoint_01", name: "Sipho Nkosi", email: "sipho.nkosi@uj.ac.za", phoneNumber: "+27 72 234 5678", message: "Is single room available for NSFAS student?", status: "Approved" },
      { propertyId: propertyIds[1], tenantId: "stu_lungile_03", managerId: "mgr_southpoint_01", name: "Lungile Dlamini", email: "lungile.dlamini@up.ac.za", phoneNumber: "+27 73 345 6789", message: "Applying for 2 bedroom unit.", status: "Approved" },
      { propertyId: propertyIds[2], tenantId: "stu_anathi_04", managerId: "mgr_respublica_06", name: "Anathi Zulu", email: "anathi.zulu@uct.ac.za", phoneNumber: "+27 74 456 7890", message: "Requesting room assignment on the 3rd floor.", status: "Pending" }
    ];

    console.log(`\n── Seeding ${appsData.length} Applications...`);
    for (const app of appsData) {
      try {
        const res = await fetch(`${CONVEX_URL}/api/mutation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: "applications:submitApplication",
            args: app
          })
        });
        if (res.ok) console.log(`  ✓ Application for: ${app.name}`);
      } catch (e) {
        console.warn(`Failed application ${app.name}:`, e.message);
      }
    }
  }

  console.log("\n🎉 CONVEX SEEDING COMPLETE! All admin tables now contain live data.");
}

main().catch(console.error);
