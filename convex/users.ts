import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get manager by userId (Google sub)
export const getManagerByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("managers")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// Get manager by email
export const getManagerByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("managers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// Upsert manager — called after Google or email sign-in with role=manager
export const upsertManager = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    name: v.string(),
    phoneNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Check if manager exists by userId
    let existing = await ctx.db
      .query("managers")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    // 2. If not found by userId, check by email (to link previous accounts/properties)
    if (!existing) {
      existing = await ctx.db
        .query("managers")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .first();
    }

    if (existing) {
      const oldUserId = existing.userId;

      // Update name/email/userId in case they changed
      await ctx.db.patch(existing._id, {
        userId: args.userId,
        name: args.name,
        email: args.email,
      });

      // Link any existing properties that had the manager's email or old ID as managerId
      if (oldUserId && oldUserId !== args.userId) {
        const oldProps = await ctx.db
          .query("properties")
          .withIndex("by_manager", (q) => q.eq("managerId", oldUserId))
          .collect();

        for (const p of oldProps) {
          await ctx.db.patch(p._id, { managerId: args.userId });
        }
      }

      const emailProps = await ctx.db
        .query("properties")
        .withIndex("by_manager", (q) => q.eq("managerId", args.email))
        .collect();

      for (const p of emailProps) {
        await ctx.db.patch(p._id, { managerId: args.userId });
      }

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
      .first();
  },
});

// Get tenant by email
export const getTenantByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tenants")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
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
      .first();

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
      .first();
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
      .first();
    if (!existing) throw new Error("Manager not found");
    const patch: Record<string, string> = {};
    if (args.name) patch.name = args.name;
    if (args.phoneNumber) patch.phoneNumber = args.phoneNumber;
    await ctx.db.patch(existing._id, patch);
  },
});

// Admin: Get all managers/landlords
export const getAllManagers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("managers").order("desc").collect();
  },
});

// Admin: Get all tenants/students
export const getAllTenants = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tenants").order("desc").collect();
  },
});
