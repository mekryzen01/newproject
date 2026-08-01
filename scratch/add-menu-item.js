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
    console.log('Checking if menu-14 already exists in menu_items table...');
    const existing = await sql`
      SELECT * FROM menu_items WHERE id = 'menu-14';
    `;
    
    if (existing.length > 0) {
      console.log('menu-14 already exists. Updating it...');
      await sql`
        UPDATE menu_items 
        SET name = 'ประวัติการใช้งานระบบ', 
            href = '/dashboard/system-logs', 
            icon_name = 'History', 
            role_access = 'admin', 
            "order" = 13,
            is_active = true
        WHERE id = 'menu-14';
      `;
      console.log('Successfully updated menu-14.');
    } else {
      console.log('Inserting menu-14...');
      await sql`
        INSERT INTO menu_items (id, name, href, icon_name, is_active, "order", parent_id, role_access)
        VALUES ('menu-14', 'ประวัติการใช้งานระบบ', '/dashboard/system-logs', 'History', true, 13, NULL, 'admin');
      `;
      console.log('Successfully inserted menu-14.');
    }

    // Shift menu-11 to order 14 if it has order 13
    await sql`
      UPDATE menu_items 
      SET "order" = 14 
      WHERE id = 'menu-11';
    `;
    console.log('Adjusted menu-11 order.');

  } catch (err) {
    console.error('Failed to add menu item:', err);
  } finally {
    await sql.end();
  }
}

run();
