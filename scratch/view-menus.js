const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function viewMenus() {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('is_deleted', false)
    .order('order', { ascending: true });

  if (error) {
    console.error('Error fetching menus:', error);
    return;
  }

  console.log('Current Menu Items:');
  data.forEach(m => {
    console.log(`ID: ${m.id}, Name: ${m.name}, Href: ${m.href}, Icon: ${m.icon_name}, Parent: ${m.parent_id || 'None'}, Order: ${m.order}, Active: ${m.is_active}, RoleAccess: ${m.role_access}`);
  });
}

viewMenus();
