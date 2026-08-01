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
    console.log('Deleting collinsport_02@hotmail.com from auth.users...');
    const result = await sql`
      DELETE FROM auth.users 
      WHERE email = 'collinsport_02@hotmail.com';
    `;
    console.log('Delete result:', result);
  } catch (err) {
    console.error('Failed to delete dangling user:', err);
  } finally {
    await sql.end();
  }
}

run();
