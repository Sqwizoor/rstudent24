import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Haversine distance calculator in kilometers
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 1. Get properties nearby a target (lat, lng) with radius (e.g. 20km)
export const getNearbyProperties = query({
  args: {
    searchLat: v.number(),
    searchLng: v.number(),
    radiusKm: v.optional(v.number()), // default 20km
    propertyType: v.optional(v.string()),
    priceMin: v.optional(v.number()),
    priceMax: v.optional(v.number()),
    beds: v.optional(v.number()),
    baths: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const radius = args.radiusKm ?? 20;
    const maxLimit = args.limit ?? 50;

    // Fetch approved/active properties
    const allProps = await ctx.db.query("properties").order("desc").collect();
    const properties = allProps.filter(
      (p) => !p.status || p.status.toLowerCase() === "approved" || p.status.toLowerCase() === "active"
    );

    const matched = [];

    for (const p of properties) {
      // Filter by propertyType if provided
      if (args.propertyType && args.propertyType !== "any" && p.propertyType !== args.propertyType) {
        continue;
      }
      // Filter by price range
      if (args.priceMin !== undefined && p.pricePerMonth < args.priceMin) continue;
      if (args.priceMax !== undefined && p.pricePerMonth > args.priceMax) continue;
      // Filter by beds & baths
      if (args.beds !== undefined && p.beds < args.beds) continue;
      if (args.baths !== undefined && p.baths < args.baths) continue;

      // Calculate distance using Haversine
      const distance = getDistanceKm(args.searchLat, args.searchLng, p.latitude, p.longitude);
      if (distance <= radius) {
        // Resolve Convex storage image IDs to CDN URLs
        const storageUrls = await Promise.all(
          (p.images || []).map((id) => ctx.storage.getUrl(id))
        );
        const validStorage = storageUrls.filter(Boolean);
        const finalImages = validStorage.length > 0 ? validStorage : (p.photoUrls || []);

        // Fetch rooms to compute min price
        const rooms = await ctx.db
          .query("rooms")
          .withIndex("by_property", (q) => q.eq("propertyId", p._id))
          .collect();

        const roomPrices = rooms
          .map((r) => Number(r.pricePerMonth) || 0)
          .filter((price) => price > 0);
        const minRoomPrice = roomPrices.length > 0 ? Math.min(...roomPrices) : 0;
        const resolvedPrice = (p.pricePerMonth && p.pricePerMonth > 0)
          ? p.pricePerMonth
          : minRoomPrice;

        matched.push({
          ...p,
          pricePerMonth: resolvedPrice,
          price: resolvedPrice,
          distanceKm: Math.round(distance * 10) / 10,
          imageUrls: finalImages,
          photoUrls: finalImages,
          rooms,
        });
      }
    }

    // Sort nearest first
    matched.sort((a, b) => a.distanceKm - b.distanceKm);

    return matched.slice(0, maxLimit);
  },
});

// 2. Get list of properties with filters
export const getProperties = query({
  args: {
    city: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let properties = await ctx.db.query("properties").order("desc").collect();

    if (args.status && args.status !== "all") {
      properties = properties.filter(
        (p) => (p.status || "Approved").toLowerCase() === args.status?.toLowerCase()
      );
    }
    if (args.city && args.city !== "all") {
      const cityQuery = args.city.toLowerCase();
      properties = properties.filter(
        (p) => (p.city || "").toLowerCase().includes(cityQuery)
      );
    }

    if (args.limit) {
      properties = properties.slice(0, args.limit);
    }

    // Resolve images + compute price from rooms
    return await Promise.all(
      properties.map(async (p) => {
        const storageUrls = await Promise.all(
          (p.images || []).map((id) => ctx.storage.getUrl(id))
        );
        const validStorage = storageUrls.filter(Boolean);
        const finalImages = validStorage.length > 0 ? validStorage : (p.photoUrls || []);

        // Fetch rooms to compute min price if property price is 0 or missing
        const rooms = await ctx.db
          .query("rooms")
          .withIndex("by_property", (q) => q.eq("propertyId", p._id))
          .collect();

        const roomPrices = rooms
          .map((r) => Number(r.pricePerMonth) || 0)
          .filter((price) => price > 0);
        const minRoomPrice = roomPrices.length > 0 ? Math.min(...roomPrices) : 0;
        const resolvedPrice = (p.pricePerMonth && p.pricePerMonth > 0)
          ? p.pricePerMonth
          : minRoomPrice;

        return {
          ...p,
          pricePerMonth: resolvedPrice,
          price: resolvedPrice,
          imageUrls: finalImages,
          photoUrls: finalImages,
          rooms,
        };
      })
    );
  },
});

