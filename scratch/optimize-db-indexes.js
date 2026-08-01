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
    console.log('Connecting to database to optimize and create performance indexes...');

    // 1. Transactions indexes (finance queries)
    console.log('Creating transactions indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_monk_deleted ON transactions (monk_id) WHERE is_deleted = false;`;
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_date_deleted ON transactions (date DESC) WHERE is_deleted = false;`;

    // 2. Borrow records indexes (inventory queries & borrow logs)
    console.log('Creating borrow_records indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_borrow_records_item_deleted ON borrow_records (item_id) WHERE is_deleted = false;`;
    await sql`CREATE INDEX IF NOT EXISTS idx_borrow_records_status_deleted ON borrow_records (status) WHERE is_deleted = false;`;

    // 3. Inventory indexes
    console.log('Creating inventory indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_inventory_deleted ON inventory (is_deleted);`;

    // 4. Ashes indexes
    console.log('Creating ashes indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_ashes_deleted ON ashes (is_deleted);`;

    console.log('All performance indexes successfully verified or created!');
  } catch (err) {
    console.error('Failed to create indexes:', err);
  } finally {
    await sql.end();
  }
}

run();
