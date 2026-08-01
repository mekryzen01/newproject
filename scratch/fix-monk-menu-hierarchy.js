const postgres = require('postgres');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
const sql = postgres(connectionString);

async function run() {
  try {
    console.log('Fixing Monk menu hierarchy in menu_items table...');

    // 1. Update Parent Menu "พระภิกษุและสามเณร" to have href: '#'
    await sql`
      UPDATE menu_items 
      SET href = '#', role_access = 'admin,abbot,editor,staff,member'
      WHERE id = 'menu-2';
    `;

    // 2. Insert or Update Child 1 "ทะเบียนพระภิกษุและสามเณร" -> /dashboard/monks
    await sql`
      INSERT INTO menu_items (id, name, href, icon_name, is_active, "order", parent_id, is_deleted, role_access)
      VALUES ('menu-monks-list', 'ทะเบียนพระภิกษุและสามเณร', '/dashboard/monks', 'Users', true, 1, 'menu-2', false, 'admin,abbot,editor,staff,member')
      ON CONFLICT (id) DO UPDATE SET
        name = 'ทะเบียนพระภิกษุและสามเณร',
        href = '/dashboard/monks',
        parent_id = 'menu-2',
        "order" = 1,
        is_deleted = false,
        role_access = 'admin,abbot,editor,staff,member';
    `;

    // 3. Ensure Child 2 "เวรปฏิบัติกิจสงฆ์ประจำวัน" -> /dashboard/monk-duties
    await sql`
      UPDATE menu_items
      SET "order" = 2, parent_id = 'menu-2', role_access = 'admin,abbot,editor,staff,member'
      WHERE id = 'menu-monk-duties';
    `;

    console.log('Monk menu hierarchy fixed successfully!');
  } catch (err) {
    console.error('Failed to update menu items:', err);
  } finally {
    await sql.end();
  }
}

run();