// 3. Get single property by ID
export const getPropertyById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    let property: any = null;
    try {
      property = await ctx.db.get(args.id as any);
    } catch {
      // In case string is not a direct Convex ID
    }

    if (!property) {
      const all: any[] = await ctx.db.query("properties").collect();
      property = all.find(
        (p: any) => p._id === args.id || p.legacyId?.toString() === args.id
      ) || null;
    }

    if (!property) return null;

    const prop: any = property;
    const imageUrls = await Promise.all(
      (prop.images || []).map((id: any) => ctx.storage.getUrl(id))
    );
    const validImages = imageUrls.filter(Boolean);
    const finalImages = validImages.length > 0 ? validImages : (prop.photoUrls || []);

    // Fetch rooms for this property
    const rooms: any[] = await ctx.db
      .query("rooms")
      .withIndex("by_property", (q) => q.eq("propertyId", prop._id as any))
      .collect();

    const roomsWithImages = await Promise.all(
      rooms.map(async (room: any) => {
        const roomImages = await Promise.all(
          (room.images || []).map((id: any) => ctx.storage.getUrl(id))
        );
        const validRoomImgs = roomImages.filter(Boolean);
        const finalRoomImgs = validRoomImgs.length > 0 ? validRoomImgs : (room.photoUrls || []);
        return { 
          ...room, 
          imageUrls: finalRoomImgs,
          photoUrls: finalRoomImgs,
        };
      })
    );

    const roomPrices = roomsWithImages
      .map((r: any) => Number(r.pricePerMonth) || 0)
      .filter((price) => price > 0);
    const minRoomPrice = roomPrices.length > 0 ? Math.min(...roomPrices) : 0;
    const resolvedPrice = (prop.pricePerMonth && prop.pricePerMonth > 0)
      ? prop.pricePerMonth
      : minRoomPrice;

    return {
      ...prop,
      pricePerMonth: resolvedPrice,
      price: resolvedPrice,
      imageUrls: finalImages,
      photoUrls: finalImages,
      rooms: roomsWithImages,
    };
  },
});

// 4. Create property mutation
export const createProperty = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    pricePerMonth: v.number(),
    securityDeposit: v.number(),
    beds: v.number(),
    baths: v.number(),
    kitchens: v.optional(v.number()),
    squareFeet: v.optional(v.number()),
    propertyType: v.string(),
    images: v.array(v.id("_storage")),
    amenities: v.array(v.string()),
    highlights: v.array(v.string()),
    accreditedBy: v.optional(v.array(v.string())),
    closestUniversity: v.optional(v.string()),
    closestCampuses: v.optional(v.array(v.string())),
    isPetsAllowed: v.boolean(),
    isParkingIncluded: v.boolean(),
    isNsfassAccredited: v.boolean(),
    address: v.string(),
    city: v.string(),
    suburb: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.string(),
    postalCode: v.optional(v.string()),
    latitude: v.number(),
    longitude: v.number(),
    managerId: v.string(),
    redirectType: v.optional(v.string()),
    whatsappNumber: v.optional(v.string()),
    customLink: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const propertyId = await ctx.db.insert("properties", {
      ...args,
      status: "Approved", // Auto-approved or set to Pending based on business logic
      averageRating: 0,
      numberOfReviews: 0,
      postedDate: new Date().toISOString(),
      createdAt: now,
      updatedAt: now,
    });
    return propertyId;
  },
});

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

const REVERSE_LANDLORD_LOOKUP: Record<string, string> = {};
for (const [email, cognitoId] of Object.entries(MIGRATED_LANDLORD_LOOKUP)) {
  REVERSE_LANDLORD_LOOKUP[cognitoId] = email;
}

async function resolvePropertyDetails(ctx: any, properties: any[]) {
  return await Promise.all(
    properties.map(async (p) => {
      const imageUrls = await Promise.all(
        (p.images || []).map((id: any) => ctx.storage.getUrl(id))
      );
      const rooms = await ctx.db
        .query("rooms")
        .withIndex("by_property", (q: any) => q.eq("propertyId", p._id))
        .collect();

      const roomPrices = rooms
        .map((r: any) => Number(r.pricePerMonth) || 0)
        .filter((price: number) => price > 0);
      const minRoomPrice = roomPrices.length > 0 ? Math.min(...roomPrices) : 0;
      const finalPrice = p.pricePerMonth && p.pricePerMonth > 0 ? p.pricePerMonth : (minRoomPrice || 3500);

      const validStorage = imageUrls.filter(Boolean);
      const finalImages = validStorage.length > 0 ? validStorage : (p.photoUrls || []);

      return {
        ...p,
        pricePerMonth: finalPrice,
        price: finalPrice,
        imageUrls: finalImages,
        rooms,
      };
    })
  );
}

