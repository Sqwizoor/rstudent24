const { Pool } = require('pg');

const pg = new Pool({ connectionString: 'postgresql://student24_owner:npg_jAl5J7vaSfHW@ep-plain-rain-a8c3ykjt-pooler.eastus2.azure.neon.tech/student24?sslmode=require&channel_binding=require' });
const CONVEX_URL = 'https://hardy-bird-543.convex.cloud';

async function queryConvex(path, args = {}) {
  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, args })
  });
  const data = await res.json();
  return data.value;
}

async function mutateConvex(path, args = {}) {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, args })
  });
  const data = await res.json();
  return data.value;
}

async function run() {
  console.log('Fetching non-active managers from Neon DB...');
  const neonRes = await pg.query(`
    SELECT "cognitoId", name, email, status, "phoneNumber"
    FROM "Manager"
    WHERE status != 'Active' OR status IS NULL
  `);

  console.log(`Found ${neonRes.rows.length} non-active managers in Neon DB:`);
  console.log(neonRes.rows);

  console.log('\nFetching all managers from Convex Cloud...');
  const convexManagers = await queryConvex('users:getAllManagers', {});
  console.log(`Found ${convexManagers.length} managers in Convex.`);

  let updatedCount = 0;
  for (const nm of neonRes.rows) {
    const targetStatus = nm.status || 'Disabled';
    const emailLower = nm.email ? nm.email.toLowerCase() : '';

    // Find in Convex by email or userId
    const match = convexManagers.find(cm => 
      (cm.email && cm.email.toLowerCase() === emailLower) ||
      cm.userId === nm.cognitoId
    );

    if (match) {
      console.log(`Updating Convex manager ${match._id} (${match.name} / ${match.email}) status from "${match.status}" to "${targetStatus}"...`);
      await mutateConvex('users:updateManagerStatus', {
        managerId: match._id,
        status: targetStatus,
      });
      updatedCount++;
    } else {
      console.log(`Manager ${nm.email} (${nm.cognitoId}) not found in Convex managers table, inserting...`);
      await mutateConvex('users:upsertManager', {
        userId: nm.cognitoId,
        email: nm.email || 'unknown@student24.co.za',
        name: nm.name || 'Landlord',
        phoneNumber: nm.phoneNumber || '',
      });
      // Now update status to Disabled
      await mutateConvex('users:updateManagerStatus', {
        userId: nm.cognitoId,
        status: targetStatus,
      });
      updatedCount++;
    }
  }

  console.log(`\nSuccessfully updated ${updatedCount} managers in Convex Cloud to match Neon DB inactive status!`);

  // Verify
  console.log('\nVerifying Convex manager statuses:');
  const verifyManagers = await queryConvex('users:getAllManagers', {});
  const disabledInConvex = verifyManagers.filter(m => m.status !== 'Active');
  console.log(`Disabled managers in Convex (${disabledInConvex.length}):`);
  console.log(disabledInConvex.map(m => ({ id: m._id, name: m.name, email: m.email, status: m.status })));

  await pg.end();
}

run().catch(console.error);
