import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all reviews for a property
export const getPropertyReviews = query({
  args: { propertyId: v.id("properties") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reviews")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .order("desc")
      .collect();
  },
});

// Submit a review
export const createReview = mutation({
  args: {
    propertyId: v.id("properties"),
    tenantId: v.string(),
    tenantName: v.optional(v.string()),
    rating: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const reviewId = await ctx.db.insert("reviews", {
      propertyId: args.propertyId,
      tenantId: args.tenantId,
      tenantName: args.tenantName,
      rating: args.rating,
      comment: args.comment,
      createdAt: Date.now(),
    });

    // Recalculate average rating for the property
    const allReviews = await ctx.db
      .query("reviews")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .collect();

    const avg =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await ctx.db.patch(args.propertyId, {
      averageRating: Math.round(avg * 10) / 10,
      numberOfReviews: allReviews.length,
    });

    return reviewId;
  },
});
