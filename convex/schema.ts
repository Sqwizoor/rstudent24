import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Properties Table
  properties: defineTable({
    name: v.string(),
    description: v.string(),
    pricePerMonth: v.number(),
    securityDeposit: v.number(),
    beds: v.number(),
    baths: v.number(),
    kitchens: v.optional(v.number()),
    squareFeet: v.optional(v.number()),
    propertyType: v.string(), // "Apartment", "Rooms", "Townhouse", "Villa", "Cottage", "Tinyhouse"
    status: v.string(), // "Pending", "Approved", "Denied"
    
    // Convex File Storage IDs for Property Photos
    images: v.array(v.id("_storage")),
    photoUrls: v.optional(v.array(v.string())),
    
    // Amenities & Highlights
    amenities: v.array(v.string()),
    highlights: v.array(v.string()),
    
    // University & Campus Info
    accreditedBy: v.optional(v.array(v.string())),
    closestUniversity: v.optional(v.string()),
    closestCampuses: v.optional(v.array(v.string())),
    
    // Features & Flags
    isPetsAllowed: v.boolean(),
    isParkingIncluded: v.boolean(),
    isNsfassAccredited: v.boolean(),
    
    // Geocoded Location & Coordinates
    address: v.string(),
    city: v.string(),
    suburb: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.string(),
    postalCode: v.optional(v.string()),
    latitude: v.number(),
    longitude: v.number(),
    
    // Ownership & Contact
    managerId: v.string(), // Google Sub or Manager ID
    redirectType: v.optional(v.string()), // "NONE", "WHATSAPP", "CUSTOM_LINK", "BOTH"
    whatsappNumber: v.optional(v.string()),
    customLink: v.optional(v.string()),
    
    // Stats & Timestamps
    averageRating: v.optional(v.number()),
    numberOfReviews: v.optional(v.number()),
    postedDate: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_city", ["city"])
    .index("by_manager", ["managerId"])
    .index("by_status_city", ["status", "city"]),

  // Rooms Table
  rooms: defineTable({
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
    roomType: v.string(), // "PRIVATE", "SHARED", "ENTIRE_UNIT"
    capacity: v.number(),
    features: v.array(v.string()),
    availableFrom: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_property", ["propertyId"]),

  // Managers / Landlords Table
  managers: defineTable({
    userId: v.string(), // Google Sub
    email: v.string(),
    name: v.string(),
    phoneNumber: v.optional(v.string()),
    status: v.string(), // "Active", "Pending", "Disabled", "Banned"
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_email", ["email"]),

  // Tenants / Students Table
  tenants: defineTable({
    userId: v.string(), // Google Sub
    email: v.string(),
    name: v.string(),
    phoneNumber: v.optional(v.string()),
    referredBy: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_email", ["email"]),

  // Applications Table
  applications: defineTable({
    propertyId: v.id("properties"),
    roomId: v.optional(v.id("rooms")),
    tenantId: v.string(),
    managerId: v.string(),
    name: v.string(),
    email: v.string(),
    phoneNumber: v.string(),
    message: v.optional(v.string()),
    status: v.string(), // "Pending", "Approved", "Denied"
    applicationDate: v.string(),
    createdAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_manager", ["managerId"])
    .index("by_property", ["propertyId"]),

  // Reviews Table
  reviews: defineTable({
    propertyId: v.id("properties"),
    tenantId: v.string(),
    tenantName: v.optional(v.string()),
    rating: v.number(), // 1 - 5
    comment: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_property", ["propertyId"]),

  // Favorites Table
  favorites: defineTable({
    userId: v.string(),
    propertyId: v.id("properties"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_property", ["userId", "propertyId"]),
});
