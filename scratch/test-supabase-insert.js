const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://klaybalbdnafkomqeduy.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseAnonKey) {
  console.error('No Supabase Anon Key found!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const testId = '00000000-0000-0000-0000-000000000000';
  const testEmail = 'test-insert@temple.com';
  
  console.log('Testing raw insert with camelCase fullName...');
  const { data: d1, error: e1 } = await supabase.from('users').upsert({
    id: testId,
    email: testEmail,
    fullName: 'Test User 1',
    role: 'member',
    is_deleted: false,
    created_at: new Date().toISOString()
  });
  console.log('Result 1 (fullName):', d1, 'Error 1:', e1);

  console.log('Testing raw insert with snake_case full_name...');
  const { data: d2, error: e2 } = await supabase.from('users').upsert({
    id: testId,
    email: testEmail,
    full_name: 'Test User 2',
    role: 'member',
    is_deleted: false,
    created_at: new Date().toISOString()
  }).select();
  console.log('Result 2 (full_name):', d2, 'Error 2:', e2);

  // Clean up
  await supabase.from('users').delete().eq('id', testId);
}

run();
