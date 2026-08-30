import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getTenantApplications = query({
  args: { tenantId: v.string() },
  handler: async (ctx, args) => {
    const apps = await ctx.db
      .query("applications")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    return await Promise.all(
      apps.map(async (app) => {
        const property = await ctx.db.get(app.propertyId);
        const imageUrls = property ? await Promise.all(
          property.images.map((id) => ctx.storage.getUrl(id))
        ) : [];
        return {
          ...app,
          property: property ? { ...property, imageUrls: imageUrls.filter(Boolean) } : null,
        };
      })
    );
  },
});

export const getManagerApplications = query({
  args: { managerId: v.string() },
  handler: async (ctx, args) => {
    const apps = await ctx.db
      .query("applications")
      .withIndex("by_manager", (q) => q.eq("managerId", args.managerId))
      .collect();

    return await Promise.all(
      apps.map(async (app) => {
        const property = await ctx.db.get(app.propertyId);
        return {
          ...app,
          property,
        };
      })
    );
  },
});

export const submitApplication = mutation({
  args: {
    propertyId: v.id("properties"),
    roomId: v.optional(v.id("rooms")),
    tenantId: v.string(),
    managerId: v.string(),
    name: v.string(),
    email: v.string(),
    phoneNumber: v.string(),
    message: v.optional(v.string()),
    // Optional overrides for migration (migration sets these explicitly)
    status: v.optional(v.string()),
    applicationDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("applications", {
      propertyId: args.propertyId,
      roomId: args.roomId,
      tenantId: args.tenantId,
      managerId: args.managerId,
      name: args.name,
      email: args.email,
      phoneNumber: args.phoneNumber,
      message: args.message,
      status: args.status ?? "Pending",
      applicationDate: args.applicationDate ?? new Date().toISOString(),
      createdAt: Date.now(),
    });
  },
});

export const updateApplicationStatus = mutation({
  args: {
    applicationId: v.id("applications"),
    status: v.string(), // "Approved", "Denied"
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.applicationId, { status: args.status });
  },
});

export const getPropertyApplications = query({
  args: { propertyId: v.id("properties") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("applications")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .collect();
  },
});
