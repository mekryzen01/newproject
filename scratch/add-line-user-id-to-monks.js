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
    console.log('Adding line_user_id column to monks table...');
    
    // Check if column already exists
    const checkColumn = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'monks' AND column_name = 'line_user_id';
    `;
    
    if (checkColumn.length === 0) {
      await sql`ALTER TABLE monks ADD COLUMN line_user_id TEXT;`;
      console.log('Successfully added line_user_id column to monks table!');
    } else {
      console.log('line_user_id column already exists in monks table.');
    }

  } catch (err) {
    console.error('Failed to update monks table schema:', err);
  } finally {
    await sql.end();
  }
}

run();
