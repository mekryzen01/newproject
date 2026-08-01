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
    console.log('Disabling Row Level Security (RLS) on funeral_arrangements table...');
    
    // Disable RLS
    await sql`ALTER TABLE funeral_arrangements DISABLE ROW LEVEL SECURITY;`;
    
    console.log('Successfully disabled RLS on funeral_arrangements table!');
  } catch (err) {
    console.error('Failed to disable RLS:', err);
  } finally {
    await sql.end();
  }
}

run();
