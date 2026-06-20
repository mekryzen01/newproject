import { pgTable, text, varchar, integer, boolean, jsonb, uuid } from "drizzle-orm/pg-core";

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
  fullName: text('full_name').notNull(),
  role: text('role').notNull(), // 'admin' | 'staff' | 'editor'
  phone: text('phone'),
  password: text('password'),
  createdAt: text('created_at').notNull(),
});

export const monks = pgTable('monks', {
  id: varchar('id', { length: 256 }).primaryKey(),
  name: text('name').notNull(),
  chaya: text('chaya').notNull(),
  rank: text('rank').notNull(),
  ordinationDate: text('ordination_date').notNull(),
  phone: text('phone').notNull(),
  status: text('status').notNull(), // 'active' | 'retired' | 'away'
  imageUrl: text('image_url'),
  fatherName: text('father_name'),
  motherName: text('mother_name'),
  emergencyContact: text('emergency_contact'),
  emergencyPhone: text('emergency_phone'),
  noviceOrdinationDate: text('novice_ordination_date'),
  domicileAddress: text('domicile_address'),
});

export const transactions = pgTable('transactions', {
  id: varchar('id', { length: 256 }).primaryKey(),
  type: text('type').notNull(), // 'income' | 'expense'
  amount: integer('amount').notNull(),
  category: text('category').notNull(),
  date: text('date').notNull(),
  description: text('description').notNull(),
  donorName: text('donor_name'),
  receiptNo: text('receipt_no'),
});

export const events = pgTable('events', {
  id: varchar('id', { length: 256 }).primaryKey(),
  title: text('title').notNull(),
  date: text('date').notNull(),
  time: text('time').notNull(),
  location: text('location').notNull(),
  hostName: text('host_name').notNull(),
  monksNeeded: integer('monks_needed').notNull(),
  assignedMonks: jsonb('assigned_monks').$type<string[]>().notNull(),
  status: text('status').notNull(), // 'upcoming' | 'completed' | 'cancelled'
});

export const inventory = pgTable('inventory', {
  id: varchar('id', { length: 256 }).primaryKey(),
  name: text('name').notNull(),
  totalQty: integer('total_qty').notNull(),
  availableQty: integer('available_qty').notNull(),
  category: text('category').notNull(),
  condition: text('condition').notNull(), // 'excellent' | 'good' | 'fair' | 'damaged'
  imageUrl: text('image_url'),
});

export const borrowRecords = pgTable('borrow_records', {
  id: varchar('id', { length: 256 }).primaryKey(),
  itemId: varchar('item_id', { length: 256 }).notNull(),
  itemName: text('item_name').notNull(),
  borrowerName: text('borrower_name').notNull(),
  borrowerPhone: text('borrower_phone').notNull(),
  borrowQty: integer('borrow_qty').notNull(),
  borrowDate: text('borrow_date').notNull(),
  dueDate: text('due_date').notNull(),
  returnDate: text('return_date'),
  status: text('status').notNull(), // 'borrowed' | 'returned' | 'overdue'
});

export const ashes = pgTable('ashes', {
  id: varchar('id', { length: 256 }).primaryKey(),
  deceasedName: text('deceased_name').notNull(),
  deathDate: text('death_date').notNull(),
  nicheCode: text('niche_code').notNull(),
  relativeName: text('relative_name').notNull(),
  relativePhone: text('relative_phone').notNull(),
  depositDate: text('deposit_date').notNull(),
  depositedBy: text('deposited_by').notNull(), // พระ/เจ้าหน้าที่ผู้รับฝาก
  notes: text('notes'),
});

export const menuItems = pgTable('menu_items', {
  id: varchar('id', { length: 256 }).primaryKey(),
  name: text('name').notNull(),
  href: text('href').notNull(),
  iconName: text('icon_name').notNull(),
  isActive: boolean('is_active').notNull(),
  order: integer('order').notNull(),
  parentId: varchar('parent_id', { length: 256 }),
});

export const settings = pgTable('settings', {
  id: varchar('id', { length: 256 }).primaryKey().default('config-1'),
  templeName: text('temple_name').notNull(),
  abbr: text('abbr').notNull(),
  logoIcon: text('logo_icon').notNull(),
  themeColor: text('theme_color').notNull(),
  logoUrl: text('logo_url'),
});

export const ranks = pgTable('ranks', {
  id: varchar('id', { length: 256 }).primaryKey(),
  name: text('name').notNull(),
  isNovice: boolean('is_novice').notNull().default(false),
  personType: text('person_type').notNull().default('monk'),
  order: integer('order').notNull(),
});


