/**
 * migrate_to_convex.cjs
 * One-time migration: PostgreSQL + AWS S3 → Convex
 *
 * Reads all data from Neon PostgreSQL, downloads images from AWS S3,
 * uploads images to Convex File Storage, and inserts all records into Convex.
 *
 * Usage:
 *   node scripts/migrate_to_convex.cjs
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { ConvexHttpClient } = require('convex/browser');
const { api } = require('../convex/_generated/api');
const { Pool } = require('pg');
const https = require('https');
const http = require('http');
const { Readable } = require('stream');

let S3Client, GetObjectCommand;
try {
  const s3Module = require('@aws-sdk/client-s3');
  S3Client = s3Module.S3Client;
  GetObjectCommand = s3Module.GetObjectCommand;
} catch (e) {
  // @aws-sdk/client-s3 not available, will use direct HTTP downloads
}

// ── Config ─────────────────────────────────────────────────────────────────
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://hardy-bird-543.convex.cloud';
const DB_URL = process.env.DATABASE_URL;
const AWS_REGION = process.env.S24_AWS_REGION || 'eu-north-1';
const AWS_BUCKET = process.env.S24_AWS_BUCKET_NAME || 'better-students24';
const AWS_KEY = process.env.S24_AWS_ACCESS_KEY_ID;
const AWS_SECRET = process.env.S24_AWS_SECRET_ACCESS_KEY;

// ── Clients ─────────────────────────────────────────────────────────────────
const convex = new ConvexHttpClient(CONVEX_URL);
const pg = new Pool({ connectionString: DB_URL });
const s3 = (S3Client && AWS_KEY) ? new S3Client({
  region: AWS_REGION,
  credentials: { accessKeyId: AWS_KEY, secretAccessKey: AWS_SECRET },
}) : null;

// ── Helpers ─────────────────────────────────────────────────────────────────
function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }
function warn(msg) { console.warn(`⚠️  ${msg}`); }

/** Download a file from a URL and return a Buffer */
async function downloadUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

/** Download a file from S3 by key and return a Buffer */
async function downloadFromS3(key) {
  if (!s3 || !GetObjectCommand) throw new Error('S3 client not initialized');
  const cmd = new GetObjectCommand({ Bucket: AWS_BUCKET, Key: key });
  const res = await s3.send(cmd);
  const chunks = [];
  for await (const chunk of res.Body) chunks.push(chunk);
  return Buffer.concat(chunks);
}

