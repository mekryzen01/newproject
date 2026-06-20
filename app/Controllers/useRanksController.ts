'use client';

import { useState, useEffect } from 'react';
import { db, MonkRank } from '@/lib/db';

export function useRanksController() {
  const [ranks, setRanks] = useState<MonkRank[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRank, setCurrentRank] = useState<Partial<MonkRank> | null>(null);
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
  const loadRanks = async () => {
    setLoading(true);
    try {
      const list = await db.ranks.list();
      setRanks(list);
    } catch (err) {
      console.error('Failed to load ranks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRanks();
  }, []);

  const handleOpenAddModal = () => {
    setCurrentRank({
      id: `r-${Date.now()}`,
      name: '',
      is_novice: false,
      person_type: 'monk',
      order: ranks.length + 1
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rank: MonkRank) => {
    setCurrentRank({ ...rank });
    setIsModalOpen(true);
  };

  const handleDeleteRank = (id: string) => {
    setConfirmState({
      show: true,
      title: 'ยืนยันการลบข้อมูล',
      description: 'คุณแน่ใจหรือไม่ว่าต้องการลบสมณศักดิ์/หน้าที่นี้ออกจากระบบ? การดำเนินการนี้จะไม่ส่งผลย้อนหลังกับข้อมูลพระเณรที่มีอยู่ในระบบในทันที แต่อาจมีผลกับการเลือกในภายหลัง',
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await db.ranks.delete(id);
          loadRanks();
          setAlertState({
            show: true,
            variant: 'success',
            title: 'ลบข้อมูลสำเร็จ',
            description: 'ลบข้อมูลสมณศักดิ์/หน้าที่เรียบร้อยแล้ว'
          });
          setTimeout(() => setAlertState(null), 4000);
        } catch (err) {
          setAlertState({
            show: true,
            variant: 'destructive',
            title: 'เกิดข้อผิดพลาดในการลบข้อมูล',
            description: 'ไม่สามารถลบข้อมูลสมณศักดิ์/หน้าที่ได้'
          });
        }
      }
    });
  };

  const handleSaveRank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRank || !currentRank.name) return;

    setIsSaving(true);
    try {
      await db.ranks.save(currentRank as MonkRank);
      setIsModalOpen(false);
      setCurrentRank(null);
      loadRanks();
      setAlertState({
        show: true,
        variant: 'success',
        title: 'บันทึกข้อมูลสำเร็จ',
        description: 'บันทึกข้อมูลสมณศักดิ์/หน้าที่เรียบร้อยแล้ว'
      });
      setTimeout(() => setAlertState(null), 4000);
    } catch (err) {
      setAlertState({
        show: true,
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
        description: 'ไม่สามารถบันทึกข้อมูลสมณศักดิ์/หน้าที่ได้'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateFormFields = <K extends keyof MonkRank>(field: K, value: MonkRank[K]) => {
    if (!currentRank) return;
    setCurrentRank((prev) => ({ ...prev, [field]: value }));
  };

  return {
    ranks,
    loading,
    isModalOpen,
    setIsModalOpen,
    currentRank,
    setCurrentRank,
    isSaving,
    alertState,
    confirmState,
    setConfirmState,
    handleOpenAddModal,
    handleOpenEditModal,
    handleDeleteRank,
    handleSaveRank,
    updateFormFields,
    loadRanks
  };
}
