import { createClient } from '@supabase/supabase-js';

// Types
export interface Monk {
  id: string;
  name: string;
  chaya: string;
  rank: string;
  ordination_date: string;
  phone: string;
  status: 'active' | 'retired' | 'away'; // 'active' = อยู่จำพรรษา, 'retired' = ลาสิกขา, 'away' = จาริก/ไปวัดอื่น
  image_url?: string;
  certificate_url?: string;
  id_card_url?: string;
  father_name?: string;
  mother_name?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  novice_ordination_date?: string;
  domicile_address?: string;
  line_user_id?: string;
}

export interface MonkDuty {
  id: string;
  duty_title: string;
  date: string;
  time_slot: string;
  assigned_monk_ids: string;
  assigned_monk_names: string;
  status: 'pending' | 'completed' | 'swapped';
  notes?: string;
  created_at: string;
}

export interface MonkDutyType {
  id: string;
  title: string;
  icon: string;
  time_slot: string;
  req_monks: number;
  description?: string;
  created_at?: string;
}

export interface MonkRank {
  id: string;
  name: string;
  is_novice: boolean;
  person_type: 'monk' | 'novice' | 'disciple';
  order: number;
}

import { Role } from './permissions';

export interface SystemUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  phone?: string;
  password?: string;
  created_at: string;
  monk_id?: string; // เชื่อมต่อบัญชีกับตารางรายชื่อพระภิกษุสามเณร
}

export interface FinancialTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  description: string;
  donor_name?: string; // สำหรับรายรับ
  receipt_no?: string;
  monk_id?: string; // สำหรับรายรับ-รายจ่าย รายบุคคล
  receipt_image?: string;
  status?: 'pending' | 'completed';
}

export interface TempleEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  host_name: string;
  monks_needed: number;
  assigned_monks: string[]; // ids of monks
  status: 'upcoming' | 'completed' | 'cancelled';
}

export interface InventoryItem {
  id: string;
  name: string;
  total_qty: number;
  available_qty: number;
  category: string;
  condition: 'excellent' | 'good' | 'fair' | 'damaged';
  image_url?: string;
  location?: string; // สถานที่/ห้องเก็บของ
}


export interface BorrowRecord {
  id: string;
  item_id: string;
  item_name: string;
  borrower_name: string;
  borrower_phone: string;
  borrow_qty: number;
  borrow_date: string;
  due_date: string;
  return_date: string | null;
  status: 'borrowed' | 'returned' | 'overdue';
  created_by?: string | null;
  returned_by?: string | null;
}

export interface DBCeremonyTemplate {
  id: string;
  name: string;
  description?: string | null;
  items: any; // { order: number, name: string, qty: number, notes: string }[]
}

export interface DBCeremonyPrep {
  id: string;
  name: string;
  items: any; // { id: string, order: number, name: string, qty: number, prepared: boolean, collected: boolean, notes: string }[]
}

export interface AshesRecord {
  id: string;
  deceased_name: string; // ชื่อผู้วายชนม์
  death_date: string; // วันที่เสียชีวิต
  niche_code: string; // ตู้ที่/ล็อกที่
  relative_name: string; // ชื่อญาติผู้ดูแล
  relative_phone: string; // เบอร์โทรติดต่อญาติ
  deposit_date: string; // วันที่นำมาประดิษฐาน
  deposited_by: string; // พระ/เจ้าหน้าที่ผู้รับฝาก
  notes?: string;
  status?: 'deposited' | 'withdrawn'; // สถานะ: 'deposited' = ฝากอยู่, 'withdrawn' = ถอนออกแล้ว
  withdraw_date?: string; // วันที่ถอนกระดูก
  withdraw_by?: string; // ชื่อญาติผู้ทำเรื่องถอน
  withdraw_reason?: string; // เหตุผลในการถอน
}

export interface Sala {
  id: string;
  short_name: string;
  full_name?: string;
  capacity?: number;
  description?: string;
  is_active: boolean;
}

export interface SalaBooking {
  id: string;
  sala_id: string;
  event_title: string;
  event_type: 'funeral' | 'ceremony' | 'wedding' | 'other';
  booker_name: string;
  booker_phone: string;
  start_date: string;
  end_date: string;
  num_days: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  quotation_id?: string;
  created_at: string;
}

export interface CostItem {
  id: string;
  name: string;
  amount: number;
  category: 'required' | 'optional';
  description?: string;
  is_active: boolean;
  sort_order: number;
}

export interface QuotationLineItem {
  cost_item_id: string;
  name: string;
  amount: number;
  quantity: number;
  subtotal: number;
}

export interface Quotation {
  id: string;
  quotation_no: string;
  booking_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  event_type: string;
  num_days: number;
  sala_id?: string;
  items: QuotationLineItem[];
  total_amount: number;
  status: 'draft' | 'sent' | 'approved' | 'cancelled';
  notes?: string;
  created_at: string;
  temple_name?: string;
  temple_address?: string;
  quote_type?: 'normal' | 'package';
  package_rice_box_option?: string;
  package_extra_night_rate?: number;
  monks_count_funeral?: number;
  water_packs_count?: number;
  ice_bags_count?: number;
}

