import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all reviews for a property
export const getPropertyReviews = query({
  args: { propertyId: v.string() },
  handler: async (ctx, args) => {
    let reviews: any[] = [];
    try {
      reviews = await ctx.db
        .query("reviews")
        .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId as any))
        .order("desc")
        .collect();
    } catch {
      // Fallback if propertyId is not standard Id type
    }

    if (reviews.length === 0) {
      const all = await ctx.db.query("reviews").collect();
      reviews = all.filter(
        (r: any) => r.propertyId === args.propertyId || r.propertyId?.toString() === args.propertyId
      );
    }

    return reviews;
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
