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
    console.log('Inspecting all tables in public schema...');
    
    const tables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public';
    `;
    
    console.log('Tables found:', tables.map(t => t.tablename));

    for (const t of tables) {
      const tablename = t.tablename;
      // Get RLS status
      const rls = await sql`
        SELECT relname, relrowsecurity 
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = ${tablename};
      `;
      
      const policies = await sql`
        SELECT policyname, cmd 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = ${tablename};
      `;
      
      console.log(`Table: ${tablename}`);
      console.log(`  RLS Enabled: ${rls[0]?.relrowsecurity}`);
      console.log(`  Policies (${policies.length}):`, policies.map(p => `${p.policyname} (${p.cmd})`));
    }

  } catch (err) {
    console.error('Failed to inspect tables:', err);
  } finally {
    await sql.end();
  }
}

run();
