'use client';

import { useState, useEffect } from 'react';
import { db, AshesRecord } from '@/lib/db';

// Helper: get current logged-in user's name from session
function getCurrentUserName(): string {
  if (typeof window === 'undefined') return '';
  try {
    const raw = localStorage.getItem('temple_session');
    if (!raw) return '';
    const session = JSON.parse(raw);
    return session?.user?.name || session?.user?.email || '';
  } catch {
    return '';
  }
}

export function useAshesController() {
  const [records, setRecords] = useState<AshesRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<Partial<AshesRecord> | null>(null);
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
  const loadRecords = async () => {
    setLoading(true);
    try {
      const list = await db.ashes.list();
      setRecords(list);
    } catch (err) {
      console.error('Failed to load ashes data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleOpenAddModal = () => {
    setCurrentRecord({
      id: `ash-${Date.now()}`,
      deceased_name: '',
      death_date: new Date().toISOString().split('T')[0],
      niche_code: '',
      relative_name: '',
      relative_phone: '',
      deposit_date: new Date().toISOString().split('T')[0],
      deposited_by: getCurrentUserName(),
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (record: AshesRecord) => {
    setCurrentRecord({
      ...record,
      // Backfill if old record has no deposited_by
      deposited_by: record.deposited_by || getCurrentUserName()
    });
    setIsModalOpen(true);
  };

  const handleDeleteRecord = (id: string) => {
    setConfirmState({
      show: true,
      title: 'ยืนยันการลบข้อมูล',
      description: 'คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลฝากอัฐิรายการนี้ออกจากระบบ? การดำเนินการนี้ไม่สามารถย้อนกลับได้',
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await db.ashes.delete(id);
          loadRecords();
          setAlertState({
            show: true,
            variant: 'success',
            title: 'ลบข้อมูลสำเร็จ',
            description: 'ลบทะเบียนฝากกระดูกเรียบร้อยแล้ว'
          });
          setTimeout(() => setAlertState(null), 4000);
        } catch (err) {
          setAlertState({
            show: true,
            variant: 'destructive',
            title: 'เกิดข้อผิดพลาดในการลบ',
            description: 'ไม่สามารถลบทะเบียนฝากกระดูกรายการนี้ได้'
          });
        }
      }
    });
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRecord || !currentRecord.deceased_name || !currentRecord.niche_code || !currentRecord.relative_name || !currentRecord.deposited_by) return;

    // Validate niche_code format: digits/digits
    if (!/^[0-9]+\/[0-9]+$/.test(currentRecord.niche_code)) {
      setAlertState({
        show: true,
        variant: 'warning',
        title: 'รูปแบบตู้ที่/ล็อกที่ไม่ถูกต้อง',
        description: 'กรุณากรอกในรูปแบบ ตัวเลข/ตัวเลข เช่น 1/12 หรือ 3/6'
      });
      setTimeout(() => setAlertState(null), 4000);
      return;
    }

    setIsSaving(true);
    try {
      await db.ashes.save(currentRecord as AshesRecord);
      setIsModalOpen(false);
      setCurrentRecord(null);
      loadRecords();
      setAlertState({
        show: true,
        variant: 'success',
        title: 'บันทึกข้อมูลสำเร็จ',
        description: 'บันทึกข้อมูลทะเบียนฝากกระดูกเรียบร้อยแล้ว'
      });
      setTimeout(() => setAlertState(null), 4000);
    } catch (err) {
      setAlertState({
        show: true,
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
        description: 'ไม่สามารถบันทึกข้อมูลทะเบียนฝากกระดูกรายการนี้ได้'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateFormFields = <K extends keyof AshesRecord>(field: K, value: AshesRecord[K]) => {
    if (!currentRecord) return;
    setCurrentRecord((prev) => ({ ...prev, [field]: value }));
  };

  // Filter & Search
  const filteredRecords = records.filter(record => {
    return (
      record.deceased_name.toLowerCase().includes(search.toLowerCase()) ||
      record.relative_name.toLowerCase().includes(search.toLowerCase()) ||
      record.niche_code.toLowerCase().includes(search.toLowerCase()) ||
      (record.notes && record.notes.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return {
    records,
    loading,
    search,
    setSearch,
    isModalOpen,
    setIsModalOpen,
    currentRecord,
    setCurrentRecord,
    isSaving,
    alertState,
    confirmState,
    setConfirmState,
    handleOpenAddModal,
    handleOpenEditModal,
    handleDeleteRecord,
    handleSaveRecord,
    updateFormFields,
    filteredRecords
  };
}
