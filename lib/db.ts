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
}

// Initial Mock Data
const initialMonks: Monk[] = [];
const initialTransactions: FinancialTransaction[] = [];
const initialEvents: TempleEvent[] = [];
const initialInventory: InventoryItem[] = [];
const initialBorrowRecords: BorrowRecord[] = [];
const initialAshes: AshesRecord[] = [];

const initialMenuItems: MenuItem[] = [
  { id: 'menu-1', name: 'แดชบอร์ดภาพรวม', href: '/dashboard', iconName: 'Home', isActive: true, order: 1, parentId: null },
  { id: 'menu-2', name: 'พระภิกษุและสามเณร', href: '/dashboard/monks', iconName: 'Users', isActive: true, order: 2, parentId: null },
  { id: 'menu-3', name: 'การเงินและบัญชีวัด', href: '#', iconName: 'DollarSign', isActive: true, order: 3, parentId: null },
  { id: 'menu-3-1', name: 'บัญชีรายรับ-รายจ่าย', href: '/dashboard/finance', iconName: 'DollarSign', isActive: true, order: 1, parentId: 'menu-3' },
  { id: 'menu-4', name: 'ตารางงานนิมนต์และศาสนพิธี', href: '/dashboard/schedule', iconName: 'Calendar', isActive: true, order: 4, parentId: null },
  { id: 'menu-5', name: 'คลังและครุภัณฑ์วัด', href: '#', iconName: 'Package', isActive: true, order: 5, parentId: null },
  { id: 'menu-5-1', name: 'ครุภัณฑ์และการยืม-คืน', href: '/dashboard/inventory', iconName: 'Package', isActive: true, order: 1, parentId: 'menu-5' },
  { id: 'menu-5-2', name: 'ทะเบียนฝากกระดูก / อัฐิ', href: '/dashboard/ashes', iconName: 'Archive', isActive: true, order: 2, parentId: 'menu-5' },
  { id: 'menu-6', name: 'จัดการเมนูระบบ', href: '/dashboard/menu-manager', iconName: 'Activity', isActive: true, order: 6, parentId: null },
  { id: 'menu-7', name: 'ตั้งค่าระบบวัด', href: '/dashboard/settings', iconName: 'Settings', isActive: true, order: 7, parentId: null },
  { id: 'menu-8', name: 'จัดการสมณศักดิ์/หน้าที่', href: '/dashboard/ranks', iconName: 'Award', isActive: true, order: 8, parentId: null },
  { id: 'menu-9', name: 'จัดการผู้ใช้งาน', href: '/dashboard/users', iconName: 'User', isActive: true, order: 9, parentId: null }
];

export const initialUsers: SystemUser[] = [
  {
    id: 'u-1',
    email: 'admin@temple.mail.go.th',
    fullName: 'มัคนายกผู้ดูแลระบบ',
    role: 'admin',
    phone: '081-234-5678',
    password: 'admin123',
    created_at: '2026-01-01'
  },
  {
    id: 'u-2',
    email: 'editor@temple.mail.go.th',
    fullName: 'พระประสิทธิ์ วิปัสสโน (ผู้แก้ไข)',
    role: 'editor',
    phone: '082-345-6789',
    password: 'editor123',
    created_at: '2026-01-02'
  },
  {
    id: 'u-3',
    email: 'staff@temple.mail.go.th',
    fullName: 'นายสมชาย ใจดี (เจ้าหน้าที่วัด)',
    role: 'staff',
    phone: '083-456-7890',
    password: 'staff123',
    created_at: '2026-01-03'
  }
];

export const initialRanks: MonkRank[] = [
  { id: 'r-1', name: 'เจ้าอาวาส (พระอุปัชฌาย์)', is_novice: false, person_type: 'monk', order: 1 },
  { id: 'r-2', name: 'รองเจ้าอาวาส', is_novice: false, person_type: 'monk', order: 2 },
  { id: 'r-3', name: 'พระผู้ช่วยเจ้าอาวาส', is_novice: false, person_type: 'monk', order: 3 },
  { id: 'r-4', name: 'พระเลขานุการ', is_novice: false, person_type: 'monk', order: 4 },
  { id: 'r-5', name: 'พระลูกวัด', is_novice: false, person_type: 'monk', order: 5 },
  { id: 'r-6', name: 'สามเณร', is_novice: true, person_type: 'novice', order: 6 },
  { id: 'r-7', name: 'ศิษย์วัด', is_novice: false, person_type: 'disciple', order: 7 }
];