export interface MenuItem {
  id: string;
  name: string;
  href: string;
  iconName: string;
  isActive: boolean;
  order: number;
  parentId?: string | null;
  roleAccess?: string; // e.g. 'admin,editor,staff,member'
}

export interface TempleSettings {
  templeName: string;
  abbr: string;
  logoIcon: string;
  themeColor: 'amber' | 'emerald' | 'indigo' | 'rose' | 'slate';
  logoUrl?: string;
  lineNotifyToken?: string;
  lineChannelAccessToken?: string;
  lineGroupId?: string;
  address?: string;
  googleMapUrl?: string;
}

export interface FuneralArrangement {
  id: string;
  booking_id: string;

  // ๑. ประวัติผู้เสียชีวิต
  deceased_name: string;
  deceased_age?: number;
  deceased_id_card?: string;
  deceased_nationality?: string;
  deceased_birthdate?: string;
  deceased_occupation?: string;
  deceased_photo_url?: string;

  // ๒. รายละเอียดการเสียชีวิต
  death_date?: string;
  death_time?: string;
  death_cause?: string;
  death_location?: string;

  // ๓. รายละเอียดผู้แจ้ง
  reporter_name?: string;
  reporter_age?: number;
  reporter_relation?: string;
  reporter_address?: string;
  reporter_moo?: string;
  reporter_tambon?: string;
  reporter_amphoe?: string;
  reporter_province?: string;
  reporter_phone?: string;

  // เอกสารสำคัญ
  death_certificate_no?: string;
  death_certificate_url?: string;
  receipt_no?: string;
  receipt_url?: string;

  // ข้อมูลฌาปนกิจ
  cremation_date?: string;
  cremation_time?: string;
  cremation_location?: string;
  chant_nights?: number;
  coffin_type?: string;

  // ลำดับทะเบียน
  register_no?: string;
  register_year?: number;

  // ข้อมูลเดิม
  undertaker_name?: string;
  undertaker_phone?: string;
  monk_representative?: string;
  notes?: string;
  scanned_document_url?: string;
  created_at: string;
}


// Supabase Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://klaybalbdnafkomqeduy.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auto-sync session from temple_session to supabase client on browser load
if (typeof window !== 'undefined') {
  const syncSession = async () => {
    try {
      const sessionStr = localStorage.getItem('temple_session');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        if (session && session.access_token && session.refresh_token) {
          const { data } = await supabase.auth.getSession();
          if (!data.session || data.session.access_token !== session.access_token) {
            await supabase.auth.setSession({
              access_token: session.access_token,
              refresh_token: session.refresh_token
            });
            console.log('Synced supabase client session successfully');
          }
        }
      }
    } catch (e) {
      console.error('Failed to sync supabase session:', e);
    }
  };
  
  syncSession();

  // Listen for auth state changes (e.g. token refresh) and sync back to temple_session
  supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      const existingStr = localStorage.getItem('temple_session');
      if (existingStr) {
        try {
          const existing = JSON.parse(existingStr);
          if (existing.access_token !== session.access_token) {
            // Keep existing user metadata (role, name, etc.)
            localStorage.setItem('temple_session', JSON.stringify({
              ...existing,
              access_token: session.access_token,
              refresh_token: session.refresh_token
            }));
            console.log('Updated temple_session with refreshed supabase session');
          }
        } catch (e) {
          localStorage.setItem('temple_session', JSON.stringify(session));
        }
      } else {
        localStorage.setItem('temple_session', JSON.stringify(session));
      }
    } else if (event === 'SIGNED_OUT') {
      localStorage.removeItem('temple_session');
    }
  });
}


// DB Interfaces
export interface FinancialCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  is_deleted?: boolean;
  created_at?: string;
}

export interface RecurringExpense {
  id: string;
  title: string;
  amount: number;
  category: string;
  pay_day: number;
  is_active: boolean;
  description?: string | null;
  payer_monk_id?: string | null;
  is_deleted?: boolean;
  created_at?: string;
}

export interface SystemLog {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  action: 'create' | 'edit' | 'delete' | 'login';
  entity_type: string;
  entity_id: string;
  details?: string | null;
  created_at: string;
}

export interface DBMenuItem {
  id: string;
  name: string;
  href: string;
  icon_name: string;
  is_active: boolean;
  order: number;
  parent_id?: string | null;
  role_access?: string;
}

export interface DBTempleSettings {
  temple_name: string;
  abbr: string;
  logo_icon: string;
  theme_color: 'amber' | 'emerald' | 'indigo' | 'rose' | 'slate';
  logo_url?: string;
  line_notify_token?: string;
  line_channel_access_token?: string;
  line_group_id?: string;
}

export interface DBSystemUser {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  phone?: string;
  password?: string;
  created_at: string;
  monk_id?: string;
}

// Helpers for mappings
const mapMenuItemFromDB = (m: DBMenuItem): MenuItem => ({
  id: m.id,
  name: m.name,
  href: m.href,
  iconName: m.icon_name,
  isActive: m.is_active,
  order: m.order,
  parentId: m.parent_id,
  roleAccess: m.role_access || 'admin,editor,staff,member'
});

