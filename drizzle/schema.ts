import { pgTable, text, varchar, integer, boolean, jsonb, uuid } from "drizzle-orm/pg-core";

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
  fullName: text('full_name').notNull(),
  role: text('role').notNull(), // 'admin' | 'staff' | 'editor'
  phone: text('phone'),
  password: text('password'),
  createdAt: text('created_at').notNull(),
  isDeleted: boolean('is_deleted').notNull().default(false),
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
  certificateUrl: text('certificate_url'),
  idCardUrl: text('id_card_url'),
  fatherName: text('father_name'),
  motherName: text('mother_name'),
  emergencyContact: text('emergency_contact'),
  emergencyPhone: text('emergency_phone'),
  noviceOrdinationDate: text('novice_ordination_date'),
  domicileAddress: text('domicile_address'),
  isDeleted: boolean('is_deleted').notNull().default(false),
  lineUserId: text('line_user_id'),
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
  receiptImage: text('receipt_image'),
  status: text('status').notNull().default('completed'), // 'pending' | 'completed'
  isDeleted: boolean('is_deleted').notNull().default(false),
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
  location: text('location'), // สถานที่/ห้องเก็บของ
  isDeleted: boolean('is_deleted').notNull().default(false),
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
  createdBy: text('created_by'), // ID ของพระ/เจ้าหน้าที่ผู้ทำรายการให้ยืม
  returnedBy: text('returned_by'), // ID ของพระ/เจ้าหน้าที่ผู้รับของคืน
  isDeleted: boolean('is_deleted').notNull().default(false),
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
  status: text('status').default('deposited'), // 'deposited' | 'withdrawn'
  withdrawDate: text('withdraw_date'),
  withdrawBy: text('withdraw_by'),
  withdrawReason: text('withdraw_reason'),
  isDeleted: boolean('is_deleted').notNull().default(false),
});

export const menuItems = pgTable('menu_items', {
  id: varchar('id', { length: 256 }).primaryKey(),
  name: text('name').notNull(),
  href: text('href').notNull(),
  iconName: text('icon_name').notNull(),
  isActive: boolean('is_active').notNull(),
  order: integer('order').notNull(),
  parentId: varchar('parent_id', { length: 256 }),
  isDeleted: boolean('is_deleted').notNull().default(false),
  roleAccess: text('role_access').notNull().default('admin,editor,staff,member'),
});

export const settings = pgTable('settings', {
  id: varchar('id', { length: 256 }).primaryKey().default('config-1'),
  templeName: text('temple_name').notNull(),
  abbr: text('abbr').notNull(),
  logoIcon: text('logo_icon').notNull(),
  themeColor: text('theme_color').notNull(),
  logoUrl: text('logo_url'),
  lineNotifyToken: text('line_notify_token'),
  lineChannelAccessToken: text('line_channel_access_token'),
  lineGroupId: text('line_group_id'),
});

export const ranks = pgTable('ranks', {
  id: varchar('id', { length: 256 }).primaryKey(),
  name: text('name').notNull(),
  isNovice: boolean('is_novice').notNull().default(false),
  personType: text('person_type').notNull().default('monk'),
  order: integer('order').notNull(),
  isDeleted: boolean('is_deleted').notNull().default(false),
});

// ศาลา (Halls)
export const salas = pgTable('salas', {
  id: varchar('id', { length: 256 }).primaryKey(),
  shortName: text('short_name').notNull(),
  fullName: text('full_name'),
  capacity: integer('capacity'),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  isDeleted: boolean('is_deleted').notNull().default(false),
});

