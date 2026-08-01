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
    console.log('Connecting to database and creating ceremony tables...');
    
    await sql`
      CREATE TABLE IF NOT EXISTS ceremony_templates (
        id varchar(256) PRIMARY KEY NOT NULL,
        name text NOT NULL,
        description text,
        items jsonb NOT NULL,
        is_deleted boolean DEFAULT false NOT NULL
      );
    `;
    console.log('Created ceremony_templates table if not exists.');

    await sql`
      CREATE TABLE IF NOT EXISTS ceremony_preps (
        id varchar(256) PRIMARY KEY NOT NULL,
        name text NOT NULL,
        items jsonb NOT NULL,
        is_deleted boolean DEFAULT false NOT NULL
      );
    `;
    console.log('Created ceremony_preps table if not exists.');

    console.log('Enabling Row Level Security and setting up policies...');
    
    // Enable RLS
    await sql`ALTER TABLE public.ceremony_templates ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE public.ceremony_preps ENABLE ROW LEVEL SECURITY;`;

    // Drop existing policies
    await sql`DROP POLICY IF EXISTS "Allow select for authenticated" ON public.ceremony_templates;`;
    await sql`DROP POLICY IF EXISTS "Allow insert for authenticated" ON public.ceremony_templates;`;
    await sql`DROP POLICY IF EXISTS "Allow update for authenticated" ON public.ceremony_templates;`;
    await sql`DROP POLICY IF EXISTS "Allow delete for authenticated" ON public.ceremony_templates;`;

    await sql`DROP POLICY IF EXISTS "Allow select for authenticated" ON public.ceremony_preps;`;
    await sql`DROP POLICY IF EXISTS "Allow insert for authenticated" ON public.ceremony_preps;`;
    await sql`DROP POLICY IF EXISTS "Allow update for authenticated" ON public.ceremony_preps;`;
    await sql`DROP POLICY IF EXISTS "Allow delete for authenticated" ON public.ceremony_preps;`;

    // Create new policies for authenticated
    await sql`CREATE POLICY "Allow select for authenticated" ON public.ceremony_templates FOR SELECT TO authenticated USING (true);`;
    await sql`CREATE POLICY "Allow insert for authenticated" ON public.ceremony_templates FOR INSERT TO authenticated WITH CHECK (true);`;
    await sql`CREATE POLICY "Allow update for authenticated" ON public.ceremony_templates FOR UPDATE TO authenticated USING (true) WITH CHECK (true);`;
    await sql`CREATE POLICY "Allow delete for authenticated" ON public.ceremony_templates FOR DELETE TO authenticated USING (true);`;

    await sql`CREATE POLICY "Allow select for authenticated" ON public.ceremony_preps FOR SELECT TO authenticated USING (true);`;
    await sql`CREATE POLICY "Allow insert for authenticated" ON public.ceremony_preps FOR INSERT TO authenticated WITH CHECK (true);`;
    await sql`CREATE POLICY "Allow update for authenticated" ON public.ceremony_preps FOR UPDATE TO authenticated USING (true) WITH CHECK (true);`;
    await sql`CREATE POLICY "Allow delete for authenticated" ON public.ceremony_preps FOR DELETE TO authenticated USING (true);`;

    console.log('Successfully completed ceremony tables database migration & RLS setup.');
  } catch (err) {
    console.error('Failed to run migration:', err);
  } finally {
    await sql.end();
  }
}

run();