const mapMenuItemToDB = (m: MenuItem): DBMenuItem => ({
  id: m.id,
  name: m.name,
  href: m.href,
  icon_name: m.iconName,
  is_active: m.isActive,
  order: m.order,
  parent_id: m.parentId,
  role_access: m.roleAccess || 'admin,editor,staff,member'
});

const mapSettingsFromDB = (s: any): TempleSettings => ({
  templeName: s.temple_name,
  abbr: s.abbr,
  logoIcon: s.logo_icon,
  themeColor: s.theme_color,
  logoUrl: s.logo_url,
  lineNotifyToken: s.line_notify_token,
  lineChannelAccessToken: s.line_channel_access_token,
  lineGroupId: s.line_group_id,
  address: s.address,
  googleMapUrl: s.google_map_url
});

const mapSettingsToDB = (s: TempleSettings): any => ({
  temple_name: s.templeName,
  abbr: s.abbr,
  logo_icon: s.logoIcon,
  theme_color: s.themeColor,
  logo_url: s.logoUrl,
  line_notify_token: s.lineNotifyToken,
  line_channel_access_token: s.lineChannelAccessToken,
  line_group_id: s.lineGroupId,
  address: s.address,
  google_map_url: s.googleMapUrl
});

const mapSystemUserFromDB = (u: DBSystemUser): SystemUser => ({
  id: u.id,
  email: u.email,
  fullName: u.full_name,
  role: u.role,
  phone: u.phone,
  password: u.password,
  created_at: u.created_at,
  monk_id: u.monk_id
});

const mapSystemUserToDB = (u: SystemUser): DBSystemUser => ({
  id: u.id,
  email: u.email,
  full_name: u.fullName,
  role: u.role,
  phone: u.phone,
  password: u.password,
  created_at: u.created_at,
  monk_id: u.monk_id
});

// Default Menu Items for Reset Function
const DEFAULT_MENU_ITEMS: MenuItem[] = [
  { id: 'menu-1', name: 'แดชบอร์ดภาพรวม', href: '/dashboard', iconName: 'Home', isActive: true, order: 1, parentId: null, roleAccess: 'admin,editor,staff,member' },
  { id: 'menu-2', name: 'พระภิกษุและสามเณร', href: '/dashboard/monks', iconName: 'Users', isActive: true, order: 2, parentId: null, roleAccess: 'admin,editor,staff,member' },
  { id: 'menu-3', name: 'การเงินและบัญชีวัด', href: '#', iconName: 'DollarSign', isActive: true, order: 3, parentId: null, roleAccess: 'admin,editor,staff' },
  { id: 'menu-3-1', name: 'บัญชีรายรับ-รายจ่าย', href: '/dashboard/finance', iconName: 'DollarSign', isActive: true, order: 1, parentId: 'menu-3', roleAccess: 'admin,editor,staff' },
  { id: 'menu-3-2', name: 'จัดการรายการค่าใช้จ่าย', href: '/dashboard/cost-items', iconName: 'DollarSign', isActive: true, order: 2, parentId: 'menu-3', roleAccess: 'admin,editor' },
  { id: 'menu-3-3', name: 'ระบบใบเสนอราคา', href: '/dashboard/quotations', iconName: 'DollarSign', isActive: true, order: 3, parentId: 'menu-3', roleAccess: 'admin,editor' },
  { id: 'menu-4', name: 'ตารางงานนิมนต์และศาสนพิธี', href: '/dashboard/schedule', iconName: 'Calendar', isActive: true, order: 4, parentId: null, roleAccess: 'admin,editor,staff,member' },
  { id: 'menu-10', name: 'ระบบจองศาลา', href: '/dashboard/sala', iconName: 'Calendar', isActive: true, order: 5, parentId: null, roleAccess: 'admin,editor,staff,member' },
  { id: 'menu-12', name: 'ทะเบียนจัดตั้งศพ', href: '/dashboard/sala/funerals', iconName: 'Archive', isActive: true, order: 6, parentId: null, roleAccess: 'admin,editor,staff,member' },
  { id: 'menu-5', name: 'คลังและครุภัณฑ์วัด', href: '#', iconName: 'Package', isActive: true, order: 7, parentId: null, roleAccess: 'admin,editor,staff,member' },
  { id: 'menu-5-1', name: 'ครุภัณฑ์และการยืม-คืน', href: '/dashboard/inventory', iconName: 'Package', isActive: true, order: 1, parentId: 'menu-5', roleAccess: 'admin,editor,staff,member' },
  { id: 'menu-5-2', name: 'ทะเบียนฝากกระดูก / อัฐิ', href: '/dashboard/ashes', iconName: 'Archive', isActive: true, order: 2, parentId: 'menu-5', roleAccess: 'admin,editor,staff,member' },
  { id: 'menu-13', name: 'รายงานและวิเคราะห์', href: '/dashboard/reports', iconName: 'BookOpen', isActive: true, order: 8, parentId: null, roleAccess: 'admin,editor,staff' },
  { id: 'menu-6', name: 'จัดการเมนูระบบ', href: '/dashboard/menu-manager', iconName: 'Activity', isActive: true, order: 9, parentId: null, roleAccess: 'admin' },
  { id: 'menu-7', name: 'ตั้งค่าระบบวัด', href: '/dashboard/settings', iconName: 'Settings', isActive: true, order: 10, parentId: null, roleAccess: 'admin,editor' },
  { id: 'menu-8', name: 'จัดการสมณศักดิ์/หน้าที่', href: '/dashboard/ranks', iconName: 'Award', isActive: true, order: 11, parentId: null, roleAccess: 'admin,editor' },
  { id: 'menu-9', name: 'จัดการผู้ใช้งาน', href: '/dashboard/users', iconName: 'User', isActive: true, order: 12, parentId: null, roleAccess: 'admin' },
  { id: 'menu-14', name: 'ประวัติการใช้งานระบบ', href: '/dashboard/system-logs', iconName: 'History', isActive: true, order: 13, parentId: null, roleAccess: 'admin' },
  { id: 'menu-11', name: 'พื้นที่ส่วนตัวของฉัน', href: '#', iconName: 'Users', isActive: true, order: 14, parentId: null, roleAccess: 'admin,editor,staff,member' },
  { id: 'menu-11-1', name: 'รายรับ-รายจ่ายส่วนตัว', href: '/dashboard/personal-finance', iconName: 'DollarSign', isActive: true, order: 1, parentId: 'menu-11', roleAccess: 'admin,editor,staff,member' },
  { id: 'menu-11-2', name: 'ตารางงานนิมนต์ของฉัน', href: '/dashboard/personal-schedule', iconName: 'Calendar', isActive: true, order: 2, parentId: 'menu-11', roleAccess: 'admin,editor,staff,member' }
];

