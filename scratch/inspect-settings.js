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
    console.log('Querying settings table...');
    try {
      const settings = await sql`SELECT * FROM settings;`;
      console.log('settings rows:', settings);
    } catch (e) {
      console.error('Failed to query settings table:', e.message);
    }

    console.log('Querying temple_settings table...');
    try {
      const templeSettings = await sql`SELECT * FROM temple_settings;`;
      console.log('temple_settings rows:', templeSettings);
    } catch (e) {
      console.error('Failed to query temple_settings table:', e.message);
    }
  } catch (err) {
    console.error('Failed:', err);
  } finally {
    await sql.end();
  }
}

run();
