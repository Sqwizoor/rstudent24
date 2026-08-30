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

        matched.push({
          ...p,
          distanceKm: Math.round(distance * 10) / 10,
          imageUrls: finalImages,
          photoUrls: finalImages,
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

    // Resolve images
    return await Promise.all(
      properties.map(async (p) => {
        const storageUrls = await Promise.all(
          (p.images || []).map((id) => ctx.storage.getUrl(id))
        );
        const validStorage = storageUrls.filter(Boolean);
        const finalImages = validStorage.length > 0 ? validStorage : (p.photoUrls || []);

        return {
          ...p,
          imageUrls: finalImages,
          photoUrls: finalImages,
        };
      })
    );
  },
});

// 3. Get single property by ID
export const getPropertyById = query({
  args: { id: v.id("properties") },
  handler: async (ctx, args) => {
    const property = await ctx.db.get(args.id);
    if (!property) return null;

    const imageUrls = await Promise.all(
      property.images.map((id) => ctx.storage.getUrl(id))
    );

    // Fetch rooms for this property
    const rooms = await ctx.db
      .query("rooms")
      .withIndex("by_property", (q) => q.eq("propertyId", args.id))
      .collect();

    const roomsWithImages = await Promise.all(
      rooms.map(async (room) => {
        const roomImages = await Promise.all(
          room.images.map((id) => ctx.storage.getUrl(id))
        );
        return { ...room, imageUrls: roomImages.filter(Boolean) };
      })
    );

    return {
      ...property,
      imageUrls: imageUrls.filter(Boolean),
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

// 5. Get properties for a specific landlord/manager
export const getManagerProperties = query({
  args: { managerId: v.string() },
  handler: async (ctx, args) => {
    const properties = await ctx.db
      .query("properties")
      .withIndex("by_manager", (q) => q.eq("managerId", args.managerId))
      .collect();

    return await Promise.all(
      properties.map(async (p) => {
        const imageUrls = await Promise.all(
          p.images.map((id) => ctx.storage.getUrl(id))
        );
        // Also fetch rooms
        const rooms = await ctx.db
          .query("rooms")
          .withIndex("by_property", (q) => q.eq("propertyId", p._id))
          .collect();
        return {
          ...p,
          imageUrls: imageUrls.filter(Boolean),
          rooms,
        };
      })
    );
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
    if (property.managerId !== args.managerId) throw new Error("Unauthorized");

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
