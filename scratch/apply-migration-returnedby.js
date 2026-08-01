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
    console.log('Connecting to database and applying migration for returned_by...');
    
    // Check if column already exists
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'borrow_records' AND column_name = 'returned_by'
    `;
    
    if (columns.length === 0) {
      await sql`ALTER TABLE borrow_records ADD COLUMN returned_by text;`;
      console.log('Successfully added "returned_by" column to "borrow_records" table.');
    } else {
      console.log('"returned_by" column already exists in "borrow_records" table.');
    }
  } catch (err) {
    console.error('Failed to run migration:', err);
  } finally {
    await sql.end();
  }
}

run();