const defaultSettings: TempleSettings = {
  templeName: '',
  abbr: 'TEMPLE OS',
  logoIcon: 'Compass',
  themeColor: 'amber',
  logoUrl: ''
};

// Supabase Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isSupabaseConfigured = supabaseUrl !== '' && supabaseAnonKey !== '';

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Generic helper to get/set local storage data
const getLocalData = <T>(key: string, initialData: T[]): T[] => {
  if (typeof window === 'undefined') return initialData;
  const data = localStorage.getItem(`temple_sys_${key}`);
  if (!data) {
    localStorage.setItem(`temple_sys_${key}`, JSON.stringify(initialData));
    return initialData;
  }
  return JSON.parse(data);
};

const setLocalData = <T>(key: string, data: T[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`temple_sys_${key}`, JSON.stringify(data));
};

// Hybrid DB Adapter
export const db = {
  // Monks API
  monks: {
    async list(): Promise<Monk[]> {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase!.from('monks').select('*').order('ordination_date', { ascending: true });
          if (error) throw error;
          return data as Monk[];
        } catch (err) {
          console.warn('Supabase fetch failed, falling back to LocalStorage:', err);
        }
      }
      return getLocalData<Monk>('monks', initialMonks);
    },
    async save(monk: Monk): Promise<Monk> {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase!.from('monks').upsert(monk).select().single();
          if (error) throw error;
          return data as Monk;
        } catch (err) {
          console.warn('Supabase save failed, saving to LocalStorage:', err);
        }
      }
      const list = getLocalData<Monk>('monks', initialMonks);
      const index = list.findIndex(m => m.id === monk.id);
      if (index >= 0) {
        list[index] = monk;
      } else {
        list.push(monk);
      }
      setLocalData('monks', list);
      return monk;
    },
    async delete(id: string): Promise<boolean> {
      if (isSupabaseConfigured) {
        try {
          const { error } = await supabase!.from('monks').delete().eq('id', id);
          if (error) throw error;
          return true;
        } catch (err) {
          console.warn('Supabase delete failed, removing from LocalStorage:', err);
        }
      }
      const list = getLocalData<Monk>('monks', initialMonks);
      const filtered = list.filter(m => m.id !== id);
      setLocalData('monks', filtered);
      return true;
    }
  },

  // Ranks API
  ranks: {
    async list(): Promise<MonkRank[]> {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase!.from('ranks').select('*').order('order', { ascending: true });
          if (error) throw error;
          return (data as MonkRank[]).map(r => ({
            ...r,
            person_type: r.person_type || (r.is_novice ? 'novice' : r.name === 'ศิษย์วัด' ? 'disciple' : 'monk')
          }));
        } catch (err) {
          console.warn('Supabase fetch failed, falling back to LocalStorage:', err);
        }
      }
      const rawList = getLocalData<MonkRank>('ranks', initialRanks);
      return rawList.map(r => ({
        ...r,
        person_type: r.person_type || (r.is_novice ? 'novice' : r.name === 'ศิษย์วัด' ? 'disciple' : 'monk')
      })).sort((a, b) => a.order - b.order);
    },
    async save(rank: MonkRank): Promise<MonkRank> {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase!.from('ranks').upsert(rank).select().single();
          if (error) throw error;
          return data as MonkRank;
        } catch (err) {
          console.warn('Supabase save failed, saving to LocalStorage:', err);
        }
      }
      const list = getLocalData<MonkRank>('ranks', initialRanks);
      const index = list.findIndex(r => r.id === rank.id);
      if (index >= 0) {
        list[index] = rank;
      } else {
        list.push(rank);
      }
      setLocalData('ranks', list);
      return rank;
    },
    async delete(id: string): Promise<boolean> {
      if (isSupabaseConfigured) {
        try {
          const { error } = await supabase!.from('ranks').delete().eq('id', id);
          if (error) throw error;
          return true;
        } catch (err) {
          console.warn('Supabase delete failed, removing from LocalStorage:', err);
        }
      }
      const list = getLocalData<MonkRank>('ranks', initialRanks);
      const filtered = list.filter(r => r.id !== id);
      setLocalData('ranks', filtered);
      return true;
    }
  },

  // Financial API
  finance: {
    async list(): Promise<FinancialTransaction[]> {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase!.from('transactions').select('*').order('date', { ascending: false });
          if (error) throw error;
          return data as FinancialTransaction[];
        } catch (err) {
          console.warn('Supabase fetch failed, falling back to LocalStorage:', err);
        }
      }
      return getLocalData<FinancialTransaction>('transactions', initialTransactions);
    },
    async save(transaction: FinancialTransaction): Promise<FinancialTransaction> {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase!.from('transactions').upsert(transaction).select().single();
          if (error) throw error;
          return data as FinancialTransaction;
        } catch (err) {
          console.warn('Supabase save failed, saving to LocalStorage:', err);
        }
      }
      const list = getLocalData<FinancialTransaction>('transactions', initialTransactions);
      const index = list.findIndex(t => t.id === transaction.id);
      if (index >= 0) {
        list[index] = transaction;
      } else {
        list.push(transaction);
      }
      setLocalData('transactions', list);
      return transaction;
    },
    async delete(id: string): Promise<boolean> {
      if (isSupabaseConfigured) {
        try {
          const { error } = await supabase!.from('transactions').delete().eq('id', id);
          if (error) throw error;
          return true;
        } catch (err) {
          console.warn('Supabase delete failed, removing from LocalStorage:', err);
        }
      }
      const list = getLocalData<FinancialTransaction>('transactions', initialTransactions);
      const filtered = list.filter(t => t.id !== id);
      setLocalData('transactions', filtered);
      return true;
    }
  },

  // Events API
  events: {
    async list(): Promise<TempleEvent[]> {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase!.from('events').select('*').order('date', { ascending: true });
          if (error) throw error;
          return data as TempleEvent[];
        } catch (err) {
          console.warn('Supabase fetch failed, falling back to LocalStorage:', err);
        }
      }
      return getLocalData<TempleEvent>('events', initialEvents);
    },
    async save(event: TempleEvent): Promise<TempleEvent> {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase!.from('events').upsert(event).select().single();
          if (error) throw error;
          return data as TempleEvent;
        } catch (err) {
          console.warn('Supabase save failed, saving to LocalStorage:', err);
        }
      }
      const list = getLocalData<TempleEvent>('events', initialEvents);
      const index = list.findIndex(e => e.id === event.id);
      if (index >= 0) {
        list[index] = event;
      } else {
        list.push(event);
      }
      setLocalData('events', list);
      return event;
    },
    async delete(id: string): Promise<boolean> {
      if (isSupabaseConfigured) {
        try {
          const { error } = await supabase!.from('events').delete().eq('id', id);
          if (error) throw error;
          return true;
        } catch (err) {
          console.warn('Supabase delete failed, removing from LocalStorage:', err);
        }
      }
      const list = getLocalData<TempleEvent>('events', initialEvents);
      const filtered = list.filter(e => e.id !== id);
      setLocalData('events', filtered);
      return true;
    }
  },

  // Inventory API
  inventory: {
    async list(): Promise<InventoryItem[]> {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase!.from('inventory').select('*').order('name', { ascending: true });
          if (error) throw error;
          return data as InventoryItem[];
        } catch (err) {
          console.warn('Supabase fetch failed, falling back to LocalStorage:', err);
        }
      }
      return getLocalData<InventoryItem>('inventory', initialInventory);
    },
    async save(item: InventoryItem): Promise<InventoryItem> {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase!.from('inventory').upsert(item).select().single();
          if (error) throw error;
          return data as InventoryItem;
        } catch (err) {
          console.warn('Supabase save failed, saving to LocalStorage:', err);
        }
      }
      const list = getLocalData<InventoryItem>('inventory', initialInventory);
      const index = list.findIndex(i => i.id === item.id);
      if (index >= 0) {
        list[index] = item;
      } else {
        list.push(item);
      }
      setLocalData('inventory', list);
      return item;
    },
    async delete(id: string): Promise<boolean> {
      if (isSupabaseConfigured) {
        try {
          const { error } = await supabase!.from('inventory').delete().eq('id', id);
          if (error) throw error;
          return true;
        } catch (err) {
          console.warn('Supabase delete failed, removing from LocalStorage:', err);
        }
      }
      const list = getLocalData<InventoryItem>('inventory', initialInventory);
      const filtered = list.filter(i => i.id !== id);
      setLocalData('inventory', filtered);
      return true;
    }
  },

  // Borrow/Return API
  borrow: {
    async list(): Promise<BorrowRecord[]> {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase!.from('borrow_records').select('*').order('borrow_date', { ascending: false });
          if (error) throw error;
          return data as BorrowRecord[];
        } catch (err) {
          console.warn('Supabase fetch failed, falling back to LocalStorage:', err);
        }
      }
      return getLocalData<BorrowRecord>('borrow_records', initialBorrowRecords);
    },
    async save(record: BorrowRecord): Promise<BorrowRecord> {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase!.from('borrow_records').upsert(record).select().single();
          if (error) throw error;
          return data as BorrowRecord;
        } catch (err) {
          console.warn('Supabase save failed, saving to LocalStorage:', err);
        }
      }
      const list = getLocalData<BorrowRecord>('borrow_records', initialBorrowRecords);
      const index = list.findIndex(b => b.id === record.id);
      if (index >= 0) {
        list[index] = record;
      } else {
        list.push(record);
      }
      setLocalData('borrow_records', list);

      // Adjust inventory available qty based on borrow action
      const inventory = getLocalData<InventoryItem>('inventory', initialInventory);
      const item = inventory.find(i => i.id === record.item_id);
      if (item) {
        if (record.status === 'returned') {
          const previousRecord = getLocalData<BorrowRecord>('borrow_records', initialBorrowRecords).find(b => b.id === record.id);
          if (!previousRecord || previousRecord.status !== 'returned') {
            item.available_qty = Math.min(item.total_qty, item.available_qty + record.borrow_qty);
            const listInv = getLocalData<InventoryItem>('inventory', initialInventory);
            const idxInv = listInv.findIndex(i => i.id === item.id);
            if (idxInv >= 0) listInv[idxInv] = item;
            setLocalData('inventory', listInv);
          }
        } else {
          const isNew = index === -1;
          if (isNew) {
            item.available_qty = Math.max(0, item.available_qty - record.borrow_qty);
            const listInv = getLocalData<InventoryItem>('inventory', initialInventory);
            const idxInv = listInv.findIndex(i => i.id === item.id);
            if (idxInv >= 0) listInv[idxInv] = item;
            setLocalData('inventory', listInv);
          }
        }
      }

      return record;
    },
    async delete(id: string): Promise<boolean> {
      if (isSupabaseConfigured) {
        try {
          const { error } = await supabase!.from('borrow_records').delete().eq('id', id);
          if (error) throw error;
          return true;
        } catch (err) {
          console.warn('Supabase delete failed, removing from LocalStorage:', err);
        }
      }
      const list = getLocalData<BorrowRecord>('borrow_records', initialBorrowRecords);
      const filtered = list.filter(b => b.id !== id);
      setLocalData('borrow_records', filtered);
      return true;
    }
  },

  // Ashes API (ทะเบียนฝากกระดูก)
  ashes: {
    async list(): Promise<AshesRecord[]> {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase!.from('ashes').select('*').order('niche_code', { ascending: true });
          if (error) throw error;
          return data as AshesRecord[];
        } catch (err) {
          console.warn('Supabase fetch failed, falling back to LocalStorage:', err);
        }
      }
      return getLocalData<AshesRecord>('ashes', initialAshes);
    },
    async save(record: AshesRecord): Promise<AshesRecord> {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase!.from('ashes').upsert(record).select().single();
          if (error) throw error;
          return data as AshesRecord;
        } catch (err) {
          console.warn('Supabase save failed, saving to LocalStorage:', err);
        }
      }
      const list = getLocalData<AshesRecord>('ashes', initialAshes);
      const index = list.findIndex(a => a.id === record.id);
      if (index >= 0) {
        list[index] = record;
      } else {
        list.push(record);
      }
      setLocalData('ashes', list);
      return record;
    },
    async delete(id: string): Promise<boolean> {
      if (isSupabaseConfigured) {
        try {
          const { error } = await supabase!.from('ashes').delete().eq('id', id);
          if (error) throw error;
          return true;
        } catch (err) {
          console.warn('Supabase delete failed, removing from LocalStorage:', err);
        }
      }
      const list = getLocalData<AshesRecord>('ashes', initialAshes);
      const filtered = list.filter(a => a.id !== id);
      setLocalData('ashes', filtered);
      return true;
    }
  },

  // Dynamic System Menus API
  menus: {
    async list(): Promise<MenuItem[]> {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase!.from('menu_items').select('*').order('order', { ascending: true });
          if (error) throw error;
          if (data && data.length > 0) return data as MenuItem[];
        } catch (err) {
          console.warn('Supabase fetch menus failed, falling back to LocalStorage:', err);
        }
      }
      const list = getLocalData<MenuItem>('menu_items', initialMenuItems);
      let changed = false;
      initialMenuItems.forEach(item => {
        if (!list.some(m => m.id === item.id)) {
          list.push(item);
          changed = true;
        }
      });
      if (changed) {
        setLocalData('menu_items', list);
      }
      return list.sort((a, b) => a.order - b.order);
    },
    async save(item: MenuItem): Promise<MenuItem> {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase!.from('menu_items').upsert(item).select().single();
          if (error) throw error;
          return data as MenuItem;
        } catch (err) {
          console.warn('Supabase save menu failed, saving to LocalStorage:', err);
        }
      }
      const list = getLocalData<MenuItem>('menu_items', initialMenuItems);
      const index = list.findIndex(m => m.id === item.id);
      if (index >= 0) {
        list[index] = item;
      } else {
        list.push(item);
      }
      setLocalData('menu_items', list);
      return item;
    },
    async delete(id: string): Promise<boolean> {
      if (isSupabaseConfigured) {
        try {
          const { error } = await supabase!.from('menu_items').delete().eq('id', id);
          if (error) throw error;
          return true;
        } catch (err) {
          console.warn('Supabase delete menu failed, removing from LocalStorage:', err);
        }
      }
      const list = getLocalData<MenuItem>('menu_items', initialMenuItems);
      const filtered = list.filter(m => m.id !== id && m.parentId !== id);
      setLocalData('menu_items', filtered);
      return true;
    },
    async saveAll(items: MenuItem[]): Promise<MenuItem[]> {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase!.from('menu_items').upsert(items).select();
          if (error) throw error;
          if (data) return data as MenuItem[];
        } catch (err) {
          console.warn('Supabase bulk save menus failed, saving to LocalStorage:', err);
        }
      }
      setLocalData('menu_items', items);
      return items;
    },
    async reset(): Promise<MenuItem[]> {
      if (isSupabaseConfigured) {
        try {
          const { error: delError } = await supabase!.from('menu_items').delete().neq('id', 'dummy');
          if (delError) throw delError;
          const { data, error } = await supabase!.from('menu_items').insert(initialMenuItems).select();
          if (error) throw error;
          if (data) return data as MenuItem[];
        } catch (err) {
          console.warn('Supabase reset menus failed, resetting in LocalStorage:', err);
        }
      }
      setLocalData('menu_items', initialMenuItems);
      return initialMenuItems;
    }
  },

  // System Settings API (เปลี่ยนชื่อวัด, โลโก้, สีธีม)
  settings: {
    async get(): Promise<TempleSettings> {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase!.from('settings').select('*').limit(1);
          if (error) throw error;
          if (data && data.length > 0) return data[0] as TempleSettings;
        } catch (err) {
          console.warn('Supabase fetch settings failed, falling back to LocalStorage:', err);
        }
      }
      if (typeof window === 'undefined') return defaultSettings;
      const data = localStorage.getItem('temple_sys_config_settings');
      if (!data) {
        localStorage.setItem('temple_sys_config_settings', JSON.stringify(defaultSettings));
        return defaultSettings;
      }
      return JSON.parse(data);
    },
    async save(settings: TempleSettings): Promise<TempleSettings> {
      if (isSupabaseConfigured) {
        try {
          // Upsert settings (assuming single config row)
          const { data, error } = await supabase!.from('settings').upsert({ id: 'config-1', ...settings }).select().single();
          if (error) throw error;
          return data as TempleSettings;
        } catch (err) {
          console.warn('Supabase save settings failed, saving to LocalStorage:', err);
        }
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('temple_sys_config_settings', JSON.stringify(settings));
      }
      return settings;
    }
  },

  // Users API
  users: {
    async list(): Promise<SystemUser[]> {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase!.from('system_users').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          return data as SystemUser[];
        } catch (err) {
          console.warn('Supabase fetch system_users failed, falling back to LocalStorage:', err);
        }
      }
      return getLocalData<SystemUser>('system_users', initialUsers);
    },
    async save(user: SystemUser): Promise<SystemUser> {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase!.from('system_users').upsert(user).select().single();
          if (error) throw error;
          return data as SystemUser;
        } catch (err) {
          console.warn('Supabase save system_user failed, saving to LocalStorage:', err);
        }
      }
      const list = getLocalData<SystemUser>('system_users', initialUsers);
      const index = list.findIndex(u => u.id === user.id);
      if (index >= 0) {
        list[index] = user;
      } else {
        list.push(user);
      }
      setLocalData('system_users', list);
      return user;
    },
    async delete(id: string): Promise<boolean> {
      if (isSupabaseConfigured) {
        try {
          const { error } = await supabase!.from('system_users').delete().eq('id', id);
          if (error) throw error;
          return true;
        } catch (err) {
          console.warn('Supabase delete system_user failed, removing from LocalStorage:', err);
        }
      }
      const list = getLocalData<SystemUser>('system_users', initialUsers);
      const filtered = list.filter(u => u.id !== id);
      setLocalData('system_users', filtered);
      return true;
    }
  }
};
