import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all favorites for a user
export const getUserFavorites = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const favs = await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return await Promise.all(
      favs.map(async (fav) => {
        const property = await ctx.db.get(fav.propertyId);
        if (!property) return null;
        const imageUrls = await Promise.all(
          property.images.map((id) => ctx.storage.getUrl(id))
        );
        return {
          ...fav,
          property: { ...property, imageUrls: imageUrls.filter(Boolean) },
        };
      })
    ).then((results) => results.filter(Boolean));
  },
});

// Check if a specific property is favorited by a user
export const isFavorited = query({
  args: { userId: v.string(), propertyId: v.id("properties") },
  handler: async (ctx, args) => {
    const fav = await ctx.db
      .query("favorites")
      .withIndex("by_user_property", (q) =>
        q.eq("userId", args.userId).eq("propertyId", args.propertyId)
      )
      .unique();
    return fav !== null;
  },
});

// Add a property to favorites
export const addFavorite = mutation({
  args: { userId: v.string(), propertyId: v.id("properties") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_property", (q) =>
        q.eq("userId", args.userId).eq("propertyId", args.propertyId)
      )
      .unique();
    if (existing) return existing._id; // already favorited
    return await ctx.db.insert("favorites", {
      userId: args.userId,
      propertyId: args.propertyId,
      createdAt: Date.now(),
    });
  },
});

// Remove a property from favorites
export const removeFavorite = mutation({
  args: { userId: v.string(), propertyId: v.id("properties") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_property", (q) =>
        q.eq("userId", args.userId).eq("propertyId", args.propertyId)
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
