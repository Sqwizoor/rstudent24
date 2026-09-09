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

async function run() {
  console.log('--- 1. Fetching all managers from Neon DB ---');
  const neonManagers = await pg.query(`
    SELECT "cognitoId", name, email, status, "phoneNumber", "createdAt"
    FROM "Manager"
    ORDER BY name ASC
  `);
  console.log(`Total Neon managers: ${neonManagers.rows.length}`);
  
  const neonInactive = neonManagers.rows.filter(m => m.status !== 'Active');
  console.log(`Neon Inactive/Disabled managers (${neonInactive.length}):`);
  console.log(JSON.stringify(neonInactive, null, 2));

  console.log('\n--- 2. Fetching all managers from Convex Cloud ---');
  const convexManagers = await queryConvex('users:getAllManagers', {});
  console.log(`Total Convex managers: ${convexManagers.length}`);
  
  const convexStatusCounts = {};
  for (const cm of convexManagers) {
    convexStatusCounts[cm.status] = (convexStatusCounts[cm.status] || 0) + 1;
  }
  console.log('Convex manager status counts:', convexStatusCounts);

  // Check matching between Neon inactive and Convex
  console.log('\n--- 3. Matching Neon inactive managers in Convex ---');
  for (const nm of neonInactive) {
    const match = convexManagers.find(cm => 
      (cm.email && cm.email.toLowerCase() === nm.email?.toLowerCase()) ||
      cm.userId === nm.cognitoId
    );
    console.log(`Neon: ${nm.email} (${nm.name}, status: ${nm.status}) -> Convex match:`, match ? `${match._id} (name: ${match.name}, status: ${match.status})` : 'NOT FOUND IN CONVEX');
  }

  // Also check if any other manager in Convex has status != 'Active'
  const convexInactive = convexManagers.filter(cm => cm.status !== 'Active');
  console.log('\nConvex current non-Active managers:', convexInactive);

  await pg.end();
}
run().catch(console.error);
