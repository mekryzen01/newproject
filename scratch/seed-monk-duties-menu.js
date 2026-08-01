const postgres = require('postgres');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!connectionString) {
  console.error('No connection string found');
  process.exit(1);
}

const sql = postgres(connectionString);

async function run() {
  try {
    console.log('Ensuring monk-duties menu item exists...');
    
    // Check if parent menu for monks exists
    const monkParents = await sql`SELECT id FROM menu_items WHERE href = '/dashboard/monks' OR name LIKE '%พระภิกษุ%';`;
    const parentId = monkParents.length > 0 ? monkParents[0].id : null;

    const existing = await sql`SELECT id FROM menu_items WHERE href = '/dashboard/monk-duties';`;
    if (existing.length === 0) {
      await sql`
        INSERT INTO menu_items (id, name, href, icon_name, is_active, "order", parent_id, role_access, is_deleted)
        VALUES (
          'menu-monk-duties',
          'เวรปฏิบัติกิจสงฆ์ประจำวัน',
          '/dashboard/monk-duties',
          'Calendar',
          true,
          2,
          ${parentId},
          'admin,abbot,editor,staff,member',
          false
        );
      `;
      console.log('Inserted monk-duties menu item!');
    } else {
      console.log('monk-duties menu item already exists.');
    }
  } catch (err) {
    console.error('Failed to seed monk-duties menu:', err);
  } finally {
    await sql.end();
  }
}

run();
