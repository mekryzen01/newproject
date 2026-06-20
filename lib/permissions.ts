/**
 * Temple System — Role Permission Matrix
 *
 * Roles:
 *  admin  — ผู้ดูแลระบบ: สิทธิ์เต็ม
 *  editor — ผู้แก้ไขข้อมูล: เพิ่ม/แก้ไขได้ ลบไม่ได้ ไม่เข้าหน้า Users/Settings
 *  staff  — เจ้าหน้าที่วัด: ดูและบันทึกได้ ลบไม่ได้ ไม่เข้าหน้า Users/Settings/MenuManager
 */

export type Role = 'admin' | 'editor' | 'staff';

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
  },
};

export function getPermissions(role?: string): PermissionSet {
  const r = (role ?? 'staff') as Role;
  return ROLE_PERMISSIONS[r] ?? ROLE_PERMISSIONS.staff;
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'ผู้ดูแลระบบ',
  editor: 'ผู้แก้ไขข้อมูล',
  staff: 'เจ้าหน้าที่วัด',
};

export const ROLE_COLORS: Record<Role, string> = {
  admin: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
  editor: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  staff: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
};

/** Pages that require admin-only access */
export const ADMIN_ONLY_PATHS = ['/dashboard/users'];

/** Pages that require at least editor access (admin | editor) */
export const EDITOR_PLUS_PATHS = ['/dashboard/settings', '/dashboard/ranks'];

/** Pages that require admin access for menu management */
export const ADMIN_MENU_PATHS = ['/dashboard/menu-manager'];
