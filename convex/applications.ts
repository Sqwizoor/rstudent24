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

export const getManagerApplications = query({
  args: { managerId: v.string() },
  handler: async (ctx, args) => {
    // Strictly isolate: A manager MUST only see applications for their own properties.
    if (!args.managerId || args.managerId.trim() === "") {
      return [];
    }

    if (args.managerId === "ALL" || args.managerId === "admin") {
      const allApps = await ctx.db.query("applications").order("desc").collect();
      return await Promise.all(
        allApps.map(async (app) => {
          const property = await ctx.db.get(app.propertyId);
          return { ...app, property };
        })
      );
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
      if (manager.userId) searchIds.add(manager.userId);
      if (manager.email) {
        searchIds.add(manager.email);
        searchIds.add(manager.email.toLowerCase());
        if (MIGRATED_LANDLORD_LOOKUP[manager.email.toLowerCase()]) {
          searchIds.add(MIGRATED_LANDLORD_LOOKUP[manager.email.toLowerCase()]);
        }
      }
    }

    // Find all properties owned by this manager to catch applications targeting their properties
    const managerPropertyIds = new Set<string>();
    for (const id of searchIds) {
      const props = await ctx.db
        .query("properties")
        .withIndex("by_manager", (q) => q.eq("managerId", id))
        .collect();
      props.forEach((p) => managerPropertyIds.add(p._id));
    }

    const matchedApps: any[] = [];
    const seenAppIds = new Set<string>();

    for (const id of searchIds) {
      const apps = await ctx.db
        .query("applications")
        .withIndex("by_manager", (q) => q.eq("managerId", id))
        .collect();
      for (const a of apps) {
        if (!seenAppIds.has(a._id)) {
          seenAppIds.add(a._id);
          matchedApps.push(a);
        }
      }
    }

    for (const propId of managerPropertyIds) {
      const propApps = await ctx.db
        .query("applications")
        .filter((q) => q.eq(q.field("propertyId"), propId))
        .collect();
      for (const a of propApps) {
        if (!seenAppIds.has(a._id)) {
          seenAppIds.add(a._id);
          matchedApps.push(a);
        }
      }
    }

    // CRITICAL: NEVER return all applications if none matched! Return empty array!
    if (matchedApps.length === 0) {
      return [];
    }

    return await Promise.all(
      matchedApps.map(async (app) => {
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
