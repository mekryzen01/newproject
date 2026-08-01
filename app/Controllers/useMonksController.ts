'use client';

import { useState, useEffect } from 'react';
import { db, Monk, MonkRank } from '@/lib/db';
import { offlineSyncManager } from '@/lib/offlineSync';

export function useMonksController() {
  const [monks, setMonks] = useState<Monk[]>([]);
  const [ranks, setRanks] = useState<MonkRank[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMonk, setCurrentMonk] = useState<Partial<Monk> | null>(null);
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
  const loadMonks = async () => {
    setLoading(true);
    try {
      const [list, rankList] = await Promise.all([
        db.monks.list(),
        db.ranks.list()
      ]);
      setMonks(list);
      setRanks(rankList);
    } catch (err) {
      console.error('Failed to load monks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonks();
  }, []);

  const handleOpenAddModal = () => {
    setCurrentMonk({
      id: `m-${Date.now()}`,
      name: '',
      chaya: '',
      rank: 'พระลูกวัด',
      ordination_date: new Date().toISOString().split('T')[0],
      phone: '',
      status: 'active',
      image_url: '',
      certificate_url: '',
      id_card_url: '',
      father_name: '',
      mother_name: '',
      emergency_contact: '',
      emergency_phone: '',
      novice_ordination_date: '',
      domicile_address: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (monk: Monk) => {
    setCurrentMonk({ ...monk });
    setIsModalOpen(true);
  };

  const handleDeleteMonk = (id: string) => {
    setConfirmState({
      show: true,
      title: 'ยืนยันการลบข้อมูล',
      description: 'คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลพระภิกษุรูปนี้ออกจากระบบ? การดำเนินการนี้ไม่สามารถย้อนกลับได้',
      onConfirm: async () => {
        setConfirmState(null);
        if (typeof window !== 'undefined' && !navigator.onLine) {
          offlineSyncManager.queueAction('monk', 'delete', id, 'ลบทะเบียนพระภิกษุสามเณร');
          setAlertState({
            show: true,
            variant: 'warning',
            title: 'ลบออฟไลน์สำเร็จ 📶',
            description: 'รายการถูกบันทึกการลบในความจำเครื่องแล้ว และจะทำการซิงค์ลบให้อัตโนมัติเมื่อเน็ตกลับมา'
          });
          setTimeout(() => setAlertState(null), 4000);
          return;
        }

        try {
          await db.monks.delete(id);
          loadMonks();
          setAlertState({
            show: true,
            variant: 'success',
            title: 'ลบข้อมูลสำเร็จ',
            description: 'ลบทะเบียนรายชื่อพระภิกษุสามเณรเรียบร้อยแล้ว'
          });
          setTimeout(() => setAlertState(null), 4000);
        } catch (err: any) {
          if (err.message?.includes('fetch') || (typeof window !== 'undefined' && !navigator.onLine)) {
            offlineSyncManager.queueAction('monk', 'delete', id, 'ลบทะเบียนพระภิกษุสามเณร');
            setAlertState({
              show: true,
              variant: 'warning',
              title: 'ลบออฟไลน์สำเร็จ 📶',
              description: 'เน็ตขัดข้อง รายการถูกบันทึกการลบในความจำเครื่องแล้ว และจะทำการซิงค์ลบให้อัตโนมัติเมื่อเน็ตกลับมา'
            });
            setTimeout(() => setAlertState(null), 4000);
          } else {
            setAlertState({
              show: true,
              variant: 'destructive',
              title: 'เกิดข้อผิดพลาดในการลบข้อมูล',
              description: 'ไม่สามารถลบข้อมูลรายชื่อรูปนี้ได้'
            });
          }
        }
      }
    });
  };

  const handleSaveMonk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMonk || !currentMonk.name) return;

    if (typeof window !== 'undefined' && !navigator.onLine) {
      offlineSyncManager.queueAction(
        'monk',
        currentMonk.id ? 'update' : 'create',
        currentMonk,
        `ทะเบียนพระ (${currentMonk.name})`
      );
      setIsModalOpen(false);
      setCurrentMonk(null);
      setAlertState({
        show: true,
        variant: 'warning',
        title: 'บันทึกออฟไลน์สำเร็จ 📶',
        description: 'ขณะนี้เครื่องไม่มีสัญญาณอินเทอร์เน็ต ข้อมูลพระถูกบันทึกไว้ในเครื่องแล้ว และจะทำการซิงค์ให้อัตโนมัติเมื่อเน็ตกลับมา'
      });
      setTimeout(() => setAlertState(null), 5000);
      return;
    }

    setIsSaving(true);
    try {
      await db.monks.save(currentMonk as Monk);
      setIsModalOpen(false);
      setCurrentMonk(null);
      loadMonks();
      setAlertState({
        show: true,
        variant: 'success',
        title: 'บันทึกข้อมูลสำเร็จ',
        description: 'บันทึกข้อมูลทะเบียนพระภิกษุสามเณรเรียบร้อยแล้ว'
      });
      setTimeout(() => setAlertState(null), 4000);
    } catch (err: any) {
      if (err.message?.includes('fetch') || (typeof window !== 'undefined' && !navigator.onLine)) {
        offlineSyncManager.queueAction(
          'monk',
          currentMonk.id ? 'update' : 'create',
          currentMonk,
          `ทะเบียนพระ (${currentMonk.name})`
        );
        setIsModalOpen(false);
        setCurrentMonk(null);
        setAlertState({
          show: true,
          variant: 'warning',
          title: 'บันทึกออฟไลน์สำเร็จ 📶',
          description: 'เน็ตขัดข้อง ข้อมูลพระถูกบันทึกไว้ในเครื่องแล้ว และจะทำการซิงค์ให้อัตโนมัติเมื่อเน็ตกลับมา'
        });
        setTimeout(() => setAlertState(null), 5000);
      } else {
        setAlertState({
          show: true,
          variant: 'destructive',
          title: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
          description: 'ไม่สามารถบันทึกข้อมูลทะเบียนพระภิกษุสามเณรได้'
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const updateFormFields = <K extends keyof Monk>(field: K, value: Monk[K]) => {
    if (!currentMonk) return;
    setCurrentMonk((prev) => ({ ...prev, [field]: value }));
  };

  // Filter & Search
  const filteredMonks = monks.filter(monk => {
    const matchesSearch = monk.name.includes(search) || monk.chaya.includes(search) || monk.phone.includes(search);
    const matchesStatus = statusFilter === 'all' || monk.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return {
    monks,
    ranks,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    loading,
    isModalOpen,
    setIsModalOpen,
    currentMonk,
    setCurrentMonk,
    isSaving,
    alertState,
    confirmState,
    setConfirmState,
    handleOpenAddModal,
    handleOpenEditModal,
    handleDeleteMonk,
    handleSaveMonk,
    updateFormFields,
    filteredMonks
  };
}
