const postgres = require('postgres');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
const sql = postgres(connectionString);

async function run() {
  try {
    const rows = await sql`SELECT * FROM menu_items;`;
    console.log('MENU ITEMS IN DATABASE:');
    console.log(rows);
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}

run();
