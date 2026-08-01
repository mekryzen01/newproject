const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDoro() {
  // Find item "น้อง doro"
  const { data: items, error: itemError } = await supabase
    .from('inventory')
    .select('*')
    .ilike('name', '%doro%');

  if (itemError) {
    console.error('Error fetching inventory:', itemError);
    return;
  }

  console.log('Found inventory items matching "doro":', items.length);
  items.forEach(item => {
    console.log(`ID: ${item.id}, Name: ${item.name}, Total: ${item.total_qty}, Available: ${item.available_qty}, Deleted: ${item.is_deleted}`);
  });

  if (items.length > 0) {
    const itemId = items[0].id;
    // Find all borrow records for this item
    const { data: borrows, error: borrowError } = await supabase
      .from('borrow_records')
      .select('*')
      .eq('item_id', itemId);

    if (borrowError) {
      console.error('Error fetching borrows:', borrowError);
      return;
    }

    console.log('\nBorrows for this item:', borrows.length);
    borrows.forEach(b => {
      console.log(`ID: ${b.id}, Borrower: ${b.borrower_name}, Qty: ${b.borrow_qty}, Status: ${b.status}, Date: ${b.borrow_date}, Deleted: ${b.is_deleted}`);
    });
  }
}

checkDoro();
