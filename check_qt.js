/* eslint-disable */
const postgres = require('postgres');
require('dotenv').config({ path: './.env' });
require('dotenv').config({ path: './.env.local' });

const sql = postgres(process.env.DATABASE_URL);

async function check() {
  try {
    // Check actual sala names
    const salas = await sql`SELECT id, short_name, full_name FROM public.salas ORDER BY id`;
    console.log('--- SALAS ---');
    salas.forEach(s => {
      const isSala1 = s.short_name?.includes('1') || s.full_name?.includes('1');
      console.log(`id: ${s.id} | short: "${s.short_name}" | full: "${s.full_name}" | isSala1: ${isSala1}`);
    });

    // Check cost items sala prices
    const items = await sql`SELECT name, amount FROM public.cost_items WHERE name ILIKE '%ศาลา%' ORDER BY sort_order`;
    console.log('\n--- SALA COST ITEMS ---');
    items.forEach(i => console.log(`  "${i.name}" → ${i.amount} บาท`));

    // Simulate getDbItemAmount logic
    console.log('\n--- SIMULATE getDbItemAmount ---');
    const costItems = await sql`SELECT * FROM public.cost_items ORDER BY sort_order`;
    const getDbItemAmount = (nameQuery, defaultAmount) => {
      const found = costItems.find(item =>
        item.name.replace(/\s+/g, '').toLowerCase().includes(nameQuery.replace(/\s+/g, '').toLowerCase())
      );
      console.log(`  query: "${nameQuery}" → found: "${found?.name}" → amount: ${found?.amount ?? defaultAmount}`);
      return found ? found.amount : defaultAmount;
    };

    getDbItemAmount('ค่าบำรุงศาลา ศ.1', 2500);
    getDbItemAmount('ค่าบำรุงศาลา ศ.2-4', 1500);

  } catch(e) { console.error(e); }
  finally { await sql.end(); }
}
check();
