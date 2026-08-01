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
    console.log('Creating monk_duties table if not exists...');
    
    await sql`
      CREATE TABLE IF NOT EXISTS monk_duties (
        id VARCHAR(256) PRIMARY KEY,
        duty_title TEXT NOT NULL,
        date TEXT NOT NULL,
        time_slot TEXT NOT NULL,
        assigned_monk_ids TEXT NOT NULL,
        assigned_monk_names TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        is_deleted BOOLEAN DEFAULT false,
        created_at TEXT NOT NULL
      );
    `;
    
    console.log('monk_duties table created successfully!');
  } catch (err) {
    console.error('Failed to create monk_duties table:', err);
  } finally {
    await sql.end();
  }
}

run();
