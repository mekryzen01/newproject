const postgres = require('postgres');
require('dotenv').config({ path: '.env' });

// We can look for DATABASE_URL or direct connection vars
const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!connectionString) {
  console.error('No connection string found (DATABASE_URL or DIRECT_URL is missing)');
  process.exit(1);
}

const sql = postgres(connectionString);

async function run() {
  try {
    console.log('Connecting to database and applying migration...');
    
    // Check if column already exists
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'inventory' AND column_name = 'location'
    `;
    
    if (columns.length === 0) {
      await sql`ALTER TABLE inventory ADD COLUMN location text;`;
      console.log('Successfully added "location" column to "inventory" table.');
    } else {
      console.log('"location" column already exists in "inventory" table.');
    }
  } catch (err) {
    console.error('Failed to run migration:', err);
  } finally {
    await sql.end();
  }
}

run();
