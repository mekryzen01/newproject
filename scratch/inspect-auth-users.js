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
    console.log('Fetching auth.users...');
    const authUsers = await sql`
      SELECT id, email, created_at 
      FROM auth.users;
    `;
    console.log('auth.users records:', authUsers);

    console.log('Fetching public.users...');
    const publicUsers = await sql`
      SELECT id, email, full_name, role, created_at 
      FROM public.users;
    `;
    console.log('public.users records:', publicUsers);

  } catch (err) {
    console.error('Failed to query databases:', err);
  } finally {
    await sql.end();
  }
}

run();
