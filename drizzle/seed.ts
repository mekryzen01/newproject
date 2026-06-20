import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set in environment!');
  process.exit(1);
}

const sql = postgres(connectionString, { prepare: false });

const defaultSettings = {
  id: 'config-1',
  temple_name: 'วัดศรีสว่างธรรมาราม',
  abbr: 'TEMPLE OS',
  logo_icon: 'Compass',
  theme_color: 'amber',
  logo_url: ''
};

const initialRanks = [
  { id: 'r-1', name: 'เจ้าอาวาส (พระอุปัชฌาย์)', is_novice: false, person_type: 'monk', order: 1 },
  { id: 'r-2', name: 'รองเจ้าอาวาส', is_novice: false, person_type: 'monk', order: 2 },
  { id: 'r-3', name: 'พระผู้ช่วยเจ้าอาวาส', is_novice: false, person_type: 'monk', order: 3 },
  { id: 'r-4', name: 'พระเลขานุการ', is_novice: false, person_type: 'monk', order: 4 },
  { id: 'r-5', name: 'พระลูกวัด', is_novice: false, person_type: 'monk', order: 5 },
  { id: 'r-6', name: 'สามเณร', is_novice: true, person_type: 'novice', order: 6 },
  { id: 'r-7', name: 'ศิษย์วัด', is_novice: false, person_type: 'disciple', order: 7 }
];

const initialMenuItems = [
  { id: 'menu-1', name: 'แดชบอร์ดภาพรวม', href: '/dashboard', icon_name: 'Home', is_active: true, order: 1, parent_id: null },
  { id: 'menu-2', name: 'พระภิกษุและสามเณร', href: '/dashboard/monks', icon_name: 'Users', is_active: true, order: 2, parent_id: null },
  { id: 'menu-3', name: 'การเงินและบัญชีวัด', href: '#', icon_name: 'DollarSign', is_active: true, order: 3, parent_id: null },
  { id: 'menu-3-1', name: 'บัญชีรายรับ-รายจ่าย', href: '/dashboard/finance', icon_name: 'DollarSign', is_active: true, order: 1, parent_id: 'menu-3' },
  { id: 'menu-4', name: 'ตารางงานนิมนต์และศาสนพิธี', href: '/dashboard/schedule', icon_name: 'Calendar', is_active: true, order: 4, parent_id: null },
  { id: 'menu-5', name: 'คลังและครุภัณฑ์วัด', href: '#', icon_name: 'Package', is_active: true, order: 5, parent_id: null },
  { id: 'menu-5-1', name: 'ครุภัณฑ์และการยืม-คืน', href: '/dashboard/inventory', icon_name: 'Package', is_active: true, order: 1, parent_id: 'menu-5' },
  { id: 'menu-5-2', name: 'ทะเบียนฝากกระดูก / อัฐิ', href: '/dashboard/ashes', icon_name: 'Archive', is_active: true, order: 2, parent_id: 'menu-5' },
  { id: 'menu-6', name: 'จัดการเมนูระบบ', href: '/dashboard/menu-manager', icon_name: 'Activity', is_active: true, order: 6, parent_id: null },
  { id: 'menu-7', name: 'ตั้งค่าระบบวัด', href: '/dashboard/settings', icon_name: 'Settings', is_active: true, order: 7, parent_id: null },
  { id: 'menu-8', name: 'จัดการสมณศักดิ์/หน้าที่', href: '/dashboard/ranks', icon_name: 'Award', is_active: true, order: 8, parent_id: null },
  { id: 'menu-9', name: 'จัดการผู้ใช้งาน', href: '/dashboard/users', icon_name: 'User', is_active: true, order: 9, parent_id: null }
];

const initialUsers = [
  {
    id: '1b058a5c-43be-497f-8d94-d2e850b5550a',
    email: 'admin@temple.mail.go.th',
    full_name: 'มัคนายกผู้ดูแลระบบ',
    role: 'admin',
    phone: '081-234-5678',
    password: 'admin123',
    created_at: '2026-01-01'
  },
  {
    id: 'a1b0258d-71b5-4a57-b08e-73c88a87b5a1',
    email: 'editor@temple.mail.go.th',
    full_name: 'พระประสิทธิ์ วิปัสสโน (ผู้แก้ไข)',
    role: 'editor',
    phone: '082-345-6789',
    password: 'editor123',
    created_at: '2026-01-02'
  },
  {
    id: 'c234a98b-bd85-48b2-b8d4-53c89b251f2a',
    email: 'staff@temple.mail.go.th',
    full_name: 'นายสมชาย ใจดี (เจ้าหน้าที่วัด)',
    role: 'staff',
    phone: '083-456-7890',
    password: 'staff123',
    created_at: '2026-01-03'
  }
];

async function run() {
  try {
    console.log('Connecting to PostgreSQL database for seeding...');

    // 1. Seed settings
    console.log('Seeding settings table...');
    const existingSettings = await sql`SELECT id FROM public.settings WHERE id = 'config-1'`;
    if (existingSettings.length === 0) {
      await sql`
        INSERT INTO public.settings (id, temple_name, abbr, logo_icon, theme_color, logo_url)
        VALUES (${defaultSettings.id}, ${defaultSettings.temple_name}, ${defaultSettings.abbr}, ${defaultSettings.logo_icon}, ${defaultSettings.theme_color}, ${defaultSettings.logo_url})
      `;
      console.log('Seeded settings successfully.');
    } else {
      console.log('Settings already exist, skipping.');
    }

    // 2. Seed ranks
    console.log('Seeding ranks table...');
    for (const rank of initialRanks) {
      const existingRank = await sql`SELECT id FROM public.ranks WHERE id = ${rank.id}`;
      if (existingRank.length === 0) {
        await sql`
          INSERT INTO public.ranks (id, name, is_novice, person_type, "order")
          VALUES (${rank.id}, ${rank.name}, ${rank.is_novice}, ${rank.person_type}, ${rank.order})
        `;
      }
    }
    console.log('Ranks seeding completed.');

    // 3. Seed menu items
    console.log('Seeding menu_items table...');
    for (const menu of initialMenuItems) {
      const existingMenu = await sql`SELECT id FROM public.menu_items WHERE id = ${menu.id}`;
      if (existingMenu.length === 0) {
        await sql`
          INSERT INTO public.menu_items (id, name, href, icon_name, is_active, "order", parent_id)
          VALUES (${menu.id}, ${menu.name}, ${menu.href}, ${menu.icon_name}, ${menu.is_active}, ${menu.order}, ${menu.parent_id})
        `;
      }
    }
    console.log('Menu items seeding completed.');

    // 4. Seed system users (which will automatically register in Supabase Auth via trigger)
    console.log('Seeding default users table...');
    for (const u of initialUsers) {
      const existingUser = await sql`SELECT id FROM public.users WHERE email = ${u.email}`;
      if (existingUser.length === 0) {
        console.log(`Inserting user ${u.email}...`);
        await sql`
          INSERT INTO public.users (id, email, full_name, role, phone, password, created_at)
          VALUES (${u.id}, ${u.email}, ${u.full_name}, ${u.role}, ${u.phone}, ${u.password}, ${u.created_at})
        `;
      }
    }
    console.log('Users seeding completed.');

    console.log('Database seeding successfully finished!');

  } catch (err) {
    console.error('Error during database seeding:', err);
  } finally {
    await sql.end();
  }
}

run();
