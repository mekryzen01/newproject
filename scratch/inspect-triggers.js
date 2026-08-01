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
    console.log('Inspecting triggers on auth.users table...');
    const triggers = await sql`
      SELECT trigger_name, event_manipulation, action_statement 
      FROM information_schema.triggers 
      WHERE event_object_table = 'users' AND event_object_schema = 'auth';
    `;
    console.log('Triggers found:', triggers);

    // Inspect functions in public schema that handle auth.users triggers
    const functions = await sql`
      SELECT routine_name, routine_definition 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' AND routine_name LIKE '%user%';
    `;
    console.log('User-related functions found:', functions.map(f => f.routine_name));

    for (const f of functions) {
      if (f.routine_name.includes('handle') || f.routine_name.includes('trigger') || f.routine_name.includes('new')) {
        console.log(`Function: ${f.routine_name}`);
        console.log(f.routine_definition);
      }
    }

  } catch (err) {
    console.error('Failed to query triggers/functions:', err);
  } finally {
    await sql.end();
  }
}

run();
