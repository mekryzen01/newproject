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
    console.log('Connecting to database to add ashes withdraw columns...');
    
    // Add columns if not exists
    await sql`ALTER TABLE ashes ADD COLUMN IF NOT EXISTS status text DEFAULT 'deposited';`;
    await sql`ALTER TABLE ashes ADD COLUMN IF NOT EXISTS withdraw_date text;`;
    await sql`ALTER TABLE ashes ADD COLUMN IF NOT EXISTS withdraw_by text;`;
    await sql`ALTER TABLE ashes ADD COLUMN IF NOT EXISTS withdraw_reason text;`;
    
    console.log('Ashes withdraw columns successfully verified/added to table ashes!');
  } catch (err) {
    console.error('Failed to add columns:', err);
  } finally {
    await sql.end();
  }
}

run();
