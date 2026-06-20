'use client';

import { useState, useEffect } from 'react';
import { db, SystemUser } from '@/lib/db';

export function useUsersController() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<SystemUser> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [alertState, setAlertState] = useState<{
    show: boolean;
    variant: 'success' | 'destructive' | 'warning';
    title: string;
    description: string;
  } | null>(null);

  const [confirmState, setConfirmState] = useState<{
    show: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  // Load Data
  const loadUsers = async () => {
    setLoading(true);
    try {
      const list = await db.users.list();
      setUsers(list);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenAddModal = () => {
    setCurrentUser({
      id: crypto.randomUUID(),
      email: '',
      fullName: '',
      role: 'staff',
      phone: '',
      password: '',
      created_at: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: SystemUser) => {
    setCurrentUser({ ...user });
    setIsModalOpen(true);
  };

  const handleDeleteUser = (id: string) => {
    // Prevent self-deletion if logged in user is deleting their own account
    const sessionStr = localStorage.getItem('temple_session');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        const currentUserEmail = session.user?.email;
        const targetUser = users.find(u => u.id === id);
        if (targetUser && targetUser.email === currentUserEmail) {
          setAlertState({
            show: true,
            variant: 'destructive',
            title: 'ไม่สามารถลบข้อมูลได้',
            description: 'คุณไม่สามารถลบบัญชีผู้ใช้งานที่กำลังล็อกอินอยู่ได้'
          });
          setTimeout(() => setAlertState(null), 4000);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }

    setConfirmState({
      show: true,
      title: 'ยืนยันการลบผู้ใช้งาน',
      description: 'คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้งานนี้ออกจากระบบ? บัญชีนี้จะไม่สามารถลงชื่อเข้าใช้งานได้อีก',
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await db.users.delete(id);
          loadUsers();
          setAlertState({
            show: true,
            variant: 'success',
            title: 'ลบข้อมูลสำเร็จ',
            description: 'ลบข้อมูลผู้ใช้งานเรียบร้อยแล้ว'
          });
          setTimeout(() => setAlertState(null), 4000);
        } catch (err) {
          setAlertState({
            show: true,
            variant: 'destructive',
            title: 'เกิดข้อผิดพลาดในการลบข้อมูล',
            description: 'ไม่สามารถลบข้อมูลผู้ใช้งานได้'
          });
        }
      }
    });
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !currentUser.email || !currentUser.fullName || !currentUser.password) return;

    setIsSaving(true);
    try {
      await db.users.save(currentUser as SystemUser);
      setIsModalOpen(false);
      setCurrentUser(null);
      loadUsers();
      setAlertState({
        show: true,
        variant: 'success',
        title: 'บันทึกข้อมูลสำเร็จ',
        description: 'บันทึกข้อมูลผู้ใช้งานระบบเรียบร้อยแล้ว'
      });
      setTimeout(() => setAlertState(null), 4000);
    } catch (err) {
      setAlertState({
        show: true,
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
        description: 'ไม่สามารถบันทึกข้อมูลผู้ใช้งานได้'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateFormFields = <K extends keyof SystemUser>(field: K, value: SystemUser[K]) => {
    if (!currentUser) return;
    setCurrentUser((prev) => ({ ...prev, [field]: value }));
  };

  return {
    users,
    loading,
    isModalOpen,
    setIsModalOpen,
    currentUser,
    setCurrentUser,
    isSaving,
    alertState,
    confirmState,
    setConfirmState,
    handleOpenAddModal,
    handleOpenEditModal,
    handleDeleteUser,
    handleSaveUser,
    updateFormFields,
    loadUsers
  };
}
