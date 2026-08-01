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
    console.log('Inspecting triggers on public.users table...');
    const triggers = await sql`
      SELECT trigger_name, event_manipulation, action_statement 
      FROM information_schema.triggers 
      WHERE event_object_table = 'users' AND event_object_schema = 'public';
    `;
    console.log('Triggers found on public.users:', triggers);

    // Inspect pg_trigger table for all triggers
    const pgTriggers = await sql`
      SELECT tgname, relname
      FROM pg_trigger t
      JOIN pg_class c ON c.oid = t.tgrelid
      WHERE relname = 'users';
    `;
    console.log('pg_trigger entries for users:', pgTriggers);

    // Get definition of sync_system_user_to_auth
    const fnDef = await sql`
      SELECT prosrc 
      FROM pg_proc 
      WHERE proname = 'sync_system_user_to_auth';
    `;
    console.log('sync_system_user_to_auth definition:', fnDef[0]?.prosrc);

  } catch (err) {
    console.error('Failed to query database:', err);
  } finally {
    await sql.end();
  }
}

run();
