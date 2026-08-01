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
    console.log('Connecting to database to add scanned_document_url column...');
    await sql`ALTER TABLE funeral_arrangements ADD COLUMN IF NOT EXISTS scanned_document_url text;`;
    console.log('Column scanned_document_url successfully verified/added to table funeral_arrangements!');
  } catch (err) {
    console.error('Failed to add column:', err);
  } finally {
    await sql.end();
  }
}

run();
