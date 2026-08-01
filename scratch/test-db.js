const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUser() {
  // Query all users
  const { data: users, error } = await supabase
    .from('users')
    .select('*');

  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  console.log('Total users:', users.length);
  users.forEach(u => {
    console.log(`ID: ${u.id}, Email: ${u.email}, Name: ${u.full_name}, Role: ${u.role}, MonkID: ${u.monk_id}, Phone: ${u.phone}`);
  });

  // Query monks
  const { data: monks, error: errorMonks } = await supabase
    .from('monks')
    .select('*');

  if (errorMonks) {
    console.error('Error fetching monks:', errorMonks);
    return;
  }

  console.log('\nTotal monks:', monks.length);
  monks.forEach(m => {
    console.log(`ID: ${m.id}, Name: ${m.name}, Phone: ${m.phone}`);
  });
}

checkUser();
