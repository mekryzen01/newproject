/* eslint-disable */
const postgres = require('postgres');
require('dotenv').config({ path: './.env' });
require('dotenv').config({ path: './.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set in environment!');
  process.exit(1);
}

const sql = postgres(connectionString);

async function run() {
  try {
    console.log('Creating table public.funeral_arrangements...');
    await sql`
      CREATE TABLE IF NOT EXISTS public.funeral_arrangements (
        id varchar(256) PRIMARY KEY,
        booking_id varchar(256) NOT NULL,
        deceased_name text NOT NULL,
        deceased_age integer,
        death_certificate_no text,
        death_certificate_url text,
        receipt_no text,
        receipt_url text,
        cremation_date text,
        cremation_time text,
        coffin_type text,
        undertaker_name text,
        undertaker_phone text,
        monk_representative text,
        notes text,
        created_at text NOT NULL,
        is_deleted boolean NOT NULL DEFAULT false
      )
    `;
    console.log('Table created successfully!');
  } catch (err) {
    console.error('Error creating table:', err);
  } finally {
    await sql.end();
  }
}

run();
