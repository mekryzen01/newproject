const postgres = require('postgres');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!connectionString) {
  console.error('No connection string found');
  process.exit(1);
}

const sql = postgres(connectionString);

async function run() {
  try {
    console.log('Creating monk_duty_types table if not exists...');
    
    await sql`
      CREATE TABLE IF NOT EXISTS monk_duty_types (
        id VARCHAR(256) PRIMARY KEY,
        title TEXT NOT NULL,
        icon TEXT NOT NULL DEFAULT '🧹',
        time_slot TEXT NOT NULL DEFAULT '06:00 น. - 07:30 น.',
        req_monks INTEGER NOT NULL DEFAULT 1,
        description TEXT,
        is_deleted BOOLEAN DEFAULT false,
        created_at TEXT NOT NULL
      );
    `;

    await sql`ALTER TABLE monk_duty_types DISABLE ROW LEVEL SECURITY;`;
    
    console.log('monk_duty_types table created successfully!');

    // Seed default initial duty types if table is empty
    const count = await sql`SELECT count(*) FROM monk_duty_types WHERE is_deleted = false;`;
    if (parseInt(count[0].count, 10) === 0) {
      console.log('Seeding initial temple duty types...');
      const initialTypes = [
        { id: 'duty-type-1', title: 'เวรดูแลทำความสะอาดพระอุโบสถ & วิหาร', icon: '🧹', time_slot: '06:00 น. - 07:30 น.', req_monks: 2, created_at: new Date().toISOString() },
        { id: 'duty-type-2', title: 'เวรจัดเตรียมภัตตาหาร & หอฉัน', icon: '🥣', time_slot: '07:30 น. - 08:30 น.', req_monks: 2, created_at: new Date().toISOString() },
        { id: 'duty-type-3', title: 'เวรดูแลตู้บริจาค & วัตถุมงคล', icon: '💎', time_slot: '09:00 น. - 16:00 น.', req_monks: 1, created_at: new Date().toISOString() },
        { id: 'duty-type-4', title: 'เวรทำความสะอาดลานวัด & ใบไม้', icon: '🍂', time_slot: '16:00 น. - 17:30 น.', req_monks: 3, created_at: new Date().toISOString() },
        { id: 'duty-type-5', title: 'เวรตรวจความเรียบร้อย & ปิดประตูวัด', icon: '🔑', time_slot: '20:00 น. - 21:00 น.', req_monks: 2, created_at: new Date().toISOString() }
      ];

      for (const t of initialTypes) {
        await sql`
          INSERT INTO monk_duty_types (id, title, icon, time_slot, req_monks, is_deleted, created_at)
          VALUES (${t.id}, ${t.title}, ${t.icon}, ${t.time_slot}, ${t.req_monks}, false, ${t.created_at})
          ON CONFLICT (id) DO NOTHING;
        `;
      }
      console.log('Seeded 5 initial duty types into database!');
    }
  } catch (err) {
    console.error('Failed to update monk_duty_types table:', err);
  } finally {
    await sql.end();
  }
}

run();
