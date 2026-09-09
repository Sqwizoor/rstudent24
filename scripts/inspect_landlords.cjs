const { Pool } = require('pg');
const pg = new Pool({ connectionString: 'postgresql://student24_owner:npg_jAl5J7vaSfHW@ep-plain-rain-a8c3ykjt-pooler.eastus2.azure.neon.tech/student24?sslmode=require&channel_binding=require' });
async function run() {
  const managers = await pg.query(`SELECT "cognitoId", email, name FROM "Manager"`);
  console.log('Total managers in Neon DB:', managers.rows.length);
  const map = {};
  for (const m of managers.rows) {
    if (m.email && m.cognitoId) {
      map[m.email.toLowerCase()] = m.cognitoId;
    }
  }
  console.log('Count of mapped managers:', Object.keys(map).length);
  console.log(JSON.stringify(map, null, 2));
  await pg.end();
}
run();
