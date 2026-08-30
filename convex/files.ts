import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Generate a direct upload URL for the frontend to upload an image to Convex Storage
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

// Resolve a storage ID to a high-speed CDN URL
export const getImageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Batch resolve storage IDs to URLs
export const getImageUrls = query({
  args: { storageIds: v.array(v.id("_storage")) },
  handler: async (ctx, args) => {
    return await Promise.all(
      args.storageIds.map((id) => ctx.storage.getUrl(id))
    );
  },
});

// Delete an image from Convex storage
export const deleteFile = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await ctx.storage.delete(args.storageId);
  },
});
