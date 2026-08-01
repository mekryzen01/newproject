const postgres = require('postgres');
require('dotenv').config({ path: '.env' });

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!connectionString) {
  console.error('No connection string found (DATABASE_URL or DIRECT_URL is missing)');
  process.exit(1);
}

const sql = postgres(connectionString);

async function run() {
  try {
    console.log('Inspecting monks table...');
    const monks = await sql`
      SELECT id, name, chaya, line_user_id 
      FROM monks;
    `;
    console.log('Monks records:', monks);
  } catch (err) {
    console.error('Failed to query monks table:', err);
  } finally {
    await sql.end();
  }
}

run();
