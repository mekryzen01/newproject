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
    console.log('Creating financial_categories table...');
    await sql`
      CREATE TABLE IF NOT EXISTS financial_categories (
        id VARCHAR(256) PRIMARY KEY,
        name TEXT NOT NULL,
        type VARCHAR(50) NOT NULL, -- 'income' | 'expense'
        is_deleted BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `;
    console.log('Created financial_categories table successfully!');

    console.log('Creating recurring_expenses table...');
    await sql`
      CREATE TABLE IF NOT EXISTS recurring_expenses (
        id VARCHAR(256) PRIMARY KEY,
        title TEXT NOT NULL,
        amount INTEGER NOT NULL,
        category TEXT NOT NULL,
        pay_day INTEGER NOT NULL DEFAULT 1,
        is_active BOOLEAN NOT NULL DEFAULT true,
        description TEXT,
        is_deleted BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `;
    console.log('Created recurring_expenses table successfully!');

    // Populate default income categories
    const countInc = await sql`SELECT count(*) FROM financial_categories WHERE type = 'income';`;
    if (parseInt(countInc[0].count) === 0) {
      console.log('Seeding default income categories...');
      const defaultIncome = [
        'ตู้บริจาค - บูรณะพัฒนาวัด',
        'ตู้บริจาค - ค่าน้ำและค่าไฟฟ้าวัด',
        'ตู้บริจาค - เพื่อการศึกษาพระสามเณร',
        'ตู้บริจาค - ภัตตาหารและน้ำปานะ',
        'ตู้บริจาค - ปล่อยชีวิตสัตว์และไถ่ชีวิต',
        'เงินบริจาคทำบุญทั่วไป',
        'เงินกฐิน / ผ้าป่าสามัคคี',
        'บริจาคสร้างพระประธาน / โบสถ์วิหาร'
      ];
      
      for (const name of defaultIncome) {
        const id = `cat-inc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await sql`
          INSERT INTO financial_categories (id, name, type) 
          VALUES (${id}, ${name}, 'income');
        `;
      }
      console.log('Seeded income categories successfully!');
    }

    // Populate default expense categories
    const countExp = await sql`SELECT count(*) FROM financial_categories WHERE type = 'expense';`;
    if (parseInt(countExp[0].count) === 0) {
      console.log('Seeding default expense categories...');
      const defaultExpense = [
        'ค่าสาธารณูปโภค (น้ำ/ไฟ/เน็ต)',
        'ค่าจ้างบุคลากรและค่าแรง',
        'ค่าซ่อมบำรุงและก่อสร้าง',
        'ค่าเครื่องครัวและภัตตาหาร',
        'ค่าจัดงานพิธีการศาสนา',
        'ค่าใช้จ่ายทั่วไปของวัด'
      ];
      
      for (const name of defaultExpense) {
        const id = `cat-exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await sql`
          INSERT INTO financial_categories (id, name, type) 
          VALUES (${id}, ${name}, 'expense');
        `;
      }
      console.log('Seeded expense categories successfully!');
    }

  } catch (err) {
    console.error('Failed to setup database tables:', err);
  } finally {
    await sql.end();
  }
}

run();
