import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get manager by userId (Google sub)
export const getManagerByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("managers")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
  },
});

// Get manager by email
export const getManagerByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("managers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});

// Upsert manager — called by NextAuth after Google sign-in with role=manager
export const upsertManager = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    name: v.string(),
    phoneNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("managers")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (existing) {
      // Update name/email in case they changed on Google
      await ctx.db.patch(existing._id, {
        name: args.name,
        email: args.email,
      });
      return existing._id;
    }

    return await ctx.db.insert("managers", {
      userId: args.userId,
      email: args.email,
      name: args.name,
      phoneNumber: args.phoneNumber,
      status: "Active",
      createdAt: Date.now(),
    });
  },
});

// Get tenant by userId (Google sub)
export const getTenantByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tenants")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
  },
});

// Get tenant by email
export const getTenantByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tenants")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});

// Upsert tenant — called by NextAuth after Google sign-in with role=tenant
export const upsertTenant = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    name: v.string(),
    phoneNumber: v.optional(v.string()),
    referredBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tenants")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        email: args.email,
      });
      return existing._id;
    }

    return await ctx.db.insert("tenants", {
      userId: args.userId,
      email: args.email,
      name: args.name,
      phoneNumber: args.phoneNumber,
      referredBy: args.referredBy,
      createdAt: Date.now(),
    });
  },
});

// Update tenant profile
export const updateTenant = mutation({
  args: {
    userId: v.string(),
    name: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tenants")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    if (!existing) throw new Error("Tenant not found");
    const patch: Record<string, string> = {};
    if (args.name) patch.name = args.name;
    if (args.phoneNumber) patch.phoneNumber = args.phoneNumber;
    await ctx.db.patch(existing._id, patch);
  },
});

// Update manager profile
export const updateManager = mutation({
  args: {
    userId: v.string(),
    name: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("managers")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    if (!existing) throw new Error("Manager not found");
    const patch: Record<string, string> = {};
    if (args.name) patch.name = args.name;
    if (args.phoneNumber) patch.phoneNumber = args.phoneNumber;
    await ctx.db.patch(existing._id, patch);
  },
});