export const getManagerProperties = query({
  args: { managerId: v.string() },
  handler: async (ctx, args) => {
    // Strictly isolate: A manager MUST only see their own properties.
    if (!args.managerId || args.managerId.trim() === "") {
      return [];
    }

    // Explicit admin override ONLY
    if (args.managerId === "ALL" || args.managerId === "admin") {
      const allProps = await ctx.db.query("properties").order("desc").collect();
      return await resolvePropertyDetails(ctx, allProps);
    }

    const searchIds = new Set<string>();
    searchIds.add(args.managerId);

    const lowerId = args.managerId.toLowerCase();
    if (MIGRATED_LANDLORD_LOOKUP[lowerId]) {
      searchIds.add(MIGRATED_LANDLORD_LOOKUP[lowerId]);
    }
    if (REVERSE_LANDLORD_LOOKUP[args.managerId]) {
      searchIds.add(REVERSE_LANDLORD_LOOKUP[args.managerId]);
    }

    // Look up manager record in Convex
    const managerByUserId = await ctx.db
      .query("managers")
      .withIndex("by_userId", (q) => q.eq("userId", args.managerId))
      .first();

    const managerByEmail = await ctx.db
      .query("managers")
      .withIndex("by_email", (q) => q.eq("email", lowerId))
      .first();

    const manager = managerByUserId || managerByEmail;
    if (manager) {
      if (manager.status && manager.status.toLowerCase() === "disabled") {
        return [];
      }
      if (manager.userId) searchIds.add(manager.userId);
      if (manager.email) {
        searchIds.add(manager.email);
        searchIds.add(manager.email.toLowerCase());
        if (MIGRATED_LANDLORD_LOOKUP[manager.email.toLowerCase()]) {
          searchIds.add(MIGRATED_LANDLORD_LOOKUP[manager.email.toLowerCase()]);
        }
      }
    }

    const matchedProps: any[] = [];
    const seenIds = new Set<string>();

    for (const id of searchIds) {
      const props = await ctx.db
        .query("properties")
        .withIndex("by_manager", (q) => q.eq("managerId", id))
        .collect();
      for (const p of props) {
        if (!seenIds.has(p._id)) {
          seenIds.add(p._id);
          matchedProps.push(p);
        }
      }
    }

    // CRITICAL: If no properties are found, return empty array []!
    // NEVER fall back to returning all properties!
    if (matchedProps.length === 0) {
      return [];
    }

    return await resolvePropertyDetails(ctx, matchedProps);
  },
});

