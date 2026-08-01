'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Trash,
  Edit,
  Loader2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  CalendarDays,
  Settings,
  Printer,
  BarChart3,
  Repeat,
  Award,
  Filter,
  Check,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomDialog } from '@/components/ui/custom-dialog';
import { db, Monk, MonkDuty, MonkDutyType } from '@/lib/db';
import { usePermission } from '@/lib/usePermission';
import { formatThaiDate } from '@/lib/utils';
import { ThaiDatePicker } from '@/components/ui/thai-date-picker';
import { offlineSyncManager } from '@/lib/offlineSync';

const THAI_MONTHS_LONG = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const WEEKDAYS_THAI = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

export default function MonkDutiesPage() {
  const { permissions, role, loaded: permLoaded } = usePermission();
  const [monks, setMonks] = useState<Monk[]>([]);
  const [duties, setDuties] = useState<MonkDuty[]>([]);
  const [dutyTypes, setDutyTypes] = useState<MonkDutyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'swapped'>('all');

  // View Mode: 'calendar' | 'cards'
  const [viewMode, setViewMode] = useState<'calendar' | 'cards'>('calendar');

  // Calendar View Month/Year navigation
  const today = new Date();
  const [calYear, setCalYear] = useState<number>(today.getFullYear()); // CE year
  const [calMonth, setCalMonth] = useState<number>(today.getMonth()); // 0-indexed

  // Modal States for Monk Duty
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDuty, setCurrentDuty] = useState<Partial<MonkDuty> | null>(null);
  const [selectedMonkIds, setSelectedMonkIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Recurrence & Time Preset States
  const [repeatMode, setRepeatMode] = useState<'single' | 'range' | 'weekly' | 'monthly' | 'daily'>('single');
  const [dutyStartDate, setDutyStartDate] = useState<string>(today.toISOString().split('T')[0]);
  const [dutyEndDate, setDutyEndDate] = useState<string>(today.toISOString().split('T')[0]);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);

  // Duty Type Manager Modal States
  const [isTypeManagerOpen, setIsTypeManagerOpen] = useState(false);
  const [isTypeEditModalOpen, setIsTypeEditModalOpen] = useState(false);
  const [currentDutyType, setCurrentDutyType] = useState<Partial<MonkDutyType> | null>(null);

  // Feature 2: Duty Swap Modal State
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [dutyToSwap, setDutyToSwap] = useState<MonkDuty | null>(null);
  const [targetSwapMonkId, setTargetSwapMonkId] = useState<string>('');
  const [swapReason, setSwapReason] = useState<string>('');

  // Feature 4: Analytics Modal State
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  // Auto Rotate Modal State
  const [isAutoRotateOpen, setIsAutoRotateOpen] = useState(false);
  const [autoRotateDate, setAutoRotateDate] = useState<string>(today.toISOString().split('T')[0]);
  const [autoRotateDays, setAutoRotateDays] = useState<number>(7);

  // Alert & Confirm Dialog States
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

  // Member user tracking
  const [currentUserMonkId, setCurrentUserMonkId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [monksData, dutiesData, typesData] = await Promise.all([
        db.monks.list(),
        db.monkDuties.list(),
        db.monkDutyTypes.list()
      ]);
      const activeMonks = monksData.filter(m => m.status === 'active');
      setMonks(activeMonks);
      setDuties(dutiesData);
      setDutyTypes(typesData);

      // Match current session user to monk
      if (typeof window !== 'undefined') {
        const sessionStr = localStorage.getItem('temple_session');
        if (sessionStr) {
          try {
            const session = JSON.parse(sessionStr);
            if (session?.user?.monk_id) {
              setCurrentUserMonkId(session.user.monk_id);
            } else if (session?.user?.fullName || session?.user?.name) {
              const uName = (session.user.fullName || session.user.name).replace(/\s+/g, '');
              const matched = activeMonks.find(m => m.name.replace(/\s+/g, '').includes(uName));
              if (matched) setCurrentUserMonkId(matched.id);
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load monk duties data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Exclude Abbot (เจ้าอาวาส) from duty assignment list (Keep only regular monks & novices)
  const dutyMonks = useMemo(() => {
    return monks.filter(m => {
      const rankStr = (m.rank || '').toLowerCase();
      const nameStr = (m.name || '').toLowerCase();
      return !rankStr.includes('เจ้าอาวาส') && !nameStr.includes('เจ้าอาวาส');
    });
  }, [monks]);

  // Filtered duties
  const filteredDuties = useMemo(() => {
    return duties.filter(d => {
      const matchesSearch = 
        d.duty_title.toLowerCase().includes(search.toLowerCase()) ||
        d.assigned_monk_names.toLowerCase().includes(search.toLowerCase()) ||
        (d.notes && d.notes.toLowerCase().includes(search.toLowerCase()));
      const matchesDate = !selectedDate || d.date === selectedDate;
      const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
      return matchesSearch && matchesDate && matchesStatus;
    });
  }, [duties, search, selectedDate, statusFilter]);

  // Today's duties for current logged in monk
  const todayStr = today.toISOString().split('T')[0];

  // Calendar Calculation
  const daysInCalMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfCalMonth = new Date(calYear, calMonth, 1).getDay(); // 0 = Sun
  const calCells = useMemo(() => {
    const blanks = Array(firstDayOfCalMonth).fill(null);
    const days = Array.from({ length: daysInCalMonth }, (_, i) => i + 1);
    return [...blanks, ...days];
  }, [calYear, calMonth, daysInCalMonth, firstDayOfCalMonth]);

  // Map duties by date string YYYY-MM-DD
  const dutiesByDateMap = useMemo(() => {
    const map: Record<string, MonkDuty[]> = {};
    duties.forEach(d => {
      if (!map[d.date]) map[d.date] = [];
      map[d.date].push(d);
    });
    return map;
  }, [duties]);

  // Feature 4: Analytics Statistics per Monk
  const monkAnalyticsStats = useMemo(() => {
    const statsMap: Record<string, {
      monkId: string;
      name: string;
      chaya: string;
      rank: string;
      total: number;
      completed: number;
      pending: number;
      swapped: number;
    }> = {};

    dutyMonks.forEach(m => {
      statsMap[m.id] = {
        monkId: m.id,
        name: m.name,
        chaya: m.chaya || 'เณร',
        rank: m.rank || 'พระลูกวัด',
        total: 0,
        completed: 0,
        pending: 0,
        swapped: 0
      };
    });

    duties.forEach(d => {
      const ids = d.assigned_monk_ids.split(',');
      ids.forEach(id => {
        if (statsMap[id]) {
          statsMap[id].total += 1;
          if (d.status === 'completed') statsMap[id].completed += 1;
          else if (d.status === 'swapped') statsMap[id].swapped += 1;
          else statsMap[id].pending += 1;
        }
      });
    });

    return Object.values(statsMap).map(s => ({
      ...s,
      rate: s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0
    })).sort((a, b) => b.completed - a.completed);
  }, [dutyMonks, duties]);

  const handlePrevCalMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(prev => prev - 1);
    } else {
      setCalMonth(prev => prev - 1);
    }
  };

  const handleNextCalMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(prev => prev + 1);
    } else {
      setCalMonth(prev => prev + 1);
    }
  };

  const handleGoToday = () => {
    setCalYear(today.getFullYear());
    setCalMonth(today.getMonth());
    setSelectedDate(todayStr);
  };

  // Feature 3: Print Roster Action
  const handlePrintRoster = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Open modal with pre-selected date
  const handleOpenAddModal = (dateStr?: string) => {
    const target = dateStr || todayStr;
    const defaultTime = dutyTypes.length > 0 ? dutyTypes[0].time_slot : '06:00 น. - 07:30 น.';
    setCurrentDuty({
      duty_title: '',
      date: target,
      time_slot: defaultTime,
      status: 'pending',
      notes: ''
    });
    setRepeatMode('single');
    setDutyStartDate(target);
    setDutyEndDate(target);
    setSelectedMonkIds([]);
    setIsModalOpen(true);
  };

  // Handle Save Single/Recurring Duty
  const handleSaveDuty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDuty || !currentDuty.duty_title || selectedMonkIds.length === 0) {
      setAlertState({
        show: true,
        variant: 'destructive',
        title: 'ข้อมูลไม่ครบถ้วน',
        description: 'กรุณากรอกชื่อเวร และเลือกพระภิกษุสามเณรผู้รับผิดชอบอย่างน้อย 1 รูป'
      });
      return;
    }

    const assignedNames = (monks.length > 0 ? monks : dutyMonks)
      .filter(m => selectedMonkIds.includes(m.id))
      .map(m => `${m.name} (${m.chaya || 'เณร'})`)
      .join(', ');

    // Calculate dates array
    const targetDates: string[] = [];

    if (currentDuty.id || repeatMode === 'single') {
      targetDates.push(currentDuty.date || dutyStartDate);
    } else {
      const s = new Date(dutyStartDate);
      const e = new Date(dutyEndDate);
      if (s > e) e.setTime(s.getTime());

      const cur = new Date(s);
      while (cur <= e) {
        const dateStr = cur.toISOString().split('T')[0];
        const dayOfWeek = cur.getDay();

        if (repeatMode === 'daily' || repeatMode === 'range') {
          targetDates.push(dateStr);
        } else if (repeatMode === 'weekly') {
          if (selectedWeekdays.includes(dayOfWeek)) {
            targetDates.push(dateStr);
          }
        } else if (repeatMode === 'monthly') {
          if (cur.getDate() === s.getDate()) {
            targetDates.push(dateStr);
          }
        }
        cur.setDate(cur.getDate() + 1);
      }
    }

    if (targetDates.length === 0) {
      setAlertState({
        show: true,
        variant: 'destructive',
        title: 'ไม่พบวันที่จัดคิว',
        description: 'กรุณาตรวจสอบการเลือกวันที่ หรือวันในสัปดาห์ที่ต้องการจัดเวร'
      });
      return;
    }

    setIsSaving(true);
    try {
      let createdCount = 0;
      for (const dDate of targetDates) {
        const dataToSave: MonkDuty = {
          id: targetDates.length === 1 && currentDuty.id ? currentDuty.id : '',
          duty_title: currentDuty.duty_title,
          date: dDate,
          time_slot: currentDuty.time_slot || '06:00 น. - 07:30 น.',
          assigned_monk_ids: selectedMonkIds.join(','),
          assigned_monk_names: assignedNames,
          status: currentDuty.status || 'pending',
          notes: currentDuty.notes || '',
          created_at: currentDuty.created_at || new Date().toISOString()
        };

        if (typeof window !== 'undefined' && !navigator.onLine) {
          offlineSyncManager.queueAction(
            'monk_duty',
            dataToSave.id ? 'update' : 'create',
            dataToSave,
            `เวรสงฆ์: ${dataToSave.duty_title} (${dataToSave.date})`
          );
        } else {
          await db.monkDuties.save(dataToSave);
        }
        createdCount++;
      }

      setIsModalOpen(false);
      setCurrentDuty(null);
      loadData();
      setAlertState({
        show: true,
        variant: 'success',
        title: 'บันทึกข้อมูลสำเร็จ 🎉',
        description: targetDates.length > 1
          ? `ระบบได้สร้างรายการเวรสงฆ์สะสมทั้งหมด ${createdCount} วันเรียบร้อยแล้ว`
          : 'บันทึกรายการคิวเวรปฏิบัติกิจสงฆ์เรียบร้อยแล้ว'
      });
      setTimeout(() => setAlertState(null), 3000);
    } catch (err: any) {
      console.error(err);
      setAlertState({
        show: true,
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาดในการบันทึก',
        description: err.message || 'ไม่สามารถบันทึกรายการเวรสงฆ์ได้'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Feature 2: Handle Duty Swap Execution
  const handleConfirmDutySwap = async () => {
    if (!dutyToSwap || !targetSwapMonkId) {
      setAlertState({
        show: true,
        variant: 'destructive',
        title: 'ข้อมูลไม่ครบถ้วน',
        description: 'กรุณาเลือกพระภิกษุสามเณรที่ต้องการขอสลับเวรด้วย'
      });
      return;
    }

    const targetMonk = monks.find(m => m.id === targetSwapMonkId);
    if (!targetMonk) return;

    const newAssignedNames = `${targetMonk.name} (${targetMonk.chaya || 'เณร'}) [สลับแทน]`;
    const newNotes = dutyToSwap.notes 
      ? `${dutyToSwap.notes} (🔄 สลับเวรกับ ${targetMonk.name}${swapReason ? ': ' + swapReason : ''})`
      : `🔄 สลับเวรกับ ${targetMonk.name}${swapReason ? ': ' + swapReason : ''}`;

    const updatedDuty: MonkDuty = {
      ...dutyToSwap,
      assigned_monk_ids: targetSwapMonkId,
      assigned_monk_names: newAssignedNames,
      status: 'swapped',
      notes: newNotes
    };

    setIsSaving(true);
    try {
      if (typeof window !== 'undefined' && !navigator.onLine) {
        offlineSyncManager.queueAction('monk_duty', 'update', updatedDuty, `ขอสลับเวรสงฆ์ (${dutyToSwap.duty_title})`);
        setDuties(prev => prev.map(d => d.id === dutyToSwap.id ? updatedDuty : d));
      } else {
        await db.monkDuties.save(updatedDuty);
        setDuties(prev => prev.map(d => d.id === dutyToSwap.id ? updatedDuty : d));
      }

      setIsSwapModalOpen(false);
      setDutyToSwap(null);
      setTargetSwapMonkId('');
      setSwapReason('');
      setAlertState({
        show: true,
        variant: 'success',
        title: 'ขอสลับเวรสำเร็จ 🔄',
        description: `ทำการสลับเวรปฏิบัติให้แก่ ${targetMonk.name} เรียบร้อยแล้ว`
      });
      setTimeout(() => setAlertState(null), 3000);
    } catch (err: any) {
      console.error(err);
      setAlertState({
        show: true,
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาดในการสลับเวร',
        description: err.message || 'ไม่สามารถสลับเวรปฏิบัติได้'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Save Custom Duty Type
  const handleSaveDutyType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDutyType || !currentDutyType.title) {
      setAlertState({
        show: true,
        variant: 'destructive',
        title: 'ข้อมูลไม่ครบถ้วน',
        description: 'กรุณาระบุชื่อประเภทกิจวัตรของวัด'
      });
      return;
    }

    setIsSaving(true);
    try {
      const typeToSave: MonkDutyType = {
        id: currentDutyType.id || '',
        title: currentDutyType.title,
        icon: currentDutyType.icon || '🧹',
        time_slot: currentDutyType.time_slot || '06:00 น. - 07:30 น.',
        req_monks: Number(currentDutyType.req_monks) || 1,
        description: currentDutyType.description || '',
        created_at: currentDutyType.created_at || new Date().toISOString()
      };

      await db.monkDutyTypes.save(typeToSave);
      setIsTypeEditModalOpen(false);
      setCurrentDutyType(null);
      loadData();
      setAlertState({
        show: true,
        variant: 'success',
        title: 'บันทึกประเภทกิจวัตรสำเร็จ',
        description: 'บันทึกประเภทเวรปฏิบัติของวัดเรียบร้อยแล้ว'
      });
      setTimeout(() => setAlertState(null), 3000);
    } catch (err: any) {
      console.error(err);
      setAlertState({
        show: true,
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาดในการบันทึก',
        description: err.message || 'ไม่สามารถบันทึกประเภทกิจวัตรได้'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Duty Type
  const handleDeleteDutyType = (id: string) => {
    setConfirmState({
      show: true,
      title: 'ยืนยันการลบประเภทกิจวัตร',
      description: 'คุณแน่ใจหรือไม่ว่าต้องการลบประเภทเวรสงฆ์นี้ออกจากระบบ?',
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await db.monkDutyTypes.delete(id);
          loadData();
          setAlertState({
            show: true,
            variant: 'success',
            title: 'ลบประเภทกิจวัตรสำเร็จ',
            description: 'ลบรายการประเภทเวรสงฆ์เรียบร้อยแล้ว'
          });
          setTimeout(() => setAlertState(null), 3000);
        } catch (err: any) {
          setAlertState({
            show: true,
            variant: 'destructive',
            title: 'เกิดข้อผิดพลาด',
            description: err.message || 'ไม่สามารถลบรายการได้'
          });
        }
      }
    });
  };

  // Handle Auto Rotate Duty Distribution using Custom Temple Duty Types
  const handleRunAutoRotate = async () => {
    if (dutyMonks.length === 0) {
      setAlertState({
        show: true,
        variant: 'destructive',
        title: 'ไม่พบพระภิกษุสามเณร',
        description: 'ต้องมีรายชื่อพระภิกษุสามเณรจำพรรษาในระบบอย่างน้อย 1 รูป เพื่อจัดคิวเวร'
      });
      return;
    }

    if (dutyTypes.length === 0) {
      setAlertState({
        show: true,
        variant: 'warning',
        title: 'ไม่พบประเภทกิจวัตรของวัด',
        description: 'กรุณากดปุ่ม "⚙️ จัดการประเภทเวร" เพื่อสร้างประเภทกิจวัตรประจำวัดก่อนรันระบบจัดคิวหมุนเวียน'
      });
      return;
    }

    setIsSaving(true);
    try {
      const startDate = new Date(autoRotateDate);
      let monkIndex = 0;
      let totalCreated = 0;

      for (let day = 0; day < autoRotateDays; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + day);
        const dateStr = currentDate.toISOString().split('T')[0];

        for (const tpl of dutyTypes) {
          const reqCount = tpl.req_monks || 1;
          const assignedIds: string[] = [];
          for (let r = 0; r < reqCount; r++) {
            const m = dutyMonks[monkIndex % dutyMonks.length];
            assignedIds.push(m.id);
            monkIndex++;
          }
          const assignedNames = dutyMonks
            .filter(m => assignedIds.includes(m.id))
            .map(m => `${m.name} (${m.chaya || 'เณร'})`)
            .join(', ');

          const dutyObj: MonkDuty = {
            id: '',
            duty_title: `${tpl.icon} ${tpl.title}`,
            date: dateStr,
            time_slot: tpl.time_slot,
            assigned_monk_ids: assignedIds.join(','),
            assigned_monk_names: assignedNames,
            status: 'pending',
            notes: 'สุ่มจัดคิวอัตโนมัติโดยระบบ',
            created_at: new Date().toISOString()
          };

          if (typeof window !== 'undefined' && !navigator.onLine) {
            offlineSyncManager.queueAction('monk_duty', 'create', dutyObj, `เวรสงฆ์: ${dutyObj.duty_title} (${dutyObj.date})`);
          } else {
            await db.monkDuties.save(dutyObj);
          }
          totalCreated++;
        }
      }

      setIsAutoRotateOpen(false);
      loadData();
      setAlertState({
        show: true,
        variant: 'success',
        title: 'จัดคิวหมุนเวียนสำเร็จ 🎉',
        description: `ระบบได้ทำการสุ่มหมุนเวียนจัดคิวเวรปฏิบัติกิจสงฆ์ ${totalCreated} รายการ ครอบคลุม ${autoRotateDays} วันเรียบร้อยแล้ว`
      });
    } catch (err: any) {
      console.error(err);
      setAlertState({
        show: true,
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาดในการจัดคิว',
        description: err.message || 'ไม่สามารถจัดคิวหมุนเวียนได้'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Duty Status (Completed / Pending)
  const handleToggleStatus = async (duty: MonkDuty) => {
    const newStatus = duty.status === 'completed' ? 'pending' : 'completed';
    const updated = { ...duty, status: newStatus as MonkDuty['status'] };

    if (typeof window !== 'undefined' && !navigator.onLine) {
      offlineSyncManager.queueAction('monk_duty', 'update', updated, `อัปเดตสถานะเวรสงฆ์ (${duty.duty_title})`);
      setDuties(prev => prev.map(d => d.id === duty.id ? updated : d));
      return;
    }

    try {
      await db.monkDuties.save(updated);
      setDuties(prev => prev.map(d => d.id === duty.id ? updated : d));
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Duty
  const handleDeleteDuty = (id: string) => {
    setConfirmState({
      show: true,
      title: 'ยืนยันการลบเวรสงฆ์',
      description: 'คุณแน่ใจหรือไม่ว่าต้องการลบรายการเวรปฏิบัตินี้ออกจากระบบ?',
      onConfirm: async () => {
        setConfirmState(null);
        if (typeof window !== 'undefined' && !navigator.onLine) {
          offlineSyncManager.queueAction('monk_duty', 'delete', id, 'ลบรายการเวรสงฆ์');
          setDuties(prev => prev.filter(d => d.id !== id));
          return;
        }

        try {
          await db.monkDuties.delete(id);
          setDuties(prev => prev.filter(d => d.id !== id));
          setAlertState({
            show: true,
            variant: 'success',
            title: 'ลบข้อมูลสำเร็จ',
            description: 'ลบรายการเวรสงฆ์เรียบร้อยแล้ว'
          });
          setTimeout(() => setAlertState(null), 3000);
        } catch (err: any) {
          setAlertState({
            show: true,
            variant: 'destructive',
            title: 'เกิดข้อผิดพลาด',
            description: err.message || 'ไม่สามารถลบรายการได้'
          });
        }
      }
    });
  };

  return (
    <div className="space-y-6 select-none">
      {/* Alert Dialog */}
      {alertState && (
        <CustomDialog
          show={alertState.show}
          type="alert"
          title={alertState.title}
          description={alertState.description}
          variant={alertState.variant}
          onConfirm={() => setAlertState(null)}
        />
      )}

      {/* Confirm Dialog */}
      {confirmState && (
        <CustomDialog
          show={confirmState.show}
          type="confirm"
          title={confirmState.title}
          description={confirmState.description}
          variant="destructive"
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}

      {/* Top Header Banner */}
      <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 p-5 sm:p-6 shadow-md shadow-amber-100/5 no-print flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 border border-amber-500/20">
            <CalendarDays className="size-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-heading text-amber-950 dark:text-amber-100 tracking-tight">
              ตารางและปฏิทินปฏิบัติกิจสงฆ์ประจำวัน
            </h2>
            <p className="text-xs text-amber-700/60 dark:text-amber-400/50 mt-0.5">
              ปฏิทินสุ่มกระจายเวรทำความสะอาดพระอุโบสถ ลานวัด ตู้บริจาค หอฉัน และทวนสถานะปฏิบัติกิจ
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* View Mode Switcher */}
          <div className="inline-flex items-center bg-amber-100/70 dark:bg-amber-950/40 p-1 rounded-xl border border-amber-200/60 dark:border-amber-950/30">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 border-none cursor-pointer ${
                viewMode === 'calendar' ? 'bg-amber-500 text-white shadow-xs' : 'text-amber-900 dark:text-amber-300 hover:bg-amber-500/10'
              }`}
            >
              <CalendarIcon className="size-3.5" />
              <span>ปฏิทิน</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 border-none cursor-pointer ${
                viewMode === 'cards' ? 'bg-amber-500 text-white shadow-xs' : 'text-amber-900 dark:text-amber-300 hover:bg-amber-500/10'
              }`}
            >
              <LayoutGrid className="size-3.5" />
              <span>การ์ด</span>
            </button>
          </div>

          {/* Feature 4: Analytics Stats Button */}
          <button
            onClick={() => setIsAnalyticsOpen(true)}
            className="h-9 px-3 rounded-xl border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer bg-white dark:bg-[#110e08] hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all shadow-2xs"
            title="สรุปสถิติการปฏิบัติกิจสงฆ์ประจำเดือน"
          >
            <BarChart3 className="size-3.5 text-amber-600" />
            <span>สถิติ</span>
          </button>

          {/* Feature 3: Print Roster Button */}
          <button
            onClick={handlePrintRoster}
            className="h-9 px-3 rounded-xl border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer bg-white dark:bg-[#110e08] hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all shadow-2xs"
            title="พิมพ์ตารางเวรปฏิบัติติดบอร์ดประชาสัมพันธ์"
          >
            <Printer className="size-3.5 text-amber-600" />
            <span>พิมพ์</span>
          </button>

          {(role === 'admin' || role === 'abbot') && (
            <button
              onClick={() => setIsTypeManagerOpen(true)}
              className="h-9 px-3.5 rounded-xl border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer bg-white dark:bg-[#110e08] hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all shadow-2xs"
            >
              <Settings className="size-3.5 text-amber-600" />
              <span>ประเภทเวร ({dutyTypes.length})</span>
            </button>
          )}

          {(role === 'admin' || role === 'abbot') && (
            <button
              onClick={() => setIsAutoRotateOpen(true)}
              className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs flex items-center gap-1.5 border-none shadow-sm shadow-amber-600/20 cursor-pointer transition-all active:scale-[0.98]"
            >
              <Sparkles className="size-3.5" />
              <span>สุ่มจัดคิว (Auto-Rotate)</span>
            </button>
          )}

          {(permissions.canCreate || role === 'editor') && (
            <button
              onClick={() => handleOpenAddModal()}
              className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 border-none shadow-sm shadow-emerald-600/20 cursor-pointer transition-all active:scale-[0.98]"
            >
              <Plus className="size-3.5" />
              <span>เพิ่มเวรสงฆ์</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 p-4 shadow-md shadow-amber-100/5 flex flex-col sm:flex-row gap-3 justify-between items-center no-print">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-amber-700/40 dark:text-amber-500/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อเวร หรือ ชื่อพระภิกษุ..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        {/* Date Filter */}
        <div className="w-full sm:w-56">
          <ThaiDatePicker
            value={selectedDate}
            onChange={(val) => setSelectedDate(val)}
            placeholder="กรองตามวันที่..."
          />
        </div>

        {/* Status Filter Dropdown */}
        <div className="w-full sm:w-48 shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none cursor-pointer focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="all">📋 สถานะทั้งหมด ({duties.length})</option>
            <option value="pending">⏳ รอปฏิบัติ</option>
            <option value="completed">✅ ปฏิบัติแล้ว</option>
            <option value="swapped">🔄 สลับเวรแล้ว</option>
          </select>
        </div>
      </div>

      {/* MONTHLY CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 shadow-md shadow-amber-100/5 p-6 space-y-4 no-print">
          {/* Calendar Header Navigation */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pb-4 border-b border-amber-100 dark:border-amber-950">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevCalMonth}
                className="p-2 rounded-xl border border-amber-200/60 dark:border-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-500/10 cursor-pointer transition-colors"
                title="เดือนก่อนหน้า"
              >
                <ChevronLeft className="size-4" />
              </button>
              <h3 className="text-base font-bold text-amber-950 dark:text-amber-100 font-heading min-w-[200px] text-center">
                {THAI_MONTHS_LONG[calMonth]} พ.ศ. {calYear + 543}
              </h3>
              <button
                onClick={handleNextCalMonth}
                className="p-2 rounded-xl border border-amber-200/60 dark:border-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-500/10 cursor-pointer transition-colors"
                title="เดือนถัดไป"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            <button
              onClick={handleGoToday}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 cursor-pointer transition-all"
            >
              วันนี้ ({formatThaiDate(todayStr, 'short')})
            </button>
          </div>

          {/* Calendar Grid Header */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-bold text-amber-900/70 dark:text-amber-400/60 py-2 bg-amber-50/40 dark:bg-amber-950/20 rounded-xl">
            {WEEKDAYS_THAI.map((wd, i) => (
              <div key={wd} className={i === 0 ? 'text-red-500' : ''}>{wd}</div>
            ))}
          </div>

          {/* Calendar Cells */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calCells.map((dayNum, idx) => {
              if (!dayNum) {
                return <div key={`blank-${idx}`} className="h-28 sm:h-32 bg-amber-50/10 dark:bg-amber-950/5 rounded-xl border border-dashed border-amber-100/40 dark:border-amber-950/20" />;
              }

              const mm = String(calMonth + 1).padStart(2, '0');
              const dd = String(dayNum).padStart(2, '0');
              const dateStr = `${calYear}-${mm}-${dd}`;
              const isTodayCell = dateStr === todayStr;
              const dayDuties = (dutiesByDateMap[dateStr] || []).filter(d => {
                const matchesSearch = !search || 
                  d.duty_title.toLowerCase().includes(search.toLowerCase()) ||
                  d.assigned_monk_names.toLowerCase().includes(search.toLowerCase());
                const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
                return matchesSearch && matchesStatus;
              });

              return (
                <div
                  key={dateStr}
                  className={`h-28 sm:h-32 p-1.5 sm:p-2 rounded-xl border flex flex-col justify-between transition-all group hover:border-amber-400 relative bg-white dark:bg-[#110e08] ${
                    isTodayCell
                      ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20 dark:bg-amber-950/20'
                      : 'border-amber-100/80 dark:border-amber-950/40'
                  }`}
                >
                  {/* Top Bar of Cell */}
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-extrabold w-6 h-6 rounded-full flex items-center justify-center ${
                      isTodayCell
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-amber-950 dark:text-amber-200'
                    }`}>
                      {dayNum}
                    </span>

                    {(permissions.canCreate || role === 'editor') && (
                      <button
                        onClick={() => handleOpenAddModal(dateStr)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-amber-700/60 hover:text-amber-900 dark:hover:text-amber-200 cursor-pointer border-none transition-opacity text-[10px] font-bold flex items-center gap-0.5"
                        title="เพิ่มเวรในวันนี้"
                      >
                        <Plus className="size-3" />
                      </button>
                    )}
                  </div>

                  {/* Duties list inside cell */}
                  <div className="flex-1 my-1 overflow-y-auto space-y-1 pr-0.5 custom-scrollbar">
                    {dayDuties.map(d => (
                      <div
                        key={d.id}
                        onClick={() => handleToggleStatus(d)}
                        title={`${d.duty_title}\n⏰ ${d.time_slot}\n👤 ${d.assigned_monk_names}`}
                        className={`text-[10px] font-bold p-1 rounded-lg truncate cursor-pointer transition-all border ${
                          d.status === 'completed'
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200/50'
                            : d.status === 'swapped'
                            ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200/50'
                            : 'bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border-amber-200/50 hover:bg-amber-100'
                        }`}
                      >
                        <div className="truncate flex items-center gap-1">
                          <span>{d.status === 'completed' ? '✅' : d.status === 'swapped' ? '🔄' : '⏳'}</span>
                          <span className="truncate">{d.duty_title}</span>
                        </div>
                        <div className="text-[9px] text-amber-800/60 dark:text-amber-400/50 truncate">
                          {d.assigned_monk_names.split(',')[0]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CARDS LIST VIEW */}
      {viewMode === 'cards' && (
        <div className="no-print">
          {loading ? (
            <div className="min-h-[40vh] flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="size-8 text-amber-500 animate-spin" />
                <p className="text-xs font-bold text-amber-700/60 dark:text-amber-500/60">กำลังดึงข้อมูลเวรปฏิบัติกิจสงฆ์...</p>
              </div>
            </div>
          ) : filteredDuties.length === 0 ? (
            <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 p-12 text-center shadow-md shadow-amber-100/5">
              <CalendarIcon className="size-12 text-amber-500/20 mx-auto mb-3" />
              <h3 className="text-base font-bold text-amber-950 dark:text-amber-200 font-heading">ไม่พบรายการคิวเวรสงฆ์</h3>
              <p className="text-xs text-amber-700/50 dark:text-amber-500/40 mt-1 max-w-md mx-auto">
                ยังไม่มีการจัดคิวเวรตามเงื่อนไขที่ค้นหา ท่านสามารถกดปุ่ม "สุ่มจัดคิวหมุนเวียน (Auto-Rotate)" เพื่อให้ระบบสุ่มจัดคิวอัตโนมัติได้ครับ
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDuties.map((duty) => {
                const isCompleted = duty.status === 'completed';
                const isSwapped = duty.status === 'swapped';
                const isMyDuty = currentUserMonkId && duty.assigned_monk_ids.split(',').includes(currentUserMonkId);

                return (
                  <div
                    key={duty.id}
                    className={`bg-white dark:bg-[#15110a] rounded-2xl border p-5 shadow-md shadow-amber-100/5 flex flex-col justify-between transition-all hover:translate-y-[-2px] relative overflow-hidden ${
                      isMyDuty 
                        ? 'border-amber-500/80 ring-2 ring-amber-500/20' 
                        : 'border-amber-200/40 dark:border-amber-950/30'
                    }`}
                  >
                    {/* Top Badge */}
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <span className="text-[11px] font-extrabold text-amber-800 dark:text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg">
                          📅 {formatThaiDate(duty.date)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(duty)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold cursor-pointer border-none transition-all ${
                            isCompleted
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : isSwapped
                              ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                              : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {isCompleted ? '✅ ปฏิบัติแล้ว' : isSwapped ? '🔄 สลับเวรแล้ว' : '⏳ รอปฏิบัติ'}
                        </button>
                      </div>

                      <h3 className="text-sm font-bold text-amber-950 dark:text-amber-100 font-heading leading-snug">
                        {duty.duty_title}
                      </h3>
                      
                      <div className="flex items-center gap-1.5 text-xs text-amber-700/60 dark:text-amber-400/50 mt-1.5 font-medium">
                        <Clock className="size-3.5" />
                        <span>เวลา: {duty.time_slot}</span>
                      </div>

                      {/* Assigned Monks Badge */}
                      <div className="mt-4 pt-3 border-t border-amber-100/60 dark:border-amber-950/40">
                        <div className="text-[10px] font-bold text-amber-800/60 dark:text-amber-500/50 mb-1.5 flex items-center gap-1">
                          <Users className="size-3" />
                          <span>พระภิกษุสามเณรผู้รับผิดชอบ:</span>
                        </div>
                        <div className="text-xs font-bold text-amber-900 dark:text-amber-200 leading-relaxed bg-amber-50/50 dark:bg-amber-950/10 p-2.5 rounded-xl border border-amber-200/30 dark:border-amber-950/20">
                          {duty.assigned_monk_names}
                        </div>
                      </div>

                      {duty.notes && (
                        <p className="text-[10px] text-amber-700/50 dark:text-amber-500/40 italic mt-2">
                          💡 {duty.notes}
                        </p>
                      )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex justify-between items-center pt-4 mt-4 border-t border-amber-100/60 dark:border-amber-950/40 no-print">
                      <div className="flex gap-1.5">
                        {/* Feature 2: Swap Duty Request Button */}
                        <button
                          onClick={() => {
                            setDutyToSwap(duty);
                            setTargetSwapMonkId('');
                            setSwapReason('');
                            setIsSwapModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-500/10 cursor-pointer border-none transition-colors"
                          title="ขอสลับเวรกับพระรูปอื่น"
                        >
                          <Repeat className="size-3.5" />
                        </button>
                        {permissions.canEdit && (
                          <button
                            onClick={() => {
                              setCurrentDuty(duty);
                              setSelectedMonkIds(duty.assigned_monk_ids.split(','));
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-amber-700/60 hover:text-amber-900 dark:hover:text-amber-200 hover:bg-amber-500/10 cursor-pointer border-none transition-colors"
                            title="แก้ไขเวร"
                          >
                            <Edit className="size-3.5" />
                          </button>
                        )}
                        {permissions.canDelete && (
                          <button
                            onClick={() => handleDeleteDuty(duty.id)}
                            className="p-1.5 rounded-lg text-red-600/60 hover:text-red-700 hover:bg-red-500/10 cursor-pointer border-none transition-colors"
                            title="ลบเวร"
                          >
                            <Trash className="size-3.5" />
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => handleToggleStatus(duty)}
                        className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all border-none cursor-pointer ${
                          isCompleted
                            ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 hover:bg-amber-200'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                        }`}
                      >
                        {isCompleted ? 'ยกเลิกสถานะ' : 'ทวนว่าปฏิบัติแล้ว'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Feature 2: Duty Swap Modal */}
      {isSwapModalOpen && dutyToSwap && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/60 backdrop-blur-sm p-4 no-print">
          <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/50 dark:border-amber-950/40 shadow-2xl w-full max-w-md animate-scale-up">
            <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600" />
            <div className="p-5 border-b border-amber-100 dark:border-amber-950 flex justify-between items-center bg-amber-50/20 dark:bg-amber-950/5">
              <h3 className="font-bold text-sm text-amber-900 dark:text-amber-200 font-heading flex items-center gap-2">
                <Repeat className="size-4 text-blue-500" />
                ขอสลับเวรปฏิบัติกิจสงฆ์
              </h3>
              <button
                type="button"
                onClick={() => setIsSwapModalOpen(false)}
                className="text-amber-700/50 dark:text-amber-400/40 hover:text-amber-900 dark:hover:text-amber-200 border-none bg-transparent cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-xl border border-blue-200/50 dark:border-blue-950/30">
                <div className="text-[11px] font-bold text-blue-900 dark:text-blue-300">รายการเวรที่ต้องการสลับ:</div>
                <div className="text-xs font-bold text-amber-950 dark:text-amber-100 mt-1">{dutyToSwap.duty_title}</div>
                <div className="text-[10px] text-amber-700/60 dark:text-amber-400/50 mt-0.5">
                  📅 {formatThaiDate(dutyToSwap.date)} • ⏰ {dutyToSwap.time_slot}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">เลือกพระภิกษุสามเณรที่สลับแทน</label>
                <select
                  value={targetSwapMonkId}
                  onChange={(e) => setTargetSwapMonkId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none cursor-pointer"
                >
                  <option value="">-- เลือกพระภิกษุสามเณร --</option>
                  {dutyMonks.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.chaya || 'เณร'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">เหตุผลการขอสลับเวร (ถ้ามี)</label>
                <input
                  type="text"
                  value={swapReason}
                  onChange={(e) => setSwapReason(e.target.value)}
                  placeholder="เช่น ติดกิจนิมนต์ด่วน, ป่วยอาพาธ"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-amber-100 dark:border-amber-950">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSwapModalOpen(false)}
                  className="py-2 px-4 text-xs font-bold border-amber-200 text-amber-800 dark:text-amber-400 cursor-pointer"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmDutySwap}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-5 rounded-xl flex items-center gap-1 border-none cursor-pointer shadow-md"
                >
                  {isSaving && <Loader2 className="size-3.5 animate-spin" />}
                  ยืนยันสลับเวร
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature 4: Analytics Stats Modal */}
      {isAnalyticsOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/60 backdrop-blur-sm p-4 no-print">
          <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/50 dark:border-amber-950/40 shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto animate-scale-up">
            <div className="h-1.5 bg-gradient-to-r from-amber-500 to-emerald-600" />
            <div className="p-6 border-b border-amber-100 dark:border-amber-950 flex justify-between items-center bg-amber-50/20 dark:bg-amber-950/5">
              <div>
                <h3 className="font-bold text-base text-amber-900 dark:text-amber-200 font-heading flex items-center gap-2">
                  <BarChart3 className="size-5 text-amber-500" />
                  สรุปสถิติการปฏิบัติกิจสงฆ์ประจำเดือน
                </h3>
                <p className="text-xs text-amber-700/60 dark:text-amber-400/50 mt-0.5">
                  รายงานทวนผลการปฏิบัติเวรสงฆ์ รายบุคคลสำหรับเจ้าอาวาสและคณะปกครองวัด
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAnalyticsOpen(false)}
                className="text-amber-700/50 dark:text-amber-400/40 hover:text-amber-900 dark:hover:text-amber-200 border-none bg-transparent cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-amber-50/60 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200/50 dark:border-amber-950/30">
                  <div className="text-xs text-amber-700/70 font-semibold">รายการเวรทั้งหมด</div>
                  <div className="text-2xl font-bold text-amber-950 dark:text-amber-100 mt-1">{duties.length} รายการ</div>
                </div>
                <div className="bg-emerald-50/60 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200/50 dark:border-emerald-950/30">
                  <div className="text-xs text-emerald-700/70 font-semibold">ปฏิบัติแล้ว (เสร็จสิ้น)</div>
                  <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                    {duties.filter(d => d.status === 'completed').length} รายการ
                  </div>
                </div>
                <div className="bg-blue-50/60 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-200/50 dark:border-blue-950/30">
                  <div className="text-xs text-blue-700/70 font-semibold">มีการขอสลับเวร</div>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-1">
                    {duties.filter(d => d.status === 'swapped').length} รายการ
                  </div>
                </div>
              </div>

              {/* Monk Breakdown Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                  <Award className="size-4 text-amber-500" />
                  สถิติการปฏิบัติเวรรายบุคคล (เรียงตามจำนวนครั้งที่ปฏิบัติแล้ว)
                </h4>

                <div className="border border-amber-200/60 dark:border-amber-950/40 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-amber-50/60 dark:bg-amber-950/30 text-amber-900/80 dark:text-amber-300 font-bold border-b border-amber-200/50">
                      <tr>
                        <th className="p-3">พระภิกษุ / สามเณร</th>
                        <th className="p-3 text-center">ได้รับมอบหมาย</th>
                        <th className="p-3 text-center">ปฏิบัติแล้ว</th>
                        <th className="p-3 text-center">รอปฏิบัติ</th>
                        <th className="p-3 text-center">สลับเวร</th>
                        <th className="p-3 text-right">อัตราความสำเร็จ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100 dark:divide-amber-950">
                      {monkAnalyticsStats.map(s => (
                        <tr key={s.monkId} className="hover:bg-amber-50/20 dark:hover:bg-amber-950/10">
                          <td className="p-3 font-bold text-amber-950 dark:text-amber-100">
                            {s.name} <span className="text-[10px] font-normal text-amber-700/60">({s.chaya})</span>
                          </td>
                          <td className="p-3 text-center font-bold">{s.total}</td>
                          <td className="p-3 text-center text-emerald-600 font-bold">{s.completed}</td>
                          <td className="p-3 text-center text-amber-600 font-bold">{s.pending}</td>
                          <td className="p-3 text-center text-blue-600 font-bold">{s.swapped}</td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 bg-amber-100 dark:bg-amber-950 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-full rounded-full transition-all"
                                  style={{ width: `${s.rate}%` }}
                                />
                              </div>
                              <span className="font-bold text-[11px] text-amber-900 dark:text-amber-200">{s.rate}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-amber-100 dark:border-amber-950">
                <Button
                  onClick={() => setIsAnalyticsOpen(false)}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2 px-5 rounded-lg border-none cursor-pointer"
                >
                  ปิดหน้าต่าง
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Duty Type Manager Modal */}
      {isTypeManagerOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/60 backdrop-blur-sm p-4 no-print">
          <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/50 dark:border-amber-950/40 shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto animate-scale-up">
            <div className="h-1.5 bg-gradient-to-r from-amber-500 to-amber-700" />
            <div className="p-6 border-b border-amber-100 dark:border-amber-950 flex justify-between items-center bg-amber-50/20 dark:bg-amber-950/5">
              <div>
                <h3 className="font-bold text-base text-amber-900 dark:text-amber-200 font-heading flex items-center gap-2">
                  <Settings className="size-4 text-amber-500" />
                  ระบบจัดการประเภทกิจวัตรของวัด
                </h3>
                <p className="text-xs text-amber-700/60 dark:text-amber-400/50 mt-0.5">
                  เพิ่ม/แก้ไข/ลบ ประเภทเวรประจำวัด และจำนวนพระภิกษุสามเณรที่ต้องการ
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTypeManagerOpen(false)}
                className="text-amber-700/50 dark:text-amber-400/40 hover:text-amber-900 dark:hover:text-amber-200 border-none bg-transparent cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  รายการประเภทกิจวัตรทั้งหมด ({dutyTypes.length})
                </span>
                <Button
                  onClick={() => {
                    setCurrentDutyType({
                      title: '',
                      icon: '🧹',
                      time_slot: '06:00 น. - 07:30 น.',
                      req_monks: 1,
                      description: ''
                    });
                    setIsTypeEditModalOpen(true);
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-1 cursor-pointer border-none"
                >
                  <Plus className="size-3.5" />
                  เพิ่มประเภทกิจวัตร
                </Button>
              </div>

              {dutyTypes.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-amber-200 rounded-xl">
                  <p className="text-xs text-amber-700/50">ยังไม่มีประเภทกิจวัตร กรุณากดปุ่มเพื่อเพิ่มประเภทกิจวัตรของวัดท่านครับ</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {dutyTypes.map(t => (
                    <div key={t.id} className="p-3.5 rounded-xl border border-amber-200/60 dark:border-amber-950/40 bg-amber-50/10 dark:bg-amber-950/5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl p-2 bg-amber-100 dark:bg-amber-950/40 rounded-xl">{t.icon || '🧹'}</span>
                        <div>
                          <h4 className="font-bold text-xs text-amber-950 dark:text-amber-100">{t.title}</h4>
                          <p className="text-[10px] text-amber-700/60 dark:text-amber-400/50 mt-0.5">
                            ⏰ เวลา: {t.time_slot} • 👤 ต้องการพระสงฆ์: <span className="font-bold text-amber-600">{t.req_monks} รูป</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setCurrentDutyType(t);
                            setIsTypeEditModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-500/10 cursor-pointer border-none"
                          title="แก้ไขประเภท"
                        >
                          <Edit className="size-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDutyType(t.id)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-500/10 cursor-pointer border-none"
                          title="ลบประเภท"
                        >
                          <Trash className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-3 border-t border-amber-100 dark:border-amber-950">
                <Button
                  onClick={() => setIsTypeManagerOpen(false)}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2 px-5 rounded-lg border-none cursor-pointer"
                >
                  เสร็จสิ้น
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Add Custom Duty Type Modal */}
      {isTypeEditModalOpen && currentDutyType && (
        <div className="fixed inset-0 flex items-center justify-center z-[200] bg-black/60 backdrop-blur-sm p-4 no-print">
          <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/50 dark:border-amber-950/40 shadow-2xl w-full max-w-md animate-scale-up">
            <div className="h-1.5 bg-gradient-to-r from-amber-500 to-amber-700" />
            <div className="p-5 border-b border-amber-100 dark:border-amber-950 flex justify-between items-center bg-amber-50/20 dark:bg-amber-950/5">
              <h3 className="font-bold text-sm text-amber-900 dark:text-amber-200 font-heading">
                {currentDutyType.id ? '📝 แก้ไขประเภทกิจวัตร' : '➕ เพิ่มประเภทกิจวัตรใหม่'}
              </h3>
              <button
                type="button"
                onClick={() => setIsTypeEditModalOpen(false)}
                className="text-amber-700/50 dark:text-amber-400/40 hover:text-amber-900 dark:hover:text-amber-200 border-none bg-transparent cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDutyType} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ชื่อประเภทเวร / กิจวัตร</label>
                <input
                  type="text"
                  required
                  value={currentDutyType.title || ''}
                  onChange={(e) => setCurrentDutyType(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="เช่น ทำความสะอาดพระอุโบสถ & วิหาร"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ไอคอน Emoji</label>
                  <input
                    type="text"
                    required
                    value={currentDutyType.icon || '🧹'}
                    onChange={(e) => setCurrentDutyType(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="เช่น 🧹, 🥣, 💎"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">จำนวนพระสงฆ์ที่ต้องการ</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={currentDutyType.req_monks || 1}
                    onChange={(e) => setCurrentDutyType(prev => ({ ...prev, req_monks: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ช่วงเวลาประจำ</label>
                <input
                  type="text"
                  required
                  value={currentDutyType.time_slot || ''}
                  onChange={(e) => setCurrentDutyType(prev => ({ ...prev, time_slot: e.target.value }))}
                  placeholder="เช่น 06:00 น. - 07:30 น."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-amber-100 dark:border-amber-950">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsTypeEditModalOpen(false)}
                  className="py-2 px-4 text-xs font-bold border-amber-200 text-amber-800 dark:text-amber-400 cursor-pointer"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 px-5 rounded-xl flex items-center gap-1 cursor-pointer border-none"
                >
                  {isSaving && <Loader2 className="size-3.5 animate-spin" />}
                  บันทึกข้อมูล
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Duty Modal */}
      {isModalOpen && currentDuty && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/60 backdrop-blur-sm p-4 no-print">
          <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/50 dark:border-amber-950/40 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="h-1.5 bg-gradient-to-r from-amber-400 to-amber-600" />
            <div className="p-6 border-b border-amber-100 dark:border-amber-950 flex justify-between items-center bg-amber-50/20 dark:bg-amber-950/5">
              <h3 className="font-bold text-base text-amber-900 dark:text-amber-200 font-heading">
                {currentDuty.id ? '📝 แก้ไขรายการเวรสงฆ์' : '➕ เพิ่มรายการเวรปฏิบัติกิจสงฆ์'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-amber-700/50 dark:text-amber-400/40 hover:text-amber-900 dark:hover:text-amber-200 border-none bg-transparent cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDuty} className="p-6 space-y-5">
              {/* Duty Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ชื่อเวร / งานปฏิบัติ</label>
                <input
                  type="text"
                  required
                  value={currentDuty.duty_title || ''}
                  onChange={(e) => setCurrentDuty(prev => ({ ...prev, duty_title: e.target.value }))}
                  placeholder="เช่น 🧹 เวรทำความสะอาดพระอุโบสถ"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-amber-200/80 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 font-medium"
                />

                {/* Quick Select Duty Templates */}
                {dutyTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] font-bold text-amber-700/60 dark:text-amber-500/50 self-center">⚡ แม่แบบเวรของวัด:</span>
                    {dutyTypes.map(dt => (
                      <button
                        key={dt.id}
                        type="button"
                        onClick={() => {
                          setCurrentDuty(prev => ({
                            ...prev,
                            duty_title: `${dt.icon} ${dt.title}`,
                            time_slot: dt.time_slot
                          }));
                        }}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold cursor-pointer border border-amber-200/60 bg-amber-50/60 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 hover:bg-amber-500/10 transition-all"
                      >
                        {dt.icon} {dt.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Recurrence Mode Selector (Only when creating new) */}
              {!currentDuty.id && (
                <div className="space-y-1.5 bg-amber-50/40 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200/40 dark:border-amber-950/30">
                  <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300 flex items-center gap-1.5">
                    <span>📅 รูปแบบกำหนดวันที่ปฏิบัติ</span>
                    <span className="text-[10px] text-amber-700/50 dark:text-amber-500/40 font-normal">(เลือกการซ้ำของเวร)</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                    {[
                      { id: 'single', label: '📌 รายวัน', desc: 'กำหนดเฉพาะวัน' },
                      { id: 'range', label: '🗓️ ช่วงวันที่', desc: 'ตั้งแต่วันที่-ถึงวันที่' },
                      { id: 'weekly', label: '📅 รายสัปดาห์', desc: 'ระบุวันในสัปดาห์' },
                      { id: 'monthly', label: '📆 รายเดือน', desc: 'ประจำเดือน' },
                      { id: 'daily', label: '♾️ ทุกวัน', desc: 'สร้างคิวทุกวัน' },
                    ].map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setRepeatMode(item.id as any)}
                        className={`px-2.5 py-2 rounded-lg text-xs font-bold transition-all border text-left cursor-pointer ${
                          repeatMode === item.id
                            ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                            : 'bg-white dark:bg-[#110e08] text-amber-900 dark:text-amber-200 border-amber-200/70 dark:border-amber-950/40 hover:bg-amber-500/10'
                        }`}
                      >
                        <div>{item.label}</div>
                        <div className={`text-[9px] mt-0.5 ${repeatMode === item.id ? 'text-white/80' : 'text-amber-700/50 dark:text-amber-400/40'}`}>
                          {item.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 2-Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left Column: Date & Time */}
                <div className="space-y-4">
                  {/* Date Input based on repeatMode */}
                  {currentDuty.id || repeatMode === 'single' ? (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">วันที่ปฏิบัติเวร</label>
                      <ThaiDatePicker
                        required
                        value={currentDuty.date || dutyStartDate}
                        onChange={(val) => {
                          setCurrentDuty(prev => ({ ...prev, date: val }));
                          setDutyStartDate(val);
                        }}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ตั้งแต่วันที่</label>
                          <ThaiDatePicker
                            required
                            value={dutyStartDate}
                            onChange={(val) => setDutyStartDate(val)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ถึงวันที่</label>
                          <ThaiDatePicker
                            required
                            value={dutyEndDate}
                            onChange={(val) => setDutyEndDate(val)}
                          />
                        </div>
                      </div>

                      {/* Weekday Selection if Weekly Mode */}
                      {repeatMode === 'weekly' && (
                        <div className="space-y-1 pt-1">
                          <label className="text-[11px] font-bold text-amber-900/80 dark:text-amber-300">เลือกวันในสัปดาห์ที่ปฏิบัติ:</label>
                          <div className="flex flex-wrap gap-1">
                            {[
                              { day: 1, label: 'จ' },
                              { day: 2, label: 'อ' },
                              { day: 3, label: 'พ' },
                              { day: 4, label: 'พฤ' },
                              { day: 5, label: 'ศ' },
                              { day: 6, label: 'ส' },
                              { day: 0, label: 'อา' },
                            ].map(w => {
                              const active = selectedWeekdays.includes(w.day);
                              return (
                                <button
                                  key={w.day}
                                  type="button"
                                  onClick={() => {
                                    if (active) setSelectedWeekdays(prev => prev.filter(d => d !== w.day));
                                    else setSelectedWeekdays(prev => [...prev, w.day]);
                                  }}
                                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer border-none ${
                                    active ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-200'
                                  }`}
                                >
                                  {w.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Time Slot with Quick Preset Buttons */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ช่วงเวลาปฏิบัติ</label>
                    <input
                      type="text"
                      required
                      value={currentDuty.time_slot || ''}
                      onChange={(e) => setCurrentDuty(prev => ({ ...prev, time_slot: e.target.value }))}
                      placeholder="เช่น 06:00 น. - 07:30 น."
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-amber-200/80 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 font-medium"
                    />

                    {/* Preset Time Buttons from Duty Types */}
                    {dutyTypes.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <div className="text-[10px] font-bold text-amber-700/60 dark:text-amber-500/50">⚡ เลือกเวลาตามกิจวัตรวัด:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {dutyTypes.map(dt => (
                            <button
                              key={dt.id}
                              type="button"
                              onClick={() => setCurrentDuty(prev => ({ ...prev, time_slot: dt.time_slot }))}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold cursor-pointer border transition-all ${
                                currentDuty.time_slot === dt.time_slot
                                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                                  : 'bg-amber-50/60 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 border-amber-200/50 dark:border-amber-950/30 hover:bg-amber-500/10'
                              }`}
                            >
                              {dt.time_slot}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">บันทึกเพิ่มเติม</label>
                    <textarea
                      value={currentDuty.notes || ''}
                      onChange={(e) => setCurrentDuty(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="ระบุข้อความเสริมสำหรับการปฏิบัติ..."
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-amber-200/80 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 h-20 resize-none font-medium"
                    />
                  </div>
                </div>

                {/* Right Column: Monks Select */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">
                    เลือกพระภิกษุสามเณรผู้รับผิดชอบ <span className="text-[10px] font-normal text-amber-700/60 dark:text-amber-400/50">(ไม่รวมตำแหน่งเจ้าอาวาส)</span>
                  </label>
                  <div className="h-[280px] overflow-y-auto border border-amber-200/80 dark:border-amber-950 rounded-xl p-3 space-y-1.5 bg-amber-50/10 dark:bg-amber-950/5">
                    {dutyMonks.map(m => {
                      const isChecked = selectedMonkIds.includes(m.id);
                      return (
                        <label key={m.id} className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-amber-900 dark:text-amber-200 p-2 hover:bg-amber-500/10 rounded-lg transition-colors">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMonkIds(prev => [...prev, m.id]);
                              } else {
                                setSelectedMonkIds(prev => prev.filter(id => id !== m.id));
                              }
                            }}
                            className="size-4 rounded accent-amber-600 cursor-pointer shrink-0"
                          />
                          <span>{m.name} ({m.chaya || 'เณร'})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t border-amber-100 dark:border-amber-950">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 text-xs font-bold border-amber-200 text-amber-800 dark:text-amber-400 cursor-pointer"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2.5 px-6 rounded-xl flex items-center gap-1 border-none shadow-md shadow-amber-500/10 cursor-pointer"
                >
                  {isSaving && <Loader2 className="size-3.5 animate-spin" />}
                  บันทึกข้อมูล
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auto Rotate Modal */}
      {isAutoRotateOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/60 backdrop-blur-sm p-4 no-print">
          <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/50 dark:border-amber-950/40 shadow-2xl w-full max-w-md animate-scale-up">
            <div className="h-1.5 bg-gradient-to-r from-amber-500 to-amber-700" />
            <div className="p-6 border-b border-amber-100 dark:border-amber-950 flex justify-between items-center bg-amber-50/20 dark:bg-amber-950/5">
              <h3 className="font-bold text-base text-amber-900 dark:text-amber-200 font-heading flex items-center gap-2">
                <Sparkles className="size-4 text-amber-500" />
                สุ่มจัดคิวหมุนเวียนอัตโนมัติ (Auto-Rotate)
              </h3>
              <button
                type="button"
                onClick={() => setIsAutoRotateOpen(false)}
                className="text-amber-700/50 dark:text-amber-400/40 hover:text-amber-900 dark:hover:text-amber-200 border-none bg-transparent cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-amber-700/70 dark:text-amber-400/60 leading-relaxed">
                ระบบจะทำการสุ่มหมุนเวียนจัดคิวเวรปฏิบัติจาก {dutyTypes.length} ประเภทกิจวัตรประจำวัด ให้แก่พระภิกษุสามเณร {dutyMonks.length} รูปที่จำพรรษาอย่างเท่าเทียมกัน (ไม่รวมตำแหน่งเจ้าอาวาส)
              </p>

              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">เริ่มจัดตั้งแต่วันที่</label>
                <ThaiDatePicker
                  required
                  value={autoRotateDate}
                  onChange={(val) => setAutoRotateDate(val)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">จำนวนวันที่ต้องการจัดคิว</label>
                <select
                  value={autoRotateDays}
                  onChange={(e) => setAutoRotateDays(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none cursor-pointer"
                >
                  <option value={3}>3 วัน</option>
                  <option value={7}>7 วัน (1 สัปดาห์)</option>
                  <option value={14}>14 วัน (2 สัปดาห์)</option>
                  <option value={30}>30 วัน (1 เดือน)</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-amber-100 dark:border-amber-950">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAutoRotateOpen(false)}
                  className="py-2.5 px-4 text-xs font-bold border-amber-200 text-amber-800 dark:text-amber-400 cursor-pointer"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="button"
                  onClick={handleRunAutoRotate}
                  disabled={isSaving}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 px-5 rounded-lg flex items-center gap-1 border-none shadow-md cursor-pointer"
                >
                  {isSaving && <Loader2 className="size-3.5 animate-spin" />}
                  เริ่มจัดคิวอัตโนมัติ
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature 3: Printable Duty Roster Template (Visible only when printing window.print()) */}
      <div className="hidden print:block p-8 font-serif text-black space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">ตารางปฏิบัติกิจสงฆ์ประจำวัด</h1>
          <p className="text-sm font-semibold">ประจำเดือน {THAI_MONTHS_LONG[calMonth]} พ.ศ. {calYear + 543}</p>
        </div>

        <table className="w-full border-collapse border border-black text-xs text-left">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2 text-center w-28">วันที่ / เวลา</th>
              <th className="border border-black p-2">ชื่อเวร / งานปฏิบัติ</th>
              <th className="border border-black p-2">ช่วงเวลา</th>
              <th className="border border-black p-2">พระภิกษุสามเณรผู้รับผิดชอบ</th>
              <th className="border border-black p-2 text-center w-20">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {filteredDuties.map(d => (
              <tr key={d.id}>
                <td className="border border-black p-2 text-center">{formatThaiDate(d.date, 'short')}</td>
                <td className="border border-black p-2 font-bold">{d.duty_title}</td>
                <td className="border border-black p-2">{d.time_slot}</td>
                <td className="border border-black p-2">{d.assigned_monk_names}</td>
                <td className="border border-black p-2 text-center font-bold">
                  {d.status === 'completed' ? 'ปฏิบัติแล้ว' : d.status === 'swapped' ? 'สลับเวร' : 'รอปฏิบัติ'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-between items-end pt-12 text-xs">
          <div className="text-center space-y-8">
            <p>ลงนาม.......................................................</p>
            <p>(.......................................................)<br/>ไวยาวัจกร / ผู้ช่วยจัดตารางเวร</p>
          </div>
          <div className="text-center space-y-8">
            <p>ลงนาม.......................................................</p>
            <p>(.......................................................)<br/>เจ้าอาวาส / ผู้ปกครองวัด</p>
          </div>
        </div>
      </div>
    </div>
  );
}
