/**
 * scripts/sync_inactive_properties.cjs
 * Checks all inactive / disabled / non-approved properties in the old Neon PostgreSQL database
 * and updates their status in Convex Cloud accordingly by exact & fuzzy property name matching.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { ConvexHttpClient } = require('convex/browser');
const { api } = require('../convex/_generated/api');
const { Pool } = require('pg');

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://hardy-bird-543.convex.cloud';
const DB_URL = process.env.DATABASE_URL;

const convex = new ConvexHttpClient(CONVEX_URL);
const pg = new Pool({ connectionString: DB_URL });

function normalize(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function main() {
  console.log(`🔍 Querying inactive/disabled properties from Neon DB and syncing to Convex (${CONVEX_URL})...\n`);

  // 1. Get disabled property IDs from `disabled_properties`
  let disabledIds = new Set();
  try {
    const disabledRes = await pg.query(`SELECT property_id FROM disabled_properties`);
    disabledRes.rows.forEach(r => disabledIds.add(Number(r.property_id)));
    console.log(`Found ${disabledIds.size} disabled IDs in 'disabled_properties' table.`);
  } catch (e) {
    console.warn("⚠️ Could not query 'disabled_properties':", e.message);
  }

  // 2. Get all properties from Neon DB
  const neonRes = await pg.query(`SELECT id, name, status FROM "Property"`);
  const neonProps = neonRes.rows;
  console.log(`Found ${neonProps.length} total properties in Neon DB.\n`);

  // Build map of normalized property name -> status ('Disabled' / 'Denied' / 'Pending')
  const inactiveNamesMap = new Map();

  for (const np of neonProps) {
    const isDisabledTable = disabledIds.has(Number(np.id));
    const isNonApprovedStatus = np.status && np.status !== 'Approved';

    if (isDisabledTable || isNonApprovedStatus) {
      const targetStatus = isDisabledTable ? 'Disabled' : (np.status || 'Disabled');
      const normKey = normalize(np.name);
      if (normKey) {
        inactiveNamesMap.set(normKey, { id: np.id, name: np.name, status: targetStatus });
      }
    }
  }

  console.log(`Identified ${inactiveNamesMap.size} unique inactive property names from old database:\n`);
  for (const [key, val] of inactiveNamesMap.entries()) {
    console.log(`  • [ID: ${val.id}] "${val.name}" -> Status: ${val.status}`);
  }
  console.log('');

  // 3. Query all properties in Convex Cloud
  const convexProps = await convex.query(api.properties.getProperties, {});
  console.log(`Fetched ${convexProps.length} properties from Convex Cloud.\n`);

  let updatedCount = 0;

  for (const cp of convexProps) {
    const normName = normalize(cp.name);
    const inactiveEntry = inactiveNamesMap.get(normName);

    if (inactiveEntry) {
      const targetStatus = inactiveEntry.status;
      if (cp.status !== targetStatus) {
        try {
          await convex.mutation(api.properties.updatePropertyStatus, {
            id: cp._id,
            status: targetStatus
          });
          console.log(`  ✓ Updated Convex property [${cp.name}] (${cp._id}) status to '${targetStatus}' (Matched Neon ID: ${inactiveEntry.id})`);
          updatedCount++;
        } catch (err) {
          console.warn(`  ⚠️ Failed to update Convex property [${cp.name}]:`, err.message);
        }
      } else {
        console.log(`  - Convex property [${cp.name}] is ALREADY set to '${targetStatus}'`);
      }
    }
  }

  console.log(`\n🎉 INACTIVE PROPERTY SYNC COMPLETE! Successfully set ${updatedCount} properties in Convex Cloud to Disabled/Denied to match the old database.`);
  await pg.end().catch(() => {});
}

main().catch(err => {
  console.error('Fatal error during inactive property sync:', err);
  process.exit(1);
});
