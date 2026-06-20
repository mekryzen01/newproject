'use client';

import { useState, useEffect } from 'react';
import { db, TempleEvent, Monk } from '@/lib/db';

export function useScheduleController() {
  const [events, setEvents] = useState<TempleEvent[]>([]);
  const [monks, setMonks] = useState<Monk[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Partial<TempleEvent> | null>(null);
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
  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsList, monksList] = await Promise.all([
        db.events.list(),
        db.monks.list()
      ]);
      setEvents(eventsList);
      setMonks(monksList.filter(m => m.status === 'active')); // Only assign active monks
    } catch (err) {
      console.error('Failed to load schedule data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddModal = () => {
    setCurrentEvent({
      id: `e-${Date.now()}`,
      title: '',
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      location: '',
      host_name: '',
      monks_needed: 9,
      assigned_monks: [],
      status: 'upcoming'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (event: TempleEvent) => {
    setCurrentEvent({ ...event });
    setIsModalOpen(true);
  };

  const handleDeleteEvent = (id: string) => {
    setConfirmState({
      show: true,
      title: 'ยืนยันการลบตารางงานนิมนต์',
      description: 'คุณต้องการลบตารางงานนิมนต์นี้ออกใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้',
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await db.events.delete(id);
          loadData();
          setAlertState({
            show: true,
            variant: 'success',
            title: 'ลบข้อมูลสำเร็จ',
            description: 'ลบตารางงานนิมนต์ออกจากระบบเรียบร้อยแล้ว'
          });
          setTimeout(() => setAlertState(null), 4000);
        } catch (err) {
          setAlertState({
            show: true,
            variant: 'destructive',
            title: 'เกิดข้อผิดพลาดในการลบรายการ',
            description: 'ไม่สามารถลบตารางงานนิมนต์รายการนี้ได้'
          });
        }
      }
    });
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent || !currentEvent.title || !currentEvent.location || !currentEvent.host_name) return;

    setIsSaving(true);
    try {
      await db.events.save(currentEvent as TempleEvent);
      setIsModalOpen(false);
      setCurrentEvent(null);
      loadData();
      setAlertState({
        show: true,
        variant: 'success',
        title: 'บันทึกสำเร็จ',
        description: 'บันทึกตารางงานนิมนต์และศาสนพิธีเรียบร้อยแล้ว'
      });
      setTimeout(() => setAlertState(null), 4000);
    } catch (err) {
      setAlertState({
        show: true,
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาดในการบันทึกตาราง',
        description: 'ไม่สามารถจัดเก็บข้อมูลตารางงานนิมนต์รายการนี้ได้'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateFormFields = <K extends keyof TempleEvent>(field: K, value: TempleEvent[K]) => {
    if (!currentEvent) return;
    setCurrentEvent((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleMonkSelection = (monkId: string) => {
    if (!currentEvent) return;
    const assigned = currentEvent.assigned_monks || [];
    let updated: string[];
    if (assigned.includes(monkId)) {
      updated = assigned.filter(id => id !== monkId);
    } else {
      updated = [...assigned, monkId];
    }
    setCurrentEvent({ ...currentEvent, assigned_monks: updated });
  };

  // Filter & Search
  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.title.toLowerCase().includes(search.toLowerCase()) || 
      event.location.toLowerCase().includes(search.toLowerCase()) || 
      event.host_name.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return {
    events,
    monks,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    isModalOpen,
    setIsModalOpen,
    currentEvent,
    setCurrentEvent,
    isSaving,
    alertState,
    confirmState,
    setConfirmState,
    handleOpenAddModal,
    handleOpenEditModal,
    handleDeleteEvent,
    handleSaveEvent,
    updateFormFields,
    handleToggleMonkSelection,
    filteredEvents
  };
}
