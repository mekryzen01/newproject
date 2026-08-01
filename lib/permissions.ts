/**
 * Temple System — Role Permission Matrix
 *
 * Roles:
 *  admin  — ผู้ดูแลระบบ: สิทธิ์เต็ม
 *  editor — ผู้แก้ไขข้อมูล: เพิ่ม/แก้ไขได้ ลบไม่ได้ ไม่เข้าหน้า Users/Settings
 *  staff  — เจ้าหน้าที่วัด: ดูและบันทึกได้ ลบไม่ได้ ไม่เข้าหน้า Users/Settings/MenuManager
 */

export type Role = 'admin' | 'abbot' | 'editor' | 'staff' | 'member';

export interface PermissionSet {
  canCreate: boolean;       // บันทึกข้อมูลใหม่
  canEdit: boolean;         // แก้ไขข้อมูล
  canDelete: boolean;       // ลบข้อมูล
  canViewUsers: boolean;    // เข้าหน้าจัดการผู้ใช้งาน
  canEditUsers: boolean;    // เพิ่ม/แก้ไข/ลบ ผู้ใช้งาน
  canViewSettings: boolean; // เข้าหน้าตั้งค่าระบบ
  canEditSettings: boolean; // แก้ไขตั้งค่าระบบ
  canManageMenus: boolean;  // จัดการเมนูระบบ
  canManageRanks: boolean;  // จัดการสมณศักดิ์/หน้าที่
  canViewFinanceSummary: boolean; // ดูสรุปภาพรวมยอดเงินและกราฟการเงิน
  canEditFinanceIncome: boolean;  // บันทึก/แก้ไข รายรับ
  canEditFinanceExpense: boolean; // บันทึก/แก้ไข รายจ่าย
  canViewPersonal: boolean;       // ดูข้อมูลและตารางงานส่วนบุคคล
  canViewMonksDirectory: boolean; // ดูทะเบียนทำเนียบศาสนบุคลากร/พระภิกษุสามเณร
}

export const ROLE_PERMISSIONS: Record<Role, PermissionSet> = {
  admin: {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canViewUsers: true,
    canEditUsers: true,
    canViewSettings: true,
    canEditSettings: true,
    canManageMenus: true,
    canManageRanks: true,
    canViewFinanceSummary: true,
    canEditFinanceIncome: true,
    canEditFinanceExpense: true,
    canViewPersonal: true,
    canViewMonksDirectory: true,
  },
  abbot: {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canViewUsers: true,
    canEditUsers: true,
    canViewSettings: true,
    canEditSettings: true,
    canManageMenus: true,
    canManageRanks: true,
    canViewFinanceSummary: true,
    canEditFinanceIncome: true,
    canEditFinanceExpense: true,
    canViewPersonal: true,
    canViewMonksDirectory: true,
  },
  editor: {
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canViewUsers: false,
    canEditUsers: false,
    canViewSettings: true,
    canEditSettings: false,
    canManageMenus: false,
    canManageRanks: true,
    canViewFinanceSummary: true,
    canEditFinanceIncome: true,
    canEditFinanceExpense: true,
    canViewPersonal: true,
    canViewMonksDirectory: true,
  },
  staff: {
    canCreate: true,
    canEdit: false,
    canDelete: false,
    canViewUsers: false,
    canEditUsers: false,
    canViewSettings: false,
    canEditSettings: false,
    canManageMenus: false,
    canManageRanks: false,
    canViewFinanceSummary: false, // เจ้าหน้าที่เห็นเฉพาะฟอร์มคีย์ข้อมูล ซ่อนกราฟและภาพรวมยอดเงินสุทธิ
    canEditFinanceIncome: true,  // เจ้าหน้าที่บันทึกตู้บริจาค/รายรับได้
    canEditFinanceExpense: false, // เจ้าหน้าที่ลงรายจ่ายไม่ได้ (ต้องเป็น Editor ขึ้นไป)
    canViewPersonal: true,
    canViewMonksDirectory: true,
  },
  member: {
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canViewUsers: false,
    canEditUsers: false,
    canViewSettings: false,
    canEditSettings: false,
    canManageMenus: false,
    canManageRanks: false,
    canViewFinanceSummary: false,
    canEditFinanceIncome: false,
    canEditFinanceExpense: false,
    canViewPersonal: true, // พระ-เณรทั่วไป เข้าดูตารางนิมนต์ส่วนตัวและบัญชีส่วนตัวได้
    canViewMonksDirectory: true, // อนุญาตให้เข้าดูข้อมูลส่วนตัวศาสนบุคลากรของตนเอง
  },
};

export function getPermissions(role?: string): PermissionSet {
  const r = (role ?? 'member') as Role;
  if (typeof window !== 'undefined') {
    try {
      const custom = localStorage.getItem('temple_custom_permissions');
      if (custom) {
        const parsed = JSON.parse(custom);
        if (parsed && parsed[r]) {
          // Merge with default to guarantee all properties exist
          return { ...ROLE_PERMISSIONS[r], ...parsed[r] };
        }
      }
    } catch (e) {
      console.error('Failed to load custom permissions:', e);
    }
  }
  return ROLE_PERMISSIONS[r] ?? ROLE_PERMISSIONS.member;
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'ผู้ดูแลระบบ',
  abbot: 'เจ้าอาวาส / ผู้บริหาร',
  editor: 'ผู้แก้ไขข้อมูล',
  staff: 'เจ้าหน้าที่วัด',
  member: 'สมาชิกทั่วไป (พระ-เณร)',
};

export const ROLE_COLORS: Record<Role, string> = {
  admin: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
  abbot: 'bg-amber-600/10 text-amber-800 dark:text-amber-300 border-amber-600/20',
  editor: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  staff: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  member: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
};

/** Pages that require admin-only access */
export const ADMIN_ONLY_PATHS = ['/dashboard/users', '/dashboard/system-logs'];

/** Pages that require at least editor access (admin | editor) */
export const EDITOR_PLUS_PATHS = ['/dashboard/settings', '/dashboard/ranks'];

/** Pages that require admin access for menu management */
export const ADMIN_MENU_PATHS = ['/dashboard/menu-manager'];