// Helper to write system log
async function logAction(action: 'create' | 'edit' | 'delete' | 'login', entityType: string, entityId: string, details?: any) {
  if (typeof window === 'undefined') return;
  try {
    let userId = 'system';
    let userEmail = 'system@temple.mail.go.th';
    let userName = 'ระบบอัตโนมัติ';
    
    const sessionStr = localStorage.getItem('temple_session');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      if (session && session.user) {
        userId = session.user.id || userId;
        userEmail = session.user.email || userEmail;
        userName = session.user.name || session.user.fullName || userName;
      }
    }

    await supabase.from('system_logs').insert({
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
      action: action,
      entity_type: entityType,
      entity_id: entityId,
      details: details ? JSON.stringify(details) : null,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to write action log:', err);
  }
}

// DB Adapter
export const db = {
  // Monks API
  monks: {
    async list(): Promise<Monk[]> {
      const { data, error } = await supabase.from('monks').select('*').eq('is_deleted', false).order('ordination_date', { ascending: true });
      if (error) throw error;
      return data as Monk[];
    },
    async save(monk: Monk): Promise<Monk> {
      const isEdit = !!monk.id && monk.id.length > 0;
      const { data, error } = await supabase.from('monks').upsert(monk).select().single();
      if (error) throw error;
      await logAction(isEdit ? 'edit' : 'create', 'monk', data.id, monk);
      return data as Monk;
    },
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase.from('monks').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
      await logAction('delete', 'monk', id);
      return true;
    }
  },

  // Ranks API
  ranks: {
    async list(): Promise<MonkRank[]> {
      const { data, error } = await supabase.from('ranks').select('*').eq('is_deleted', false).order('order', { ascending: true });
      if (error) throw error;
      return (data as MonkRank[]).map(r => ({
        ...r,
        person_type: r.person_type || (r.is_novice ? 'novice' : r.name === 'ศิษย์วัด' ? 'disciple' : 'monk')
      }));
    },
    async save(rank: MonkRank): Promise<MonkRank> {
      const isEdit = !!rank.id && rank.id.length > 0;
      const { data, error } = await supabase.from('ranks').upsert(rank).select().single();
      if (error) throw error;
      await logAction(isEdit ? 'edit' : 'create', 'rank', data.id, rank);
      return data as MonkRank;
    },
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase.from('ranks').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
      await logAction('delete', 'rank', id);
      return true;
    }
  },

  // Financial API
  finance: {
    async list(): Promise<FinancialTransaction[]> {
      const { data, error } = await supabase.from('transactions').select('*').eq('is_deleted', false).order('date', { ascending: false });
      if (error) throw error;
      return data as FinancialTransaction[];
    },
    async save(transaction: FinancialTransaction): Promise<FinancialTransaction> {
      const isEdit = !!transaction.id && transaction.id.length > 0;
      const { data, error } = await supabase.from('transactions').upsert(transaction).select().single();
      if (error) throw error;
      await logAction(isEdit ? 'edit' : 'create', 'finance_transaction', data.id, transaction);
      return data as FinancialTransaction;
    },
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase.from('transactions').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
      await logAction('delete', 'finance_transaction', id);
      return true;
    }
  },

  // Events API
  events: {
    async list(): Promise<TempleEvent[]> {
      const { data, error } = await supabase.from('events').select('*').eq('is_deleted', false).order('date', { ascending: true });
      if (error) throw error;
      return data as TempleEvent[];
    },
    async save(event: TempleEvent): Promise<TempleEvent> {
      const isEdit = !!event.id && event.id.length > 0;
      const { data, error } = await supabase.from('events').upsert(event).select().single();
      if (error) throw error;
      await logAction(isEdit ? 'edit' : 'create', 'event', data.id, event);
      return data as TempleEvent;
    },
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase.from('events').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
      await logAction('delete', 'event', id);
      return true;
    }
  },

  // Inventory API
  inventory: {
    async list(): Promise<InventoryItem[]> {
      const { data, error } = await supabase.from('inventory').select('*').eq('is_deleted', false).order('name', { ascending: true });
      if (error) throw error;
      return data as InventoryItem[];
    },
    async save(item: InventoryItem): Promise<InventoryItem> {
      const isEdit = !!item.id && item.id.length > 0;
      const { data, error } = await supabase.from('inventory').upsert(item).select().single();
      if (error) throw error;
      await logAction(isEdit ? 'edit' : 'create', 'inventory_item', data.id, item);
      return data as InventoryItem;
    },
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase.from('inventory').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
      await logAction('delete', 'inventory_item', id);
      return true;
    }
  },

  // Borrow/Return API
  borrow: {
    async list(): Promise<BorrowRecord[]> {
      const { data, error } = await supabase.from('borrow_records').select('*').eq('is_deleted', false).order('borrow_date', { ascending: false });
      if (error) throw error;
      return data as BorrowRecord[];
    },
    async save(record: BorrowRecord): Promise<BorrowRecord> {
      // 1. Get the existing record from database before upserting (if it exists) to compute correct diffs
      let oldRecord: BorrowRecord | null = null;
      if (record.id) {
        const { data } = await supabase.from('borrow_records').select('*').eq('id', record.id);
        if (data && data.length > 0) {
          oldRecord = data[0] as BorrowRecord;
        }
      }

      // 2. Perform the upsert
      const { data, error } = await supabase.from('borrow_records').upsert(record).select().single();
      if (error) throw error;

      // 3. Adjust inventory available qty based on borrow action in database
      const itemResponse = await supabase.from('inventory').select('*').eq('id', record.item_id).single();
      if (!itemResponse.error && itemResponse.data) {
        const item = itemResponse.data as InventoryItem;
        let qtyDiff = 0;

        if (!oldRecord) {
          // New borrow record: deduct from available quantity
          if (record.status !== 'returned') {
            qtyDiff = -record.borrow_qty;
          }
        } else {
          // Updating existing borrow record
          const oldStatus = oldRecord.status;
          const newStatus = record.status;

          if (oldStatus !== 'returned' && newStatus === 'returned') {
            // Returned: add back to available quantity
            qtyDiff = oldRecord.borrow_qty;
          } else if (oldStatus === 'returned' && newStatus !== 'returned') {
            // Re-borrowed: deduct from available quantity
            qtyDiff = -record.borrow_qty;
          } else if (oldStatus !== 'returned' && newStatus !== 'returned') {
            // Adjust quantity while still borrowed
            qtyDiff = oldRecord.borrow_qty - record.borrow_qty;
          }
        }

        if (qtyDiff !== 0) {
          const newQty = Math.max(0, Math.min(item.total_qty, item.available_qty + qtyDiff));
          await supabase.from('inventory').update({ available_qty: newQty }).eq('id', item.id);
        }
      }

      const isEdit = !!record.id && record.id.length > 0;
      await logAction(isEdit ? 'edit' : 'create', 'borrow_record', data.id, record);
      return data as BorrowRecord;
    },
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase.from('borrow_records').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
      await logAction('delete', 'borrow_record', id);
      return true;
    }
  },

  // Ashes API (ทะเบียนฝากกระดูก)
  ashes: {
    async list(): Promise<AshesRecord[]> {
      const { data, error } = await supabase.from('ashes').select('*').eq('is_deleted', false).order('niche_code', { ascending: true });
      if (error) throw error;
      return data as AshesRecord[];
    },
    async save(record: AshesRecord): Promise<AshesRecord> {
      const isEdit = !!record.id && record.id.length > 0;
      const { data, error } = await supabase.from('ashes').upsert(record).select().single();
      if (error) throw error;
      await logAction(isEdit ? 'edit' : 'create', 'ashes_record', data.id, record);
      return data as AshesRecord;
    },
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase.from('ashes').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
      await logAction('delete', 'ashes_record', id);
      return true;
    }
  },

  // Dynamic System Menus API
  menus: {
    async list(): Promise<MenuItem[]> {
      const { data, error } = await supabase.from('menu_items').select('*').eq('is_deleted', false).order('order', { ascending: true });
      if (error) throw error;
      return (data || []).map(mapMenuItemFromDB);
    },
    async save(item: MenuItem): Promise<MenuItem> {
      const isEdit = !!item.id && item.id.length > 0;
      const dbItem = mapMenuItemToDB(item);
      const { data, error } = await supabase.from('menu_items').upsert(dbItem).select().single();
      if (error) throw error;
      await logAction(isEdit ? 'edit' : 'create', 'menu_item', data.id, item);
      return mapMenuItemFromDB(data);
    },
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase.from('menu_items').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
      await logAction('delete', 'menu_item', id);
      return true;
    },
    async saveAll(items: MenuItem[]): Promise<MenuItem[]> {
      const dbItems = items.map(mapMenuItemToDB);
      const { data, error } = await supabase.from('menu_items').upsert(dbItems).select();
      if (error) throw error;
      return (data || []).map(mapMenuItemFromDB);
    },
    async reset(): Promise<MenuItem[]> {
      const { error: delError } = await supabase.from('menu_items').update({ is_deleted: true }).neq('id', 'dummy');
      if (delError) throw delError;

      const dbItems = DEFAULT_MENU_ITEMS.map(mapMenuItemToDB);
      const { data, error } = await supabase.from('menu_items').insert(dbItems).select();
      if (error) throw error;
      await logAction('edit', 'menu_items_reset', 'all');
      return (data || []).map(mapMenuItemFromDB);
    }
  },

  // System Settings API (เปลี่ยนชื่อวัด, โลโก้, สีธีม)
  settings: {
    cached: null as TempleSettings | null,
    async get(): Promise<TempleSettings> {
      if (this.cached) return this.cached;
      const { data, error } = await supabase.from('settings').select('*').limit(1);
      if (error) throw error;
      if (data && data.length > 0) {
        this.cached = mapSettingsFromDB(data[0]);
        return this.cached;
      }
      throw new Error('System settings not found');
    },
    async save(settings: TempleSettings): Promise<TempleSettings> {
      const dbSettings = mapSettingsToDB(settings);
      const { data, error } = await supabase.from('settings').upsert({ id: 'config-1', ...dbSettings }).select().single();
      if (error) throw error;
      await logAction('edit', 'settings', 'config-1', settings);
      this.cached = mapSettingsFromDB(data);
      return this.cached;
    }
  },

  // Users API
  users: {
    async list(): Promise<SystemUser[]> {
      const { data, error } = await supabase.from('users').select('*').eq('is_deleted', false).order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapSystemUserFromDB);
    },
    async save(user: SystemUser): Promise<SystemUser> {
      const isEdit = !!user.id && user.id.length > 0;
      const dbUser = mapSystemUserToDB(user);
      const { data, error } = await supabase.from('users').upsert(dbUser).select().single();
      if (error) throw error;
      await logAction(isEdit ? 'edit' : 'create', 'user', data.id, { email: user.email, fullName: user.fullName, role: user.role });
      return mapSystemUserFromDB(data);
    },
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase.from('users').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
      await logAction('delete', 'user', id);
      return true;
    }
  },

  // Salas API (ศาลา)
  salas: {
    async list(): Promise<Sala[]> {
      const { data, error } = await supabase.from('salas').select('*').eq('is_deleted', false).order('short_name', { ascending: true });
      if (error) throw error;
      return data as Sala[];
    },
    async save(sala: Sala): Promise<Sala> {
      const isEdit = !!sala.id && sala.id.length > 0;
      const { data, error } = await supabase.from('salas').upsert(sala).select().single();
      if (error) throw error;
      await logAction(isEdit ? 'edit' : 'create', 'sala', data.id, sala);
      return data as Sala;
    },
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase.from('salas').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
      await logAction('delete', 'sala', id);
      return true;
    }
  },

  // Sala Bookings API (การจองศาลา)
  salaBookings: {
    async list(): Promise<SalaBooking[]> {
      const { data, error } = await supabase.from('sala_bookings').select('*').eq('is_deleted', false).order('start_date', { ascending: true });
      if (error) throw error;
      return data as SalaBooking[];
    },
    async save(booking: SalaBooking): Promise<SalaBooking> {
      const isEdit = !!booking.id && booking.id.length > 0;
      const { data, error } = await supabase.from('sala_bookings').upsert(booking).select().single();
      if (error) throw error;
      await logAction(isEdit ? 'edit' : 'create', 'sala_booking', data.id, booking);
      return data as SalaBooking;
    },
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase.from('sala_bookings').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
      await logAction('delete', 'sala_booking', id);
      return true;
    }
  },

  // Cost Items API (รายการค่าใช้จ่าย)
  costItems: {
    async list(): Promise<CostItem[]> {
      const { data, error } = await supabase.from('cost_items').select('*').eq('is_deleted', false).order('sort_order', { ascending: true });
      if (error) throw error;
      return data as CostItem[];
    },
    async save(item: CostItem): Promise<CostItem> {
      const isEdit = !!item.id && item.id.length > 0;
      const { data, error } = await supabase.from('cost_items').upsert(item).select().single();
      if (error) throw error;
      await logAction(isEdit ? 'edit' : 'create', 'cost_item', data.id, item);
      return data as CostItem;
    },
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase.from('cost_items').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
      await logAction('delete', 'cost_item', id);
      return true;
    }
  },

  // Quotations API (ใบเสนอราคา)
  quotations: {
    async list(): Promise<Quotation[]> {
      const { data, error } = await supabase.from('quotations').select('*').eq('is_deleted', false).order('created_at', { ascending: false });
      if (error) throw error;
      return data as Quotation[];
    },
    async save(quotation: Quotation): Promise<Quotation> {
      const isEdit = !!quotation.id && quotation.id.length > 0;
      const { data, error } = await supabase.from('quotations').upsert(quotation).select().single();
      if (error) throw error;
      await logAction(isEdit ? 'edit' : 'create', 'quotation', data.id, quotation);
      return data as Quotation;
    },
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase.from('quotations').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
      await logAction('delete', 'quotation', id);
      return true;
    },
    async getNextNo(): Promise<string> {
      const year = new Date().getFullYear() + 543;
      const prefix = `QT-${year}-`;
      const { data } = await supabase.from('quotations').select('quotation_no').like('quotation_no', `${prefix}%`).order('quotation_no', { ascending: false }).limit(1);
      if (data && data.length > 0) {
        const lastNo = parseInt(data[0].quotation_no.replace(prefix, ''), 10);
        return `${prefix}${String(lastNo + 1).padStart(3, '0')}`;
      }
      return `${prefix}001`;
    }
  },

  // Funeral Arrangements API (รายละเอียดการจัดตั้งศพ)
  funeralArrangements: {
    async list(): Promise<FuneralArrangement[]> {
      const { data, error } = await supabase
        .from('funeral_arrangements')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as FuneralArrangement[];
    },
    async getByBookingId(bookingId: string): Promise<FuneralArrangement | null> {
      const { data, error } = await supabase
        .from('funeral_arrangements')
        .select('*')
        .eq('booking_id', bookingId)
        .eq('is_deleted', false)
        .maybeSingle();
      if (error) throw error;
      return data as FuneralArrangement | null;
    },
    async save(arrangement: FuneralArrangement): Promise<FuneralArrangement> {
      const isEdit = !!arrangement.id && arrangement.id.length > 0;
      const { chant_nights, ...payload } = arrangement;
      
      try {
        const { data, error } = await supabase
          .from('funeral_arrangements')
          .upsert({ ...payload, is_deleted: false })
          .select()
          .single();
        if (error) throw error;
        await logAction(isEdit ? 'edit' : 'create', 'funeral_arrangement', data.id, arrangement);
        return data as FuneralArrangement;
      } catch (err: any) {
        console.warn('Funeral arrangements upsert schema mismatch, falling back to minimal payload:', err?.message);
        const minimalPayload = {
          id: arrangement.id,
          booking_id: arrangement.booking_id,
          deceased_name: arrangement.deceased_name || '',
          deceased_age: arrangement.deceased_age || null,
          created_at: arrangement.created_at || new Date().toISOString(),
          is_deleted: false
        };
        const { data, error } = await supabase
          .from('funeral_arrangements')
          .upsert(minimalPayload)
          .select()
          .single();
        if (error) throw error;
        await logAction(isEdit ? 'edit' : 'create', 'funeral_arrangement', data.id, arrangement);
        return data as FuneralArrangement;
      }
    },
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase
        .from('funeral_arrangements')
        .update({ is_deleted: true })
        .eq('id', id);
      if (error) throw error;
      await logAction('delete', 'funeral_arrangement', id);
      return true;
    }
  },

  // Ceremony Templates API
  ceremonyTemplates: {
    async list(): Promise<DBCeremonyTemplate[]> {
      const { data, error } = await supabase
        .from('ceremony_templates')
        .select('*')
        .eq('is_deleted', false)
        .order('name', { ascending: true });
      if (error) throw error;
      return data as DBCeremonyTemplate[];
    },
    async save(tpl: DBCeremonyTemplate): Promise<DBCeremonyTemplate> {
      const isEdit = !!tpl.id && tpl.id.length > 0;
      const { data, error } = await supabase
        .from('ceremony_templates')
        .upsert({ ...tpl, is_deleted: false })
        .select()
        .single();
      if (error) throw error;
      await logAction(isEdit ? 'edit' : 'create', 'ceremony_template', data.id, { name: tpl.name });
      return data as DBCeremonyTemplate;
    },
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase
        .from('ceremony_templates')
        .update({ is_deleted: true })
        .eq('id', id);
      if (error) throw error;
      await logAction('delete', 'ceremony_template', id);
      return true;
    }
  },

  // Ceremony Preps API
  ceremonyPreps: {
    async list(): Promise<DBCeremonyPrep[]> {
      const { data, error } = await supabase
        .from('ceremony_preps')
        .select('*')
        .eq('is_deleted', false)
        .order('id', { ascending: false });
      if (error) throw error;
      return data as DBCeremonyPrep[];
    },
    async save(prep: DBCeremonyPrep): Promise<DBCeremonyPrep> {
      const isEdit = !!prep.id && prep.id.length > 0;
      const { data, error } = await supabase
        .from('ceremony_preps')
        .upsert({ ...prep, is_deleted: false })
        .select()
        .single();
      if (error) throw error;
      await logAction(isEdit ? 'edit' : 'create', 'ceremony_prep', data.id, { name: prep.name });
      return data as DBCeremonyPrep;
    },
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase
        .from('ceremony_preps')
        .update({ is_deleted: true })
        .eq('id', id);
      if (error) throw error;
      await logAction('delete', 'ceremony_prep', id);
      return true;
    }
  },
  
  // System Logs API
  systemLogs: {
    async list(): Promise<SystemLog[]> {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SystemLog[];
    }
  },

  // Financial Categories API
  financialCategories: {
    async list(): Promise<FinancialCategory[]> {
      const { data, error } = await supabase
        .from('financial_categories')
        .select('*')
        .eq('is_deleted', false)
        .order('type', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return data as FinancialCategory[];
    },
    async save(category: FinancialCategory): Promise<FinancialCategory> {
      const isEdit = !!category.id && category.id.length > 0;
      const finalCategory = {
        id: category.id || `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: category.name,
        type: category.type,
        is_deleted: false,
        created_at: category.created_at || new Date().toISOString()
      };
      const { data, error } = await supabase
        .from('financial_categories')
        .upsert(finalCategory)
        .select()
        .single();
      if (error) throw error;
      await logAction(isEdit ? 'edit' : 'create', 'financial_category', data.id, finalCategory);
      return data as FinancialCategory;
    },
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase
        .from('financial_categories')
        .update({ is_deleted: true })
        .eq('id', id);
      if (error) throw error;
      await logAction('delete', 'financial_category', id);
      return true;
    }
  },

  // Recurring Expenses API
  recurringExpenses: {
    async list(): Promise<RecurringExpense[]> {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select('*')
        .eq('is_deleted', false)
        .order('pay_day', { ascending: true });
      if (error) throw error;
      return data as RecurringExpense[];
    },
    async save(expense: RecurringExpense): Promise<RecurringExpense> {
      const isEdit = !!expense.id && expense.id.length > 0;
      const finalExpense = {
        id: expense.id || `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: expense.title,
        amount: expense.amount,
        category: expense.category,
        pay_day: expense.pay_day,
        is_active: expense.is_active,
        description: expense.description || null,
        payer_monk_id: expense.payer_monk_id || null,
        is_deleted: false,
        created_at: expense.created_at || new Date().toISOString()
      };
      const { data, error } = await supabase
        .from('recurring_expenses')
        .upsert(finalExpense)
        .select()
        .single();
      if (error) throw error;
      await logAction(isEdit ? 'edit' : 'create', 'recurring_expense', data.id, finalExpense);
      return data as RecurringExpense;
    },
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase
        .from('recurring_expenses')
        .update({ is_deleted: true })
        .eq('id', id);
      if (error) throw error;
      await logAction('delete', 'recurring_expense', id);
      return true;
    }
  },

  // Monk Duties API
  monkDuties: {
    async list(): Promise<MonkDuty[]> {
      const { data, error } = await supabase
        .from('monk_duties')
        .select('*')
        .eq('is_deleted', false)
        .order('date', { ascending: true });
      if (error) throw error;
      return data as MonkDuty[];
    },
    async save(duty: MonkDuty): Promise<MonkDuty> {
      const isEdit = !!duty.id && duty.id.length > 0;
      const finalDuty = {
        id: duty.id || `duty-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        duty_title: duty.duty_title,
        date: duty.date,
        time_slot: duty.time_slot,
        assigned_monk_ids: duty.assigned_monk_ids,
        assigned_monk_names: duty.assigned_monk_names,
        status: duty.status || 'pending',
        notes: duty.notes || '',
        is_deleted: false,
        created_at: duty.created_at || new Date().toISOString()
      };
      const { data, error } = await supabase
        .from('monk_duties')
        .upsert(finalDuty)
        .select()
        .single();
      if (error) throw error;
      await logAction(isEdit ? 'edit' : 'create', 'monk_duty', data.id, finalDuty);
      return data as MonkDuty;
    },
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase
        .from('monk_duties')
        .update({ is_deleted: true })
        .eq('id', id);
      if (error) throw error;
      await logAction('delete', 'monk_duty', id);
      return true;
    }
  },

  // Monk Duty Types API
  monkDutyTypes: {
    async list(): Promise<MonkDutyType[]> {
      const { data, error } = await supabase
        .from('monk_duty_types')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as MonkDutyType[];
    },
    async save(dutyType: MonkDutyType): Promise<MonkDutyType> {
      const isEdit = !!dutyType.id && dutyType.id.length > 0;
      const finalType = {
        id: dutyType.id || `duty-type-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        title: dutyType.title,
        icon: dutyType.icon || '🧹',
        time_slot: dutyType.time_slot || '06:00 น. - 07:30 น.',
        req_monks: Number(dutyType.req_monks) || 1,
        description: dutyType.description || '',
        is_deleted: false,
        created_at: dutyType.created_at || new Date().toISOString()
      };
      const { data, error } = await supabase
        .from('monk_duty_types')
        .upsert(finalType)
        .select()
        .single();
      if (error) throw error;
      await logAction(isEdit ? 'edit' : 'create', 'monk_duty_type', data.id, finalType);
      return data as MonkDutyType;
    },
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase
        .from('monk_duty_types')
        .update({ is_deleted: true })
        .eq('id', id);
      if (error) throw error;
      await logAction('delete', 'monk_duty_type', id);
      return true;
    }
  }
};

