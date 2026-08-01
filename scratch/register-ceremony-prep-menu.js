const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function registerMenu() {
  console.log('Shifting menu orders to insert "ระบบจัดเตรียมพิธีการ" at order 5...');

  // 1. Fetch all active menu items
  const { data: menus, error: fetchError } = await supabase
    .from('menu_items')
    .select('*')
    .eq('is_deleted', false)
    .order('order', { ascending: true });

  if (fetchError) {
    console.error('Failed to fetch menus:', fetchError);
    return;
  }

  // 2. Filter menu items with order >= 5 (excluding menu-14 itself if already added)
  const itemsToShift = menus.filter(m => m.order >= 5 && m.id !== 'menu-14');

  console.log(`Shifting ${itemsToShift.length} menu items...`);
  for (const item of itemsToShift) {
    const newOrder = item.order + 1;
    const { error: updateError } = await supabase
      .from('menu_items')
      .update({ order: newOrder })
      .eq('id', item.id);

    if (updateError) {
      console.error(`Failed to shift item ${item.name}:`, updateError);
    } else {
      console.log(`Shifted "${item.name}" from ${item.order} to ${newOrder}`);
    }
  }

  // 3. Upsert menu-14 at order 5
  const menuItem = {
    id: 'menu-14',
    name: 'ระบบจัดเตรียมพิธีการ',
    href: '/dashboard/ceremony-prep',
    icon_name: 'ClipboardList',
    is_active: true,
    order: 5,
    parent_id: null,
    role_access: 'admin,editor,staff,member',
    is_deleted: false
  };

  const { data: upsertData, error: upsertError } = await supabase
    .from('menu_items')
    .upsert(menuItem)
    .select();

  if (upsertError) {
    console.error('Failed to register menu item:', upsertError);
  } else {
    console.log('Successfully registered menu-14 at order 5:', upsertData);
  }
}

registerMenu();