// การจองศาลา (Hall Bookings)
export const salaBookings = pgTable('sala_bookings', {
  id: varchar('id', { length: 256 }).primaryKey(),
  salaId: varchar('sala_id', { length: 256 }).notNull(),
  eventTitle: text('event_title').notNull(),
  eventType: text('event_type').notNull(), // 'funeral' | 'ceremony' | 'wedding' | 'other'
  bookerName: text('booker_name').notNull(),
  bookerPhone: text('booker_phone').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  numDays: integer('num_days').notNull(),
  status: text('status').notNull().default('confirmed'), // 'pending' | 'confirmed' | 'completed' | 'cancelled'
  notes: text('notes'),
  quotationId: varchar('quotation_id', { length: 256 }),
  createdAt: text('created_at').notNull(),
  isDeleted: boolean('is_deleted').notNull().default(false),
});

// ข้อมูลจัดตั้งศพ (Funeral Arrangements) — ตรงตามแบบฟอร์ม "ทะเบียนแจ้งขอตั้งบำเพ็ญกุศลศพ"
export const funeralArrangements = pgTable('funeral_arrangements', {
  id: varchar('id', { length: 256 }).primaryKey(),
  bookingId: varchar('booking_id', { length: 256 }).notNull(),

  // ๑. ประวัติผู้เสียชีวิต
  deceasedName: text('deceased_name').notNull(),
  deceasedAge: integer('deceased_age'),
  deceasedIdCard: text('deceased_id_card'),           // เลขประจำตัวประชาชน
  deceasedNationality: text('deceased_nationality'),   // สัญชาติ
  deceasedBirthdate: text('deceased_birthdate'),       // วันเกิด (วัน/เดือน/พ.ศ.)
  deceasedOccupation: text('deceased_occupation'),     // อาชีพ
  deceasedPhotoUrl: text('deceased_photo_url'),

  // ๒. รายละเอียดการเสียชีวิต
  deathDate: text('death_date'),                       // เสียชีวิตเมื่อวันที่
  deathTime: text('death_time'),                       // เวลาเสียชีวิต
  deathCause: text('death_cause'),                     // สาเหตุการเสียชีวิต
  deathLocation: text('death_location'),               // สถานที่เสียชีวิต

  // ๓. รายละเอียดผู้แจ้ง
  reporterName: text('reporter_name'),                 // ชื่อ-นามสกุลผู้แจ้ง
  reporterAge: integer('reporter_age'),                // อายุผู้แจ้ง
  reporterRelation: text('reporter_relation'),         // ความเกี่ยวข้องกับผู้เสียชีวิต
  reporterAddress: text('reporter_address'),           // ที่อยู่ บ้านเลขที่
  reporterMoo: text('reporter_moo'),                   // หมู่บ้าน
  reporterTambon: text('reporter_tambon'),             // ตำบล
  reporterAmphoe: text('reporter_amphoe'),             // อำเภอ
  reporterProvince: text('reporter_province'),         // จังหวัด
  reporterPhone: text('reporter_phone'),               // เบอร์โทรศัพท์ผู้แจ้ง

  // เอกสารสำคัญ
  deathCertificateNo: text('death_certificate_no'),
  deathCertificateUrl: text('death_certificate_url'),
  receiptNo: text('receipt_no'),
  receiptUrl: text('receipt_url'),

  // ข้อมูลฌาปนกิจ
  cremationDate: text('cremation_date'),
  cremationTime: text('cremation_time'),
  cremationLocation: text('cremation_location'),       // สถานที่ฌาปนกิจศพ
  chantNights: integer('chant_nights'),                // สวดอภิธรรม จำนวน...คืน
  coffinType: text('coffin_type'),

  // ลำดับทะเบียน (เฉพาะเจ้าหน้าที่)
  registerNo: text('register_no'),                     // ลำดับที่
  registerYear: integer('register_year'),              // ปี พ.ศ.

  // ข้อมูลเดิม
  undertakerName: text('undertaker_name'),
  undertakerPhone: text('undertaker_phone'),
  monkRepresentative: text('monk_representative'),
  notes: text('notes'),
  scannedDocumentUrl: text('scanned_document_url'),
  createdAt: text('created_at').notNull(),
  isDeleted: boolean('is_deleted').notNull().default(false),
});


