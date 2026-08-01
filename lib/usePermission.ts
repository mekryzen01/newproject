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
  isAbbot: boolean;
  isEditor: boolean;
  isStaff: boolean;
  isMember: boolean;
  loaded: boolean;
}

export function usePermission(): UsePermissionReturn {
  const [user, setUser] = useState<SessionUser | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('temple_session');
        if (raw) {
          const session = JSON.parse(raw);
          return session?.user ?? null;
        }
      } catch {
        // ignore
      }
    }
    return null;
  });
  const [loaded, setLoaded] = useState(() => typeof window !== 'undefined');

  useEffect(() => {
    setLoaded(true);
  }, []);

  const role = (user?.role ?? 'member') as Role;
  const permissions = getPermissions(role);

  return {
    user,
    role,
    roleLabel: ROLE_LABELS[role] ?? 'สมาชิกทั่วไป (พระ-เณร)',
    roleBadgeClass: ROLE_COLORS[role] ?? ROLE_COLORS.member,
    permissions,
    isAdmin: role === 'admin',
    isAbbot: role === 'abbot',
    isEditor: role === 'editor',
    isStaff: role === 'staff',
    isMember: role === 'member',
    loaded,
  };
}
