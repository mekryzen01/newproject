const postgres = require('postgres');
const crypto = require('crypto');
require('dotenv').config({ path: '.env' });

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!connectionString) {
  console.error('No connection string found (DATABASE_URL or DIRECT_URL is missing)');
  process.exit(1);
}

const sql = postgres(connectionString);

async function run() {
  const testId = crypto.randomUUID();
  const testEmail = 'trigger-test-' + Date.now() + '@temple.com';
  
  console.log(`Testing direct insert into public.users with ID: ${testId}, Email: ${testEmail}...`);
  
  try {
    // Insert directly into public.users (triggers sync_system_user_to_auth)
    await sql`
      INSERT INTO public.users (id, email, password, full_name, role, created_at, is_deleted)
      VALUES (${testId}, ${testEmail}, 'TestPass123', 'Trigger Test User', 'member', ${new Date().toISOString()}, false);
    `;
    console.log('Successfully inserted into public.users!');

    // Check if user exists in auth.users
    const authUser = await sql`
      SELECT id, email, encrypted_password 
      FROM auth.users 
      WHERE id = ${testId};
    `;
    console.log('QueryResult in auth.users:', authUser);

    // Clean up
    console.log('Cleaning up...');
    await sql`DELETE FROM public.users WHERE id = ${testId};`;
    console.log('Cleaned up successfully.');

  } catch (err) {
    console.error('Test failed with error:', err);
  } finally {
    await sql.end();
  }
}

run();
