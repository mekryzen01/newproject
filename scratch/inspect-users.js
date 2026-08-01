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
    console.log('Inspecting users table...');
    
    // Check if table users exists and lists its columns
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `;
    console.log('Columns in users table:', columns);

    // Check if RLS is enabled
    const rls = await sql`
      SELECT relname, relrowsecurity 
      FROM pg_class 
      WHERE relname = 'users';
    `;
    console.log('RLS Status of users table:', rls);

    // List all RLS policies on table users
    const policies = await sql`
      SELECT * 
      FROM pg_policies 
      WHERE tablename = 'users';
    `;
    console.log('Policies on users table:', policies);

    // List count and records in users table
    const users = await sql`
      SELECT id, email, role, full_name, created_at 
      FROM users;
    `;
    console.log(`Users in users table (${users.length}):`, users);

  } catch (err) {
    console.error('Failed to inspect users table:', err);
  } finally {
    await sql.end();
  }
}

run();
