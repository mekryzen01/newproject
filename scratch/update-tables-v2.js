const postgres = require('postgres');
require('dotenv').config({ path: '.env' });

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!connectionString) {
  console.error('No connection string found');
  process.exit(1);
}

const sql = postgres(connectionString);

async function run() {
  try {
    console.log('Altering transactions table...');
    
    // Add status column if not exists
    await sql`
      ALTER TABLE transactions 
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'completed';
    `;
    
    // Add receipt_image column if not exists
    await sql`
      ALTER TABLE transactions 
      ADD COLUMN IF NOT EXISTS receipt_image TEXT;
    `;
    
    console.log('Altering recurring_expenses table...');
    
    // Add payer_monk_id column if not exists
    await sql`
      ALTER TABLE recurring_expenses 
      ADD COLUMN IF NOT EXISTS payer_monk_id VARCHAR(256);
    `;
    
    console.log('Database alterations complete!');
  } catch (err) {
    console.error('Failed to alter database tables:', err);
  } finally {
    await sql.end();
  }
}

run();
