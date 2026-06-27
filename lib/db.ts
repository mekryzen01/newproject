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
}

export interface MonkRank {
  id: string;
  name: string;
  is_novice: boolean;
  person_type: 'monk' | 'novice' | 'disciple';
  order: number;
}

export interface SystemUser {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'staff' | 'editor';
  phone?: string;
  password?: string;
  created_at: string;
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
}

export interface MenuItem {
  id: string;
  name: string;
  href: string;
  iconName: string;
  isActive: boolean;
  order: number;
  parentId?: string | null;
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
}

// Supabase Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://klaybalbdnafkomqeduy.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// DB Interfaces
export interface DBMenuItem {
  id: string;
  name: string;
  href: string;
  icon_name: string;
  is_active: boolean;
  order: number;
  parent_id?: string | null;
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
  role: 'admin' | 'staff' | 'editor';
  phone?: string;
  password?: string;
  created_at: string;
}

// Helpers for mappings
const mapMenuItemFromDB = (m: DBMenuItem): MenuItem => ({
  id: m.id,
  name: m.name,
  href: m.href,
  iconName: m.icon_name,
  isActive: m.is_active,
  order: m.order,
  parentId: m.parent_id
});

const mapMenuItemToDB = (m: MenuItem): DBMenuItem => ({
  id: m.id,
  name: m.name,
  href: m.href,
  icon_name: m.iconName,
  is_active: m.isActive,
  order: m.order,
  parent_id: m.parentId
});

const mapSettingsFromDB = (s: any): TempleSettings => ({
  templeName: s.temple_name,
  abbr: s.abbr,
  logoIcon: s.logo_icon,
  themeColor: s.theme_color,
  logoUrl: s.logo_url,
  lineNotifyToken: s.line_notify_token,
  lineChannelAccessToken: s.line_channel_access_token,
  lineGroupId: s.line_group_id
});

const mapSettingsToDB = (s: TempleSettings): any => ({
  temple_name: s.templeName,
  abbr: s.abbr,
  logo_icon: s.logoIcon,
  theme_color: s.themeColor,
  logo_url: s.logoUrl,
  line_notify_token: s.lineNotifyToken,
  line_channel_access_token: s.lineChannelAccessToken,
  line_group_id: s.lineGroupId
});

const mapSystemUserFromDB = (u: DBSystemUser): SystemUser => ({
  id: u.id,
  email: u.email,
  fullName: u.full_name,
  role: u.role,
  phone: u.phone,
  password: u.password,
  created_at: u.created_at
});

const mapSystemUserToDB = (u: SystemUser): DBSystemUser => ({
  id: u.id,
  email: u.email,
  full_name: u.fullName,
  role: u.role,
  phone: u.phone,
  password: u.password,
  created_at: u.created_at
});

// Default Menu Items for Reset Function
const DEFAULT_MENU_ITEMS: MenuItem[] = [
  { id: 'menu-1', name: 'แดชบอร์ดภาพรวม', href: '/dashboard', iconName: 'Home', isActive: true, order: 1, parentId: null },
  { id: 'menu-2', name: 'พระภิกษุและสามเณร', href: '/dashboard/monks', iconName: 'Users', isActive: true, order: 2, parentId: null },
  { id: 'menu-3', name: 'การเงินและบัญชีวัด', href: '#', iconName: 'DollarSign', isActive: true, order: 3, parentId: null },
  { id: 'menu-3-1', name: 'บัญชีรายรับ-รายจ่าย', href: '/dashboard/finance', iconName: 'DollarSign', isActive: true, order: 1, parentId: 'menu-3' },
  { id: 'menu-3-2', name: 'จัดการรายการค่าใช้จ่าย', href: '/dashboard/cost-items', iconName: 'DollarSign', isActive: true, order: 2, parentId: 'menu-3' },
  { id: 'menu-3-3', name: 'ระบบใบเสนอราคา', href: '/dashboard/quotations', iconName: 'DollarSign', isActive: true, order: 3, parentId: 'menu-3' },
  { id: 'menu-4', name: 'ตารางงานนิมนต์และศาสนพิธี', href: '/dashboard/schedule', iconName: 'Calendar', isActive: true, order: 4, parentId: null },
  { id: 'menu-10', name: 'ระบบจองศาลา', href: '/dashboard/sala', iconName: 'Calendar', isActive: true, order: 5, parentId: null },
  { id: 'menu-5', name: 'คลังและครุภัณฑ์วัด', href: '#', iconName: 'Package', isActive: true, order: 6, parentId: null },
  { id: 'menu-5-1', name: 'ครุภัณฑ์และการยืม-คืน', href: '/dashboard/inventory', iconName: 'Package', isActive: true, order: 1, parentId: 'menu-5' },
  { id: 'menu-5-2', name: 'ทะเบียนฝากกระดูก / อัฐิ', href: '/dashboard/ashes', iconName: 'Archive', isActive: true, order: 2, parentId: 'menu-5' },
  { id: 'menu-6', name: 'จัดการเมนูระบบ', href: '/dashboard/menu-manager', iconName: 'Activity', isActive: true, order: 7, parentId: null },
  { id: 'menu-7', name: 'ตั้งค่าระบบวัด', href: '/dashboard/settings', iconName: 'Settings', isActive: true, order: 8, parentId: null },
  { id: 'menu-8', name: 'จัดการสมณศักดิ์/หน้าที่', href: '/dashboard/ranks', iconName: 'Award', isActive: true, order: 9, parentId: null },
  { id: 'menu-9', name: 'จัดการผู้ใช้งาน', href: '/dashboard/users', iconName: 'User', isActive: true, order: 10, parentId: null }
];