/** Extract S3 key from a full S3 URL */
function s3KeyFromUrl(url) {
  try {
    const u = new URL(url);
    // Remove leading /
    return u.pathname.replace(/^\//, '');
  } catch {
    return null;
  }
}

/** Detect content type from URL */
function mimeFromUrl(url) {
  const ext = path.extname(url.split('?')[0]).toLowerCase();
  const map = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif' };
  return map[ext] || 'image/jpeg';
}

/**
 * Upload a Buffer to Convex File Storage.
 * Returns the storageId string.
 */
async function uploadBufferToConvex(buffer, mimeType) {
  // 1. Get upload URL from Convex
  const uploadUrl = await convex.mutation(api.files.generateUploadUrl);

  // 2. POST the buffer to the upload URL
  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': mimeType },
    body: buffer,
  });

  if (!res.ok) {
    throw new Error(`Convex upload failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  return json.storageId;
}

/**
 * Try to download a photo URL (from AWS S3 or any URL) and upload to Convex.
 * Returns storageId or null on failure.
 */
async function migratePhoto(url) {
  try {
    let buffer;
    const mime = mimeFromUrl(url);

    if (url.includes('amazonaws.com') || url.includes('s3.')) {
      // Try S3 SDK first for private buckets
      try {
        const key = s3KeyFromUrl(url);
        if (key) {
          buffer = await downloadFromS3(key);
        } else {
          buffer = await downloadUrl(url);
        }
      } catch {
        // Fall back to direct HTTP download if public
        buffer = await downloadUrl(url);
      }
    } else {
      buffer = await downloadUrl(url);
    }

    const storageId = await uploadBufferToConvex(buffer, mime);
    return storageId;
  } catch (err) {
    warn(`Failed to migrate photo ${url}: ${err.message}`);
    return null;
  }
}

// ── Main Migration ──────────────────────────────────────────────────────────
async function main() {
  log('🚀 Starting migration to Convex...');
  log(`   Convex: ${CONVEX_URL}`);
  log(`   Database: ${DB_URL?.slice(0, 40)}...`);

  // ── 1. Migrate Managers ──────────────────────────────────────────────────
  log('\n── Migrating Managers (Landlords) ──');
  const managersResult = await pg.query(`SELECT * FROM "Manager"`);
  const managers = managersResult.rows;
  log(`Found ${managers.length} managers`);

  const managerIdMap = {}; // old cognitoId → convex _id
  let managerSuccess = 0;

  for (const m of managers) {
    try {
      const convexId = await convex.mutation(api.users.upsertManager, {
        userId: m.cognitoId,
        email: m.email,
        name: m.name,
        phoneNumber: m.phoneNumber || undefined,
      });
      managerIdMap[m.cognitoId] = convexId;
      managerSuccess++;
      if (managerSuccess % 5 === 0) log(`  ✓ ${managerSuccess}/${managers.length} managers`);
    } catch (err) {
      warn(`Manager ${m.cognitoId} failed: ${err.message}`);
    }
  }
  log(`✅ Managers migrated: ${managerSuccess}/${managers.length}`);

  // ── 2. Migrate Tenants ───────────────────────────────────────────────────
  log('\n── Migrating Tenants (Students) ──');
  const tenantsResult = await pg.query(`SELECT * FROM "Tenant"`);
  const tenants = tenantsResult.rows;
  log(`Found ${tenants.length} tenants`);

  const tenantIdMap = {}; // old cognitoId → convex _id
  let tenantSuccess = 0;

  for (const t of tenants) {
    try {
      const convexId = await convex.mutation(api.users.upsertTenant, {
        userId: t.cognitoId,
        email: t.email,
        name: t.name,
        phoneNumber: t.phoneNumber || undefined,
        referredBy: t.referredBy || undefined,
      });
      tenantIdMap[t.cognitoId] = convexId;
      tenantSuccess++;
      if (tenantSuccess % 5 === 0) log(`  ✓ ${tenantSuccess}/${tenants.length} tenants`);
    } catch (err) {
      warn(`Tenant ${t.cognitoId} failed: ${err.message}`);
    }
  }
  log(`✅ Tenants migrated: ${tenantSuccess}/${tenants.length}`);

  // ── 3. Migrate Properties (with images) ─────────────────────────────────
  log('\n── Migrating Properties ──');
  const propertiesResult = await pg.query(`
    SELECT p.*, 
           l.address, l.city, l.suburb, l.state, l.country, l."postalCode",
           ST_Y(l.coordinates::geometry) as latitude,
           ST_X(l.coordinates::geometry) as longitude
    FROM "Property" p
    JOIN "Location" l ON p."locationId" = l.id
    ORDER BY p.id
  `);
  const properties = propertiesResult.rows;
  log(`Found ${properties.length} properties`);

  const propertyIdMap = {}; // old pg id → convex _id
  let propSuccess = 0;
  let totalImagesOk = 0;
  let totalImagesFail = 0;

  for (const p of properties) {
    try {
      log(`  → Property [${p.id}] "${p.name}" — migrating ${p.photoUrls?.length || 0} images...`);

      // Migrate images
      const storageIds = [];
      for (const url of (p.photoUrls || [])) {
        const storageId = await migratePhoto(url);
        if (storageId) {
          storageIds.push(storageId);
          totalImagesOk++;
        } else {
          totalImagesFail++;
        }
      }

      const convexId = await convex.mutation(api.properties.createPropertyWithStatus, {
        name: p.name,
        description: p.description,
        pricePerMonth: Number(p.pricePerMonth),
        securityDeposit: Number(p.securityDeposit),
        beds: Number(p.beds) || 0,
        baths: Number(p.baths) || 0,
        kitchens: p.kitchens ? Number(p.kitchens) : undefined,
        squareFeet: p.squareFeet ? Number(p.squareFeet) : undefined,
        propertyType: p.propertyType || 'Apartment',
        images: storageIds,
        amenities: Array.isArray(p.amenities) ? p.amenities : [],
        highlights: Array.isArray(p.highlights) ? p.highlights : [],
        accreditedBy: Array.isArray(p.accreditedBy) ? p.accreditedBy : undefined,
        closestUniversity: p.closestUniversity || undefined,
        closestCampuses: Array.isArray(p.closestCampuses) ? p.closestCampuses : undefined,
        isPetsAllowed: p.isPetsAllowed || false,
        isParkingIncluded: p.isParkingIncluded || false,
        isNsfassAccredited: p.isNsfassAccredited || false,
        address: p.address || '',
        city: p.city || '',
        suburb: p.suburb || undefined,
        state: p.state || undefined,
        country: p.country || 'South Africa',
        postalCode: p.postalCode || undefined,
        latitude: Number(p.latitude) || 0,
        longitude: Number(p.longitude) || 0,
        managerId: p.managerCognitoId,
        redirectType: p.redirectType || undefined,
        whatsappNumber: p.whatsappNumber || undefined,
        customLink: p.customLink || undefined,
        status: p.status || 'Approved',
        averageRating: Number(p.averageRating) || 0,
        numberOfReviews: Number(p.numberOfReviews) || 0,
        postedDate: p.postedDate ? new Date(p.postedDate).toISOString() : new Date().toISOString(),
      });

      propertyIdMap[p.id] = convexId;
      propSuccess++;
      log(`  ✅ [${propSuccess}/${properties.length}] "${p.name}" → ${convexId} (${storageIds.length} images)`);
    } catch (err) {
      warn(`Property [${p.id}] "${p.name}" failed: ${err.message}`);
    }
  }
  log(`✅ Properties migrated: ${propSuccess}/${properties.length}`);
  log(`   Images: ${totalImagesOk} ok, ${totalImagesFail} failed`);

  // ── 4. Migrate Rooms ─────────────────────────────────────────────────────
  log('\n── Migrating Rooms ──');
  const roomsResult = await pg.query(`SELECT * FROM "Room" ORDER BY id`);
  const rooms = roomsResult.rows;
  log(`Found ${rooms.length} rooms`);

  let roomSuccess = 0;

  for (const r of rooms) {
    try {
      const convexPropertyId = propertyIdMap[r.propertyId];
      if (!convexPropertyId) {
        warn(`Room [${r.id}] skipped — parent property [${r.propertyId}] not migrated`);
        continue;
      }

      // Migrate room images
      const roomStorageIds = [];
      for (const url of (r.photoUrls || [])) {
        const storageId = await migratePhoto(url);
        if (storageId) roomStorageIds.push(storageId);
      }

      await convex.mutation(api.properties.createRoom, {
        propertyId: convexPropertyId,
        name: r.name || 'Room',
        description: r.description || undefined,
        pricePerMonth: Number(r.pricePerMonth) || 0,
        securityDeposit: Number(r.securityDeposit) || 0,
        topUp: r.topUp ? Number(r.topUp) : undefined,
        beds: Number(r.beds) || 1,
        baths: Number(r.baths) || 1,
        squareFeet: r.squareFeet ? Number(r.squareFeet) : undefined,
        images: roomStorageIds,
        isAvailable: r.isAvailable !== false,
        roomType: r.roomType || 'PRIVATE',
        capacity: Number(r.capacity) || 1,
        features: Array.isArray(r.features) ? r.features : [],
        availableFrom: r.availableFrom ? new Date(r.availableFrom).toISOString() : undefined,
      });

      roomSuccess++;
    } catch (err) {
      warn(`Room [${r.id}] failed: ${err.message}`);
    }
  }
  log(`✅ Rooms migrated: ${roomSuccess}/${rooms.length}`);

  // ── 5. Migrate Applications ──────────────────────────────────────────────
  log('\n── Migrating Applications ──');
  const appsResult = await pg.query(`SELECT * FROM "Application" ORDER BY id`);
  const apps = appsResult.rows;
  log(`Found ${apps.length} applications`);

  let appSuccess = 0;

  for (const a of apps) {
    try {
      const convexPropertyId = propertyIdMap[a.propertyId];
      if (!convexPropertyId) {
        warn(`App [${a.id}] skipped — property [${a.propertyId}] not migrated`);
        continue;
      }

      // Get manager cognitoId from the property
      const propRow = await pg.query(`SELECT "managerCognitoId" FROM "Property" WHERE id = $1`, [a.propertyId]);
      const managerId = propRow.rows[0]?.managerCognitoId || '';

      await convex.mutation(api.applications.submitApplication, {
        propertyId: convexPropertyId,
        tenantId: a.tenantCognitoId || 'anonymous',
        managerId,
        name: a.name || 'Unknown',
        email: a.email || '',
        phoneNumber: a.phoneNumber || '',
        message: a.message || undefined,
        status: a.status || 'Pending',
        applicationDate: new Date(a.applicationDate).toISOString(),
      });

      appSuccess++;
    } catch (err) {
      warn(`Application [${a.id}] failed: ${err.message}`);
    }
  }
  log(`✅ Applications migrated: ${appSuccess}/${apps.length}`);

  // ── 6. Migrate Favorites ─────────────────────────────────────────────────
  log('\n── Migrating Favorites ──');
  const favsResult = await pg.query(`
    SELECT t."cognitoId" as "userId", tf."B" as "propertyId"
    FROM "_TenantFavorites" tf
    JOIN "Tenant" t ON tf."A" = t.id
  `).catch(() => ({ rows: [] })); // graceful if table name differs

  const favs = favsResult.rows;
  log(`Found ${favs.length} favorites`);
  let favSuccess = 0;

  for (const f of favs) {
    try {
      const convexPropertyId = propertyIdMap[f.propertyId];
      if (!convexPropertyId) continue;
      await convex.mutation(api.favorites.addFavorite, {
        userId: f.userId,
        propertyId: convexPropertyId,
      });
      favSuccess++;
    } catch (err) {
      warn(`Favorite failed: ${err.message}`);
    }
  }
  log(`✅ Favorites migrated: ${favSuccess}/${favs.length}`);

  // ── 7. Migrate Reviews ───────────────────────────────────────────────────
  log('\n── Migrating Reviews ──');
  const reviewsResult = await pg.query(`SELECT * FROM "Review" ORDER BY id`).catch(() => ({ rows: [] }));
  const revs = reviewsResult.rows;
  log(`Found ${revs.length} reviews`);
  let revSuccess = 0;

  for (const r of revs) {
    try {
      const convexPropertyId = propertyIdMap[r.propertyId];
      if (!convexPropertyId) continue;
      await convex.mutation(api.reviews.createReview, {
        propertyId: convexPropertyId,
        tenantId: r.tenantCognitoId,
        tenantName: r.tenantName || undefined,
        rating: Number(r.rating),
        comment: r.comment || undefined,
      });
      revSuccess++;
    } catch (err) {
      warn(`Review failed: ${err.message}`);
    }
  }
  log(`✅ Reviews migrated: ${revSuccess}/${revs.length}`);

  // ── Summary ──────────────────────────────────────────────────────────────
  log('\n══════════════════════════════════════════');
  log('✅ MIGRATION COMPLETE');
  log(`   Managers:     ${managerSuccess}/${managers.length}`);
  log(`   Tenants:      ${tenantSuccess}/${tenants.length}`);
  log(`   Properties:   ${propSuccess}/${properties.length}`);
  log(`   Rooms:        ${roomSuccess}/${rooms.length}`);
  log(`   Applications: ${appSuccess}/${apps.length}`);
  log(`   Favorites:    ${favSuccess}/${favs.length}`);
  log(`   Reviews:      ${revSuccess}/${revs.length}`);
  log(`   Images OK:    ${totalImagesOk}`);
  log(`   Images FAIL:  ${totalImagesFail}`);
  log('══════════════════════════════════════════');

  await pg.end();
}

main().catch((err) => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
