const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCeremony() {
  console.log('--- Logging in user ---');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@temple.mail.go.th',
    password: 'admin123'
  });

  if (authError) {
    console.error('Login failed:', authError);
    return;
  }
  
  console.log('Login successful for:', authData.user.email);

  console.log('--- Testing ceremony_templates ---');
  const { data: templates, error: errT } = await supabase
    .from('ceremony_templates')
    .select('*');

  if (errT) {
    console.error('Error fetching ceremony_templates:', errT);
  } else {
    console.log('Templates found:', templates);
  }

  console.log('--- Testing ceremony_preps ---');
  const { data: preps, error: errP } = await supabase
    .from('ceremony_preps')
    .select('*');

  if (errP) {
    console.error('Error fetching ceremony_preps:', errP);
  } else {
    console.log('Preps found:', preps);
  }

  console.log('--- Testing insert into ceremony_preps ---');
  const testId = `test-${Date.now()}`;
  const { data: inserted, error: errI } = await supabase
    .from('ceremony_preps')
    .insert({ id: testId, name: 'Test ceremony prep', items: [] })
    .select();

  if (errI) {
    console.error('Error inserting into ceremony_preps:', errI);
  } else {
    console.log('Successfully inserted:', inserted);
    
    console.log('--- Testing delete from ceremony_preps ---');
    const { error: errD } = await supabase
      .from('ceremony_preps')
      .delete()
      .eq('id', testId);
      
    if (errD) {
      console.error('Error deleting from ceremony_preps:', errD);
    } else {
      console.log('Successfully deleted test row');
    }
  }
}

checkCeremony();
