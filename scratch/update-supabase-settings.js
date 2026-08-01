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
    console.log('Updating Supabase settings table with LINE keys...');
    
    await sql`
      UPDATE settings
      SET line_channel_access_token = 'UOI2WYzeTBIIhPuzPll0yJy4xYqdr0gyU8+DkcuyU6/B4T7WfPCoqcDqJcmiRKzuzRt9thJie9cYTjktQk/izYMHi1qxAvcI+SKb49RSAf1QUNknL3IoaSPgI4ZzIPhM3CB7TeBZYWeDXkYzRSD2TAdB04t89/1O/w1cDnyilFU='
      WHERE id = 'config-1';
    `;
    
    console.log('Successfully updated line_channel_access_token in Supabase!');
    
    const settings = await sql`SELECT id, line_channel_access_token, line_group_id FROM settings;`;
    console.log('Current settings in Supabase:', settings);

  } catch (err) {
    console.error('Failed to update Supabase settings:', err);
  } finally {
    await sql.end();
  }
}

run();
