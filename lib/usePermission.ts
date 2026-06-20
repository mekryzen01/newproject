'use client';

import { useState, useEffect } from 'react';
import { getPermissions, PermissionSet, Role, ROLE_LABELS, ROLE_COLORS } from './permissions';

interface SessionUser {
  name: string;
  email: string;
  role: Role;
}

interface UsePermissionReturn {
  user: SessionUser | null;
  role: Role;
  roleLabel: string;
  roleBadgeClass: string;
  permissions: PermissionSet;
  isAdmin: boolean;
  isEditor: boolean;
  isStaff: boolean;
  loaded: boolean;
}

export function usePermission(): UsePermissionReturn {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('temple_session');
      if (raw) {
        const session = JSON.parse(raw);
        setUser(session?.user ?? null);
      }
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  const role = (user?.role ?? 'staff') as Role;
  const permissions = getPermissions(role);

  return {
    user,
    role,
    roleLabel: ROLE_LABELS[role] ?? 'เจ้าหน้าที่วัด',
    roleBadgeClass: ROLE_COLORS[role] ?? ROLE_COLORS.staff,
    permissions,
    isAdmin: role === 'admin',
    isEditor: role === 'editor',
    isStaff: role === 'staff',
    loaded,
  };
}