// DB Adapter
export const db = {
  // Monks API
  monks: {
    async list(): Promise<Monk[]> {
      const { data, error } = await supabase.from('monks').select('*').order('ordination_date', { ascending: true });
      if (error) throw error;
      return data as Monk[];
    },
    async save(monk: Monk): Promise<Monk> {
      const { data, error } = await supabase.from('monks').upsert(monk).select().single();
      if (error) throw error;
      return data as Monk;
    },
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase.from('monks').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
  },

  // Ranks API
  ranks: {
    async list(): Promise<MonkRank[]> {
      const { data, error } = await supabase.from('ranks').select('*').order('order', { ascending: true });
      if (error) throw error;
      return (data as MonkRank[]).map(r => ({
        ...r,
        person_type: r.person_type || (r.is_novice ? 'novice' : r.name === 'ศิษย์วัด' ? 'disciple' : 'monk')
      }));
    },
    async save(rank: MonkRank): Promise<MonkRank> {
      const { data, error } = await supabase.from('ranks').upsert(rank).select().single();
      if (error) throw error;
      return data as MonkRank;
    },
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase.from('ranks').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
  },

  // Financial API
  finance: {
    async list(): Promise<FinancialTransaction[]> {
      const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false });
      if (error) throw error;
      return data as FinancialTransaction[];
    },
    async save(transaction: FinancialTransaction): Promise<FinancialTransaction> {
      const { data, error } = await supabase.from('transactions').upsert(transaction).select().single();
      if (error) throw error;
      return data as FinancialTransaction;
    },
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
  },

  // Events API
  events: {
    async list(): Promise<TempleEvent[]> {
      const { data, error } = await supabase.from('events').select('*').order('date', { ascending: true });
      if (error) throw error;
      return data as TempleEvent[];
    },
    async save(event: TempleEvent): Promise<TempleEvent> {
      const { data, error } = await supabase.from('events').upsert(event).select().single();
      if (error) throw error;
      return data as TempleEvent;
    },
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
  },

  // Inventory API
  inventory: {
    async list(): Promise<InventoryItem[]> {
      const { data, error } = await supabase.from('inventory').select('*').order('name', { ascending: true });
      if (error) throw error;
      return data as InventoryItem[];
    },
    async save(item: InventoryItem): Promise<InventoryItem> {
      const { data, error } = await supabase.from('inventory').upsert(item).select().single();
      if (error) throw error;
      return data as InventoryItem;
    },
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase.from('inventory').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
  },

  // Borrow/Return API
  borrow: {
    async list(): Promise<BorrowRecord[]> {
      const { data, error } = await supabase.from('borrow_records').select('*').order('borrow_date', { ascending: false });
      if (error) throw error;
      return data as BorrowRecord[];
    },
    async save(record: BorrowRecord): Promise<BorrowRecord> {
      const { data, error } = await supabase.from('borrow_records').upsert(record).select().single();
      if (error) throw error;

      // Adjust inventory available qty based on borrow action in database
      const itemResponse = await supabase.from('inventory').select('*').eq('id', record.item_id).single();
      if (!itemResponse.error && itemResponse.data) {
        const item = itemResponse.data as InventoryItem;
        if (record.status === 'returned') {
          // Check if previously returned to avoid double adjusting
          const prevRes = await supabase.from('borrow_records').select('status').eq('id', record.id);
          const wasReturned = prevRes.data && prevRes.data.length > 0 && prevRes.data[0].status === 'returned';
          if (!wasReturned) {
            const newQty = Math.min(item.total_qty, item.available_qty + record.borrow_qty);
            await supabase.from('inventory').update({ available_qty: newQty }).eq('id', item.id);
          }
        } else {
          const prevRes = await supabase.from('borrow_records').select('id').eq('id', record.id);
          const isNew = !prevRes.data || prevRes.data.length === 0;
          if (isNew) {
            const newQty = Math.max(0, item.available_qty - record.borrow_qty);
            await supabase.from('inventory').update({ available_qty: newQty }).eq('id', item.id);
          }
        }
      }

      return data as BorrowRecord;
    },
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase.from('borrow_records').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
  },

  // Ashes API (ทะเบียนฝากกระดูก)
  ashes: {
    async list(): Promise<AshesRecord[]> {
      const { data, error } = await supabase.from('ashes').select('*').order('niche_code', { ascending: true });
      if (error) throw error;
      return data as AshesRecord[];
    },
    async save(record: AshesRecord): Promise<AshesRecord> {
      const { data, error } = await supabase.from('ashes').upsert(record).select().single();
      if (error) throw error;
      return data as AshesRecord;
    },
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase.from('ashes').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
  },

  // Dynamic System Menus API
  menus: {
    async list(): Promise<MenuItem[]> {
      const { data, error } = await supabase.from('menu_items').select('*').order('order', { ascending: true });
      if (error) throw error;
      return (data || []).map(mapMenuItemFromDB);
    },
    async save(item: MenuItem): Promise<MenuItem> {
      const dbItem = mapMenuItemToDB(item);
      const { data, error } = await supabase.from('menu_items').upsert(dbItem).select().single();
      if (error) throw error;
      return mapMenuItemFromDB(data);
    },
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) throw error;
      return true;
    },
    async saveAll(items: MenuItem[]): Promise<MenuItem[]> {
      const dbItems = items.map(mapMenuItemToDB);
      const { data, error } = await supabase.from('menu_items').upsert(dbItems).select();
      if (error) throw error;
      return (data || []).map(mapMenuItemFromDB);
    },
    async reset(): Promise<MenuItem[]> {
      const { error: delError } = await supabase.from('menu_items').delete().neq('id', 'dummy');
      if (delError) throw delError;

      const dbItems = DEFAULT_MENU_ITEMS.map(mapMenuItemToDB);
      const { data, error } = await supabase.from('menu_items').insert(dbItems).select();
      if (error) throw error;
      return (data || []).map(mapMenuItemFromDB);
    }
  },

  // System Settings API (เปลี่ยนชื่อวัด, โลโก้, สีธีม)
  settings: {
    async get(): Promise<TempleSettings> {
      const { data, error } = await supabase.from('settings').select('*').limit(1);
      if (error) throw error;
      if (data && data.length > 0) return mapSettingsFromDB(data[0]);
      throw new Error('System settings not found');
    },
    async save(settings: TempleSettings): Promise<TempleSettings> {
      const dbSettings = mapSettingsToDB(settings);
      const { data, error } = await supabase.from('settings').upsert({ id: 'config-1', ...dbSettings }).select().single();
      if (error) throw error;
      return mapSettingsFromDB(data);
    }
  },

  // Users API
  users: {
    async list(): Promise<SystemUser[]> {
      const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapSystemUserFromDB);
    },
    async save(user: SystemUser): Promise<SystemUser> {
      const dbUser = mapSystemUserToDB(user);
      const { data, error } = await supabase.from('users').upsert(dbUser).select().single();
      if (error) throw error;
      return mapSystemUserFromDB(data);
    },
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
  },

  // Salas API (ศาลา)
  salas: {
    async list(): Promise<Sala[]> {
      const { data, error } = await supabase.from('salas').select('*').order('short_name', { ascending: true });
      if (error) throw error;
      return data as Sala[];
    },
    async save(sala: Sala): Promise<Sala> {
      const { data, error } = await supabase.from('salas').upsert(sala).select().single();
      if (error) throw error;
      return data as Sala;
    },
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase.from('salas').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
  },

  // Sala Bookings API (การจองศาลา)
  salaBookings: {
    async list(): Promise<SalaBooking[]> {
      const { data, error } = await supabase.from('sala_bookings').select('*').order('start_date', { ascending: true });
      if (error) throw error;
      return data as SalaBooking[];
    },
    async save(booking: SalaBooking): Promise<SalaBooking> {
      const { data, error } = await supabase.from('sala_bookings').upsert(booking).select().single();
      if (error) throw error;
      return data as SalaBooking;
    },
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase.from('sala_bookings').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
  },

  // Cost Items API (รายการค่าใช้จ่าย)
  costItems: {
    async list(): Promise<CostItem[]> {
      const { data, error } = await supabase.from('cost_items').select('*').order('sort_order', { ascending: true });
      if (error) throw error;
      return data as CostItem[];
    },
    async save(item: CostItem): Promise<CostItem> {
      const { data, error } = await supabase.from('cost_items').upsert(item).select().single();
      if (error) throw error;
      return data as CostItem;
    },
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase.from('cost_items').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
  },

  // Quotations API (ใบเสนอราคา)
  quotations: {
    async list(): Promise<Quotation[]> {
      const { data, error } = await supabase.from('quotations').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Quotation[];
    },
    async save(quotation: Quotation): Promise<Quotation> {
      const { data, error } = await supabase.from('quotations').upsert(quotation).select().single();
      if (error) throw error;
      return data as Quotation;
    },
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase.from('quotations').delete().eq('id', id);
      if (error) throw error;
      return true;
    },
    async getNextNo(): Promise<string> {
      const year = new Date().getFullYear() + 543; // Buddhist Era
      const prefix = `QT-${year}-`;
      const { data } = await supabase.from('quotations').select('quotation_no').like('quotation_no', `${prefix}%`).order('quotation_no', { ascending: false }).limit(1);
      if (data && data.length > 0) {
        const lastNo = parseInt(data[0].quotation_no.replace(prefix, ''), 10);
        return `${prefix}${String(lastNo + 1).padStart(3, '0')}`;
      }
      return `${prefix}001`;
    }
  }
};
