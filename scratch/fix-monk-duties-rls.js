const postgres = require('postgres');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!connectionString) {
  console.error('No connection string found');
  process.exit(1);
}

const sql = postgres(connectionString);

async function run() {
  try {
    console.log('Fixing RLS for monk_duties table...');
    
    // Disable RLS on monk_duties so Supabase client REST API can read/write freely
    await sql`ALTER TABLE monk_duties DISABLE ROW LEVEL SECURITY;`;
    
    console.log('monk_duties RLS disabled successfully!');
  } catch (err) {
    console.error('Failed to disable RLS:', err);
  } finally {
    await sql.end();
  }
}

run();
