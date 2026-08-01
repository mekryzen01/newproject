const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixInventory() {
  console.log('Starting inventory sync...');

  // 1. Get all active borrow records
  const { data: borrows, error: borrowError } = await supabase
    .from('borrow_records')
    .select('*')
    .eq('is_deleted', false)
    .neq('status', 'returned');

  if (borrowError) {
    console.error('Error fetching borrows:', borrowError);
    return;
  }

  // Group borrows by item_id
  const borrowMap = new Map();
  borrows.forEach(b => {
    const itemId = b.item_id;
    const current = borrowMap.get(itemId) || 0;
    borrowMap.set(itemId, current + b.borrow_qty);
  });

  // 2. Get all inventory items
  const { data: items, error: itemError } = await supabase
    .from('inventory')
    .select('*')
    .eq('is_deleted', false);

  if (itemError) {
    console.error('Error fetching inventory:', itemError);
    return;
  }

  console.log(`Processing ${items.length} items...`);

  for (const item of items) {
    const activeBorrowed = borrowMap.get(item.id) || 0;
    const correctAvailable = Math.max(0, item.total_qty - activeBorrowed);

    if (item.available_qty !== correctAvailable) {
      console.log(`Mismatch found for "${item.name}": DB Available=${item.available_qty}, Actual Available=${correctAvailable} (Total=${item.total_qty}, Borrowed=${activeBorrowed})`);
      
      // Update item in database
      const { error: updateError } = await supabase
        .from('inventory')
        .update({ available_qty: correctAvailable })
        .eq('id', item.id);

      if (updateError) {
        console.error(`Failed to update item "${item.name}":`, updateError);
      } else {
        console.log(`  Successfully synced "${item.name}" to Available=${correctAvailable}`);
      }
    }
  }

  console.log('Inventory sync complete!');
}

fixInventory();
