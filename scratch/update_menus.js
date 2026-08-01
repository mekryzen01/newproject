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
    console.log('Fetching current menu items...');
    const menus = await sql`SELECT id, name, href, parent_id, is_active FROM public.menu_items ORDER BY "order"`;
    console.log('Current Menus:');
    menus.forEach(m => console.log(`  id: ${m.id} | name: "${m.name}" | href: "${m.href}" | parent: ${m.parent_id}`));

    console.log('\nDeleting temporary submenus menu-10-1 and menu-10-2...');
    await sql`DELETE FROM public.menu_items WHERE id IN ('menu-10-1', 'menu-10-2')`;

    console.log('\nUpdating/Upserting "ระบบจองศาลา" (menu-10) and "ทะเบียนจัดตั้งศพ" (menu-12) as top-level menus...');
    
    // Upsert menu-10
    await sql`
      INSERT INTO public.menu_items (id, name, href, icon_name, is_active, "order", parent_id, role_access, is_deleted)
      VALUES (
        'menu-10', 
        'ระบบจองศาลา', 
        '/dashboard/sala', 
        'Calendar', 
        true, 
        5, 
        null, 
        'admin,editor,staff,member',
        false
      )
      ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name, 
        href = EXCLUDED.href, 
        icon_name = EXCLUDED.icon_name, 
        "order" = EXCLUDED.order, 
        parent_id = EXCLUDED.parent_id,
        is_deleted = false
    `;

    // Upsert menu-12
    await sql`
      INSERT INTO public.menu_items (id, name, href, icon_name, is_active, "order", parent_id, role_access, is_deleted)
      VALUES (
        'menu-12', 
        'ทะเบียนจัดตั้งศพ', 
        '/dashboard/sala/funerals', 
        'Archive', 
        true, 
        6, 
        null, 
        'admin,editor,staff,member',
        false
      )
      ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name, 
        href = EXCLUDED.href, 
        icon_name = EXCLUDED.icon_name, 
        "order" = EXCLUDED.order, 
        parent_id = EXCLUDED.parent_id,
        is_deleted = false
    `;

    // Upsert menu-13
    await sql`
      INSERT INTO public.menu_items (id, name, href, icon_name, is_active, "order", parent_id, role_access, is_deleted)
      VALUES (
        'menu-13', 
        'รายงานและวิเคราะห์', 
        '/dashboard/reports', 
        'BookOpen', 
        true, 
        8, 
        null, 
        'admin,editor,staff',
        false
      )
      ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name, 
        href = EXCLUDED.href, 
        icon_name = EXCLUDED.icon_name, 
        "order" = EXCLUDED.order, 
        parent_id = EXCLUDED.parent_id,
        is_deleted = false
    `;

    // Shift other orders
    console.log('\nAdjusting orders of other menus...');
    await sql`UPDATE public.menu_items SET "order" = 7 WHERE id = 'menu-5'`;
    await sql`UPDATE public.menu_items SET "order" = 9 WHERE id = 'menu-6'`;
    await sql`UPDATE public.menu_items SET "order" = 10 WHERE id = 'menu-7'`;
    await sql`UPDATE public.menu_items SET "order" = 11 WHERE id = 'menu-8'`;
    await sql`UPDATE public.menu_items SET "order" = 12 WHERE id = 'menu-9'`;
    await sql`UPDATE public.menu_items SET "order" = 13 WHERE id = 'menu-11'`;

    console.log('Menus updated successfully!');
  } catch (err) {
    console.error('Error updating menus:', err);
  } finally {
    await sql.end();
  }
}

run();