// รายการค่าใช้จ่ายมาตรฐาน (Cost Catalog)
export const costItems = pgTable('cost_items', {
  id: varchar('id', { length: 256 }).primaryKey(),
  name: text('name').notNull(),
  amount: integer('amount').notNull(),
  category: text('category').notNull(), // 'required' | 'optional'
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  isDeleted: boolean('is_deleted').notNull().default(false),
});

// ใบเสนอราคา (Quotations)
export const quotations = pgTable('quotations', {
  id: varchar('id', { length: 256 }).primaryKey(),
  quotationNo: text('quotation_no').notNull(),
  bookingId: varchar('booking_id', { length: 256 }),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  customerAddress: text('customer_address'),
  eventType: text('event_type').notNull(),
  numDays: integer('num_days').notNull(),
  salaId: varchar('sala_id', { length: 256 }),
  items: jsonb('items').$type<QuotationLineItem[]>().notNull(),
  totalAmount: integer('total_amount').notNull(),
  status: text('status').notNull().default('draft'), // 'draft' | 'sent' | 'approved' | 'cancelled'
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  isDeleted: boolean('is_deleted').notNull().default(false),
});

// ตารางระบบล็อก (System Audit Logs)
export const systemLogs = pgTable('system_logs', {
  id: varchar('id', { length: 256 }).primaryKey(),
  userId: text('user_id').notNull(),
  userEmail: text('user_email').notNull(),
  userName: text('user_name').notNull(),
  action: text('action').notNull(), // 'create' | 'edit' | 'delete' | 'login'
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id'),
  details: text('details'),
  createdAt: text('created_at').notNull(),
});

export const ceremonyTemplates = pgTable('ceremony_templates', {
  id: varchar('id', { length: 256 }).primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  items: jsonb('items').notNull(), // { order: number, name: string, qty: number, notes: string }[]
  isDeleted: boolean('is_deleted').notNull().default(false),
});

export const ceremonyPreps = pgTable('ceremony_preps', {
  id: varchar('id', { length: 256 }).primaryKey(),
  name: text('name').notNull(),
  items: jsonb('items').notNull(), // { id: string, order: number, name: string, qty: number, prepared: boolean, collected: boolean, notes: string }[]
  isDeleted: boolean('is_deleted').notNull().default(false),
});

// Type for quotation line items stored in JSONB
export interface QuotationLineItem {
  cost_item_id: string;
  name: string;
  amount: number;
  quantity: number;
  subtotal: number;
}

export const financialCategories = pgTable('financial_categories', {
  id: varchar('id', { length: 256 }).primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'income' | 'expense'
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdAt: text('created_at').notNull(),
});

export const recurringExpenses = pgTable('recurring_expenses', {
  id: varchar('id', { length: 256 }).primaryKey(),
  title: text('title').notNull(),
  amount: integer('amount').notNull(),
  category: text('category').notNull(),
  payDay: integer('pay_day').notNull().default(1),
  isActive: boolean('is_active').notNull().default(true),
  description: text('description'),
  payerMonkId: varchar('payer_monk_id', { length: 256 }),
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdAt: text('created_at').notNull(),
});

export const monkDuties = pgTable('monk_duties', {
  id: varchar('id', { length: 256 }).primaryKey(),
  dutyTitle: text('duty_title').notNull(),
  date: text('date').notNull(),
  timeSlot: text('time_slot').notNull(),
  assignedMonkIds: text('assigned_monk_ids').notNull(),
  assignedMonkNames: text('assigned_monk_names').notNull(),
  status: text('status').notNull().default('pending'),
  notes: text('notes'),
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdAt: text('created_at').notNull(),
});

export const monkDutyTypes = pgTable('monk_duty_types', {
  id: varchar('id', { length: 256 }).primaryKey(),
  title: text('title').notNull(),
  icon: text('icon').notNull().default('🧹'),
  timeSlot: text('time_slot').notNull().default('06:00 น. - 07:30 น.'),
  reqMonks: integer('req_monks').notNull().default(1),
  description: text('description'),
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdAt: text('created_at').notNull(),
});