// 6. Create a room for a property
export const createRoom = mutation({
  args: {
    propertyId: v.id("properties"),
    name: v.string(),
    description: v.optional(v.string()),
    pricePerMonth: v.number(),
    securityDeposit: v.number(),
    topUp: v.optional(v.number()),
    beds: v.number(),
    baths: v.number(),
    squareFeet: v.optional(v.number()),
    images: v.array(v.id("_storage")),
    isAvailable: v.boolean(),
    roomType: v.string(),
    capacity: v.number(),
    features: v.array(v.string()),
    availableFrom: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("rooms", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// 7. Delete a property and its rooms
export const deleteProperty = mutation({
  args: { propertyId: v.id("properties"), managerId: v.string() },
  handler: async (ctx, args) => {
    const property = await ctx.db.get(args.propertyId);
    if (!property) throw new Error("Property not found");

    const lowerId = args.managerId.toLowerCase();
    const migratedId = MIGRATED_LANDLORD_LOOKUP[lowerId];
    const isOwner = property.managerId === args.managerId ||
                    property.managerId === migratedId ||
                    (property.managerId && property.managerId.toLowerCase() === lowerId) ||
                    args.managerId === "admin" ||
                    args.managerId === "ALL";
    if (!isOwner) throw new Error("Unauthorized: you can only delete your own properties");

    // Delete rooms
    const rooms = await ctx.db
      .query("rooms")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .collect();
    for (const room of rooms) {
      // Delete room images from storage
      for (const imgId of room.images) {
        await ctx.storage.delete(imgId).catch(() => {});
      }
      await ctx.db.delete(room._id);
    }

    // Delete property images from storage
    for (const imgId of property.images) {
      await ctx.storage.delete(imgId).catch(() => {});
    }

    // Delete favorites pointing to this property
    const favs = await ctx.db
      .query("favorites")
      .withIndex("by_user_property")
      .filter((q) => q.eq(q.field("propertyId"), args.propertyId))
      .collect();
    for (const fav of favs) await ctx.db.delete(fav._id);

    await ctx.db.delete(args.propertyId);
  },
});

// 8. Update a property's fields
export const updateProperty = mutation({
  args: {
    propertyId: v.id("properties"),
    managerId: v.optional(v.string()),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    pricePerMonth: v.optional(v.number()),
    securityDeposit: v.optional(v.number()),
    beds: v.optional(v.number()),
    baths: v.optional(v.number()),
    kitchens: v.optional(v.number()),
    squareFeet: v.optional(v.number()),
    propertyType: v.optional(v.string()),
    status: v.optional(v.string()),
    whatsappNumber: v.optional(v.string()),
    customLink: v.optional(v.string()),
    redirectType: v.optional(v.string()),
    amenities: v.optional(v.array(v.string())),
    highlights: v.optional(v.array(v.string())),
    accreditedBy: v.optional(v.array(v.string())),
    closestUniversity: v.optional(v.string()),
    closestCampuses: v.optional(v.array(v.string())),
    isPetsAllowed: v.optional(v.boolean()),
    isParkingIncluded: v.optional(v.boolean()),
    isNsfassAccredited: v.optional(v.boolean()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    suburb: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.optional(v.string()),
    postalCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const property = await ctx.db.get(args.propertyId);
    if (!property) throw new Error("Property not found");

    const { propertyId, managerId, ...patch } = args;
    const cleanPatch = Object.fromEntries(
      Object.entries(patch).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(propertyId, { ...cleanPatch, updatedAt: Date.now() });
  },
});

// 9. Get tenant residences (approved applications = active stays)
export const getTenantResidences = query({
  args: { tenantId: v.string() },
  handler: async (ctx, args) => {
    const apps = await ctx.db
      .query("applications")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .filter((q) => q.eq(q.field("status"), "Approved"))
      .collect();

    return await Promise.all(
      apps.map(async (app) => {
        const property = await ctx.db.get(app.propertyId);
        if (!property) return null;
        const imageUrls = await Promise.all(
          property.images.map((id) => ctx.storage.getUrl(id))
        );
        return {
          ...property,
          imageUrls: imageUrls.filter(Boolean),
          applicationId: app._id,
        };
      })
    ).then((r) => r.filter(Boolean));
  },
});

// 10. Create property with override status (used by migration)
export const createPropertyWithStatus = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    pricePerMonth: v.number(),
    securityDeposit: v.number(),
    beds: v.number(),
    baths: v.number(),
    kitchens: v.optional(v.number()),
    squareFeet: v.optional(v.number()),
    propertyType: v.string(),
    images: v.array(v.id("_storage")),
    amenities: v.array(v.string()),
    highlights: v.array(v.string()),
    accreditedBy: v.optional(v.array(v.string())),
    closestUniversity: v.optional(v.string()),
    closestCampuses: v.optional(v.array(v.string())),
    isPetsAllowed: v.boolean(),
    isParkingIncluded: v.boolean(),
    isNsfassAccredited: v.boolean(),
    address: v.string(),
    city: v.string(),
    suburb: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.string(),
    postalCode: v.optional(v.string()),
    latitude: v.number(),
    longitude: v.number(),
    managerId: v.string(),
    redirectType: v.optional(v.string()),
    whatsappNumber: v.optional(v.string()),
    customLink: v.optional(v.string()),
    status: v.string(),
    averageRating: v.optional(v.number()),
    numberOfReviews: v.optional(v.number()),
    postedDate: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("properties", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// 11. Update property photos (sync script)
export const updatePropertyPhotos = mutation({
  args: {
    id: v.id("properties"),
    photoUrls: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      photoUrls: args.photoUrls,
      updatedAt: Date.now(),
    });
  },
});

// 12. Admin update property status (e.g. "Approved", "Disabled", "Denied")
export const updatePropertyStatus = mutation({
  args: {
    id: v.id("properties"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

