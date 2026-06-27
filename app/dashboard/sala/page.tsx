'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit,
  Trash,
  X,
  Loader2,
  Check,
  AlertTriangle,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Phone,
  User,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomDialog } from '@/components/ui/custom-dialog';
import { db, Sala, SalaBooking, TempleEvent } from '@/lib/db';
import { formatThaiDate } from '@/lib/utils';
import { usePermission } from '@/lib/usePermission';
import { ThaiDatePicker } from '@/components/ui/thai-date-picker';
import { checkWanKaoKong } from '@/lib/lanna-calendar';

export default function SalaManagement() {
  const { permissions } = usePermission();
  const [activeTab, setActiveTab] = useState<'bookings' | 'salas'>('bookings');
  
  // Data lists
  const [salas, setSalas] = useState<Sala[]>([]);
  const [bookings, setBookings] = useState<SalaBooking[]>([]);
  const [templeEvents, setTempleEvents] = useState<TempleEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  // Modal states for Salas
  const [isSalaModalOpen, setIsSalaModalOpen] = useState(false);
  const [currentSala, setCurrentSala] = useState<Partial<Sala>>({});
  
  // Modal states for Bookings
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<Partial<SalaBooking>>({});
  
  const [isSaving, setIsSaving] = useState(false);

  // Dialog states
  const [alertState, setAlertState] = useState<{
    show: boolean;
    title: string;
    description: string;
    variant: 'success' | 'destructive' | 'warning' | 'info';
  } | null>(null);

  const [confirmState, setConfirmState] = useState<{
    show: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  // Load all data
  const loadData = async () => {
    setLoading(true);
    try {
      const [salasList, bookingsList, eventsList] = await Promise.all([
        db.salas.list(),
        db.salaBookings.list(),
        db.events.list()
      ]);
      setSalas(salasList);
      setBookings(bookingsList);
      setTempleEvents(eventsList);
    } catch (err: any) {
      showAlert('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถโหลดข้อมูลระบบศาลาได้', 'destructive');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showAlert = (title: string, description: string, variant: 'success' | 'destructive' | 'warning' | 'info' = 'info') => {
    setAlertState({
      show: true,
      title,
      description,
      variant
    });
  };

  // --- Sala Handlers ---
  const handleOpenAddSala = () => {
    setCurrentSala({
      id: '',
      short_name: '',
      full_name: '',
      capacity: 0,
      description: '',
      is_active: true
    });
    setIsSalaModalOpen(true);
  };

  const handleOpenEditSala = (sala: Sala) => {
    setCurrentSala({ ...sala });
    setIsSalaModalOpen(true);
  };

  const handleSaveSala = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSala.short_name?.trim()) {
      showAlert('ข้อมูลไม่ครบถ้วน', 'กรุณาระบุชื่อย่อศาลา', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const salaToSave: Sala = {
        id: currentSala.id || `sala-${Date.now()}`,
        short_name: currentSala.short_name,
        full_name: currentSala.full_name || '',
        capacity: currentSala.capacity ? Number(currentSala.capacity) : undefined,
        description: currentSala.description || '',
        is_active: currentSala.is_active !== false
      };

      await db.salas.save(salaToSave);
      setIsSalaModalOpen(false);
      showAlert('สำเร็จ', 'บันทึกข้อมูลศาลาเรียบร้อยแล้ว', 'success');
      loadData();
    } catch (err: any) {
      showAlert('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถบันทึกข้อมูลได้', 'destructive');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSala = (id: string) => {
    setConfirmState({
      show: true,
      title: 'ยืนยันการลบศาลา',
      description: 'คุณต้องการลบศาลานี้ใช่หรือไม่? ข้อมูลการจองที่เชื่อมโยงกับศาลานี้อาจได้รับผลกระทบ',
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await db.salas.delete(id);
          showAlert('สำเร็จ', 'ลบข้อมูลศาลาเรียบร้อยแล้ว', 'success');
          loadData();
        } catch (err: any) {
          showAlert('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถลบศาลาได้', 'destructive');
        }
      }
    });
  };

  const handleToggleSalaActive = async (sala: Sala) => {
    try {
      const updatedSala = {
        ...sala,
        is_active: !sala.is_active
      };
      await db.salas.save(updatedSala);
      loadData();
    } catch (err: any) {
      showAlert('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถเปลี่ยนสถานะได้', 'destructive');
    }
  };

  // --- Booking Handlers ---
  const handleOpenAddBooking = (prefilledDate?: string) => {
    if (salas.length === 0) {
      showAlert('ยังไม่มีศาลาในระบบ', 'กรุณาเพิ่มข้อมูลศาลาก่อนทำการจอง', 'warning');
      return;
    }
    const todayStr = prefilledDate || formatDateStr(new Date());
    setCurrentBooking({
      id: '',
      sala_id: salas[0].id,
      event_title: '',
      event_type: 'funeral',
      booker_name: '',
      booker_phone: '',
      start_date: todayStr,
      end_date: todayStr,
      num_days: 1,
      status: 'pending',
      notes: ''
    });
    setIsBookingModalOpen(true);
  };

  const handleOpenEditBooking = (booking: SalaBooking) => {
    setCurrentBooking({ ...booking });
    setIsBookingModalOpen(true);
  };

  const handleSaveBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBooking.event_title?.trim()) {
      showAlert('ข้อมูลไม่ครบถ้วน', 'กรุณาระบุหัวข้อกิจกรรมหรือชื่อผู้จัดงาน', 'warning');
      return;
    }
    if (!currentBooking.booker_name?.trim()) {
      showAlert('ข้อมูลไม่ครบถ้วน', 'กรุณาระบุชื่อผู้จอง', 'warning');
      return;
    }
    if (!currentBooking.start_date || !currentBooking.end_date) {
      showAlert('ข้อมูลไม่ครบถ้วน', 'กรุณาระบุช่วงเวลาการจอง', 'warning');
      return;
    }

    const start = new Date(currentBooking.start_date);
    const end = new Date(currentBooking.end_date);
    if (end < start) {
      showAlert('วันที่ไม่ถูกต้อง', 'วันสิ้นสุดการจองต้องไม่ก่อนหน้าวันเริ่มต้น', 'warning');
      return;
    }

    // Check Wan Kao Kong validation for funerals/cremations
    const isFuneralType = currentBooking.event_type === 'funeral';
    const isFuneralTitle = /เผาศพ|ฌาปนกิจ|ปลงศพ|งานศพ|สวดศพ|อภิธรรมศพ/g.test(currentBooking.event_title || '');
    if (isFuneralType || isFuneralTitle) {
      const lastDay = new Date(currentBooking.end_date);
      const lastDayInfo = checkWanKaoKong(lastDay);
      if (lastDayInfo.isWanKaoKong) {
        showAlert(
          'ผิดหลักประเพณีล้านนา',
          `ไม่สามารถจองได้เนื่องจากวันสุดท้ายของการจัดงานศพ (${formatThaiDate(currentBooking.end_date)}) ตรงกับ "วันเก้ากอง" (วัน${lastDayInfo.daySign} เดือน ${lastDayInfo.lannaMonthName}) ซึ่งตามจารีตประเพณีล้านนาโบราณห้ามจัดพิธีเผาศพ/ฌาปนกิจเด็ดขาด`,
          'warning'
        );
        return;
      }
    }

    // Calculate number of days (inclusive)
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Check for double booking conflicts on the same sala_id (excluding cancelled bookings and editing the same booking)
    if (currentBooking.status !== 'cancelled') {
      const conflict = bookings.find(b => 
        b.sala_id === currentBooking.sala_id &&
        b.id !== currentBooking.id &&
        b.status !== 'cancelled' &&
        currentBooking.start_date! < b.end_date &&
        currentBooking.end_date! > b.start_date
      );

      if (conflict) {
        const salaName = salas.find(s => s.id === currentBooking.sala_id)?.short_name || 'ศาลา';
        showAlert(
          'ตรวจพบการจองซ้ำซ้อน', 
          `ไม่สามารถจองได้เนื่องจาก ${salaName} มีการจองงาน "${conflict.event_title}" อยู่แล้วในช่วงเวลาดังกล่าว (${formatThaiDate(conflict.start_date)} ถึง ${formatThaiDate(conflict.end_date)})`, 
          'warning'
        );
        return;
      }
    }

    setIsSaving(true);
    try {
      const bookingToSave: SalaBooking = {
        id: currentBooking.id || `bk-${Date.now()}`,
        sala_id: currentBooking.sala_id!,
        event_title: currentBooking.event_title,
        event_type: currentBooking.event_type as 'funeral' | 'ceremony' | 'wedding' | 'other',
        booker_name: currentBooking.booker_name,
        booker_phone: currentBooking.booker_phone || '',
        start_date: currentBooking.start_date,
        end_date: currentBooking.end_date,
        num_days: diffDays,
        status: currentBooking.status as 'pending' | 'confirmed' | 'completed' | 'cancelled',
        notes: currentBooking.notes || '',
        quotation_id: currentBooking.quotation_id || undefined,
        created_at: currentBooking.created_at || new Date().toISOString()
      };

      const isNew = !currentBooking.id;
      await db.salaBookings.save(bookingToSave);
      
      // Trigger LINE Notification (Background)
      const salaName = salas.find((s) => s.id === bookingToSave.sala_id)?.short_name || 'ไม่ระบุ';
      fetch('/api/notifications/line', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: isNew ? 'create_booking' : 'update_booking',
          event: {
            ...bookingToSave,
            sala_name: salaName
          }
        })
      }).catch(err => console.error('Failed to send LINE notification on save booking:', err));

      setIsBookingModalOpen(false);
      showAlert('สำเร็จ', 'บันทึกข้อมูลการจองศาลาเรียบร้อยแล้ว', 'success');
      loadData();
    } catch (err: any) {
      showAlert('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถบันทึกการจองได้', 'destructive');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBooking = (id: string) => {
    const bookingToDelete = bookings.find(b => b.id === id);
    setConfirmState({
      show: true,
      title: 'ยืนยันการยกเลิก/ลบการจอง',
      description: 'คุณต้องการลบรายการจองศาลานี้ใช่หรือไม่?',
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await db.salaBookings.delete(id);
          
          if (bookingToDelete) {
            // Trigger LINE Notification (Background)
            const deletedSalaName = salas.find((s) => s.id === bookingToDelete.sala_id)?.short_name || 'ไม่ระบุ';
            fetch('/api/notifications/line', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                action: 'delete_booking',
                event: {
                  ...bookingToDelete,
                  sala_name: deletedSalaName
                }
              })
            }).catch(err => console.error('Failed to send LINE notification on delete booking:', err));
          }

          showAlert('สำเร็จ', 'ลบการจองเรียบร้อยแล้ว', 'success');
          loadData();
        } catch (err: any) {
          showAlert('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถลบการจองได้', 'destructive');
        }
      }
    });
  };

  // --- Calendar logic ---
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: Date[] = [];
    
    // Add padded days from prev month
    const startPadding = firstDay.getDay();
    for (let i = startPadding - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i));
    }
    
    // Add current month days
    const totalDays = lastDay.getDate();
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }
    
    // Add padded days from next month to make grid full multiple of 7
    const endPadding = 42 - days.length; // 6 rows of 7 days
    for (let i = 1; i <= endPadding; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    return days;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const getThaiDateString = (date: Date) => {
    return `${date.getDate()} ${thaiMonths[date.getMonth()]} ${date.getFullYear() + 543}`;
  };

  // Helper to format date object to YYYY-MM-DD in local time
  const formatDateStr = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Check if dates overlap
  const isDateBooked = (date: Date, booking: SalaBooking) => {
    const dStr = formatDateStr(date);
    return dStr >= booking.start_date && dStr <= booking.end_date;
  };

  // Get color for bookings
  const getEventStyle = (type: string, status: string) => {
    if (status === 'cancelled') return 'bg-gray-100 dark:bg-zinc-800 text-gray-400 border-gray-250';
    
    switch (type) {
      case 'funeral':
        return 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400';
      case 'ceremony':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400';
      case 'wedding':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400';
      default:
        return 'bg-indigo-500/10 border-indigo-500/20 text-indigo-700 dark:text-indigo-400';
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case 'funeral': return 'งานศพ';
      case 'ceremony': return 'งานพิธี';
      case 'wedding': return 'งานมงคลสมรส';
      default: return 'อื่นๆ';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">รอยืนยัน</span>;
      case 'confirmed':
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">ยืนยันแล้ว</span>;
      case 'completed':
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">เสร็จสิ้น</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">ยกเลิก</span>;
      default:
        return null;
    }
  };

  const getSalaColor = (salaId: string) => {
    const index = salas.findIndex(s => s.id === salaId);
    const colors = [
      'border-amber-500/40 text-amber-600 bg-amber-500/5',
      'border-emerald-500/40 text-emerald-600 bg-emerald-500/5',
      'border-sky-500/40 text-sky-600 bg-sky-500/5',
      'border-purple-500/40 text-purple-600 bg-purple-500/5',
      'border-rose-500/40 text-rose-600 bg-rose-500/5'
    ];
    return colors[index % colors.length] || colors[0];
  };

  const calendarDays = getDaysInMonth(currentDate);

  // Selected date bookings
  const selectedDateBookings = bookings.filter(b => {
    if (!selectedDate) return false;
    return isDateBooked(selectedDate, b);
  });

  const selectedDateEvents = templeEvents.filter(e => {
    if (!selectedDate) return false;
    return e.date === formatDateStr(selectedDate);
  });

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading text-amber-900 dark:text-amber-200">
            ระบบจองศาลาและศาสนสถาน
          </h2>
          <p className="text-xs text-amber-700/50 dark:text-amber-400/50">
            จัดการทะเบียนศาลา และปฏิทินตารางการจองจัดกิจกรรมภายในวัด
          </p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-amber-500/5 dark:bg-[#1a150e] border border-amber-200/40 dark:border-amber-950/30 rounded-xl p-1 shrink-0">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
              activeTab === 'bookings'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-amber-800 dark:text-amber-450 hover:bg-amber-500/10'
            }`}
          >
            ปฏิทินและการจอง
          </button>
          <button
            onClick={() => setActiveTab('salas')}
            className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
              activeTab === 'salas'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-amber-800 dark:text-amber-450 hover:bg-amber-500/10'
            }`}
          >
            ทะเบียนศาลา
          </button>
        </div>
      </div>

      {/* Dialog Alerts */}
      {alertState && alertState.show && (
        <CustomDialog
          show={alertState.show}
          type="alert"
          variant={alertState.variant}
          title={alertState.title}
          description={alertState.description}
          onConfirm={() => setAlertState(null)}
        />
      )}

      {/* Confirm Deletion */}
      {confirmState && confirmState.show && (
        <CustomDialog
          show={confirmState.show}
          type="confirm"
          variant="destructive"
          title={confirmState.title}
          description={confirmState.description}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
          confirmText="ยืนยัน"
          cancelText="ยกเลิก"
        />
      )}

      {/* --- TAB 1: CALENDAR & BOOKINGS --- */}
      {activeTab === 'bookings' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          {/* Calendar Grid */}
          <div className="xl:col-span-2 bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 p-4 shadow-md shadow-amber-100/5">
            {/* Calendar Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-amber-950 dark:text-amber-100 font-heading">
                {thaiMonths[currentDate.getMonth()]} {currentDate.getFullYear() + 543}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg border border-amber-200/60 dark:border-amber-950 hover:bg-amber-500/10 text-amber-800 dark:text-amber-300 cursor-pointer"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-2.5 py-1.5 text-[10px] font-bold rounded-lg border border-amber-200/60 dark:border-amber-950 hover:bg-amber-500/10 text-amber-800 dark:text-amber-300 cursor-pointer"
                >
                  วันนี้
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg border border-amber-200/60 dark:border-amber-950 hover:bg-amber-500/10 text-amber-800 dark:text-amber-300 cursor-pointer"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>

            {/* Days label */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-amber-900/60 dark:text-amber-400/50 mb-2">
              <div>อา.</div>
              <div>จ.</div>
              <div>อ.</div>
              <div>พ.</div>
              <div>พฤ.</div>
              <div>ศ.</div>
              <div>ส.</div>
            </div>

            {/* Calendar Grid cells */}
            <div className="grid grid-cols-7 gap-1.5 min-h-[350px]">
              {loading ? (
                <div className="col-span-7 flex items-center justify-center min-h-[300px]">
                  <Loader2 className="size-6 text-amber-500 animate-spin" />
                </div>
              ) : (
                calendarDays.map((day, idx) => {
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  const isToday = day.toDateString() === new Date().toDateString();
                  const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
                  const wanKaoKongInfo = checkWanKaoKong(day);
                  
                  // Bookings for this day
                  const dayBookings = bookings.filter(b => isDateBooked(day, b));
                  const dayEvents = templeEvents.filter(e => e.date === formatDateStr(day));

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDate(day)}
                      className={`min-h-[60px] p-1 border rounded-lg flex flex-col justify-between cursor-pointer transition-all ${
                        isCurrentMonth 
                          ? 'bg-amber-50/5 border-amber-250/20 dark:border-amber-950/20 hover:border-amber-400' 
                          : 'bg-gray-50/20 dark:bg-zinc-950/10 border-gray-100 dark:border-zinc-950 opacity-40'
                      } ${
                        isSelected 
                          ? 'border-amber-500 ring-2 ring-amber-500/10 dark:ring-amber-500/20 bg-amber-500/5' 
                          : ''
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`text-[10px] font-bold ${
                          isToday 
                            ? 'bg-amber-500 text-white w-4 h-4 rounded-full flex items-center justify-center font-bold' 
                            : 'text-amber-950 dark:text-amber-100'
                        }`}>
                          {day.getDate()}
                        </span>
                        
                        <div className="flex items-center gap-0.5">
                          {wanKaoKongInfo.isWanKaoKong && (
                            <span 
                              className="text-[9px] leading-none text-red-500 font-extrabold cursor-help select-none animate-pulse"
                              title={`วันเก้ากอง (ห้ามเผาศพ): วัน${wanKaoKongInfo.daySign} เดือน ${wanKaoKongInfo.lannaMonthName}`}
                            >
                              🚫
                            </span>
                          )}
                          {/* Day indicator dots */}
                          {(dayBookings.length > 0 || dayEvents.length > 0) && (
                            <div className="flex gap-0.5">
                              {dayBookings.slice(0, 3).map((b, bIdx) => (
                                <span
                                  key={bIdx}
                                  className={`w-1 h-1 rounded-full ${
                                    b.event_type === 'funeral' ? 'bg-rose-500' :
                                    b.event_type === 'ceremony' ? 'bg-amber-500' :
                                    b.event_type === 'wedding' ? 'bg-emerald-500' : 'bg-indigo-500'
                                  }`}
                                />
                              ))}
                              {dayEvents.slice(0, 3).map((e, eIdx) => (
                                <span
                                  key={`edot-${eIdx}`}
                                  className="w-1 h-1 rounded-full bg-amber-400"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Display first booking snippet */}
                      <div className="mt-1 space-y-0.5 overflow-hidden">
                        {dayBookings.slice(0, 2).map((b, bIdx) => {
                          const salaObj = salas.find(s => s.id === b.sala_id);
                          return (
                            <div
                              key={bIdx}
                              className={`text-[8px] px-1 py-0.5 rounded-sm border truncate font-bold ${getEventStyle(b.event_type, b.status)}`}
                              title={`${salaObj?.short_name || 'ศาลา'}: ${b.event_title}`}
                            >
                              {salaObj?.short_name || 'ศาลา'}: {b.event_title}
                            </div>
                          );
                        })}
                        {dayEvents.slice(0, 2).map((e, eIdx) => {
                          return (
                            <div
                              key={`e-${eIdx}`}
                              className="text-[8px] px-1 py-0.5 rounded-sm border truncate font-bold bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300"
                              title={`งานนิมนต์: ${e.title}`}
                            >
                              [นิมนต์] {e.title}
                            </div>
                          );
                        })}
                        {dayBookings.length + dayEvents.length > 2 && (
                          <div className="text-[7px] text-amber-700/60 dark:text-amber-400/50 text-center font-semibold">
                            +{dayBookings.length + dayEvents.length - 2} รายการ
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Booking List for Selected Day */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 p-4 shadow-md shadow-amber-100/5">
              <div className="flex justify-between items-center pb-3 border-b border-amber-100/50 dark:border-amber-950/30 mb-3">
                <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-200">
                  <CalendarIcon className="size-4 text-amber-500" />
                  <span className="text-xs font-bold font-heading">
                    {selectedDate ? getThaiDateString(selectedDate) : 'กรุณาเลือกวันที่'}
                  </span>
                </div>
                {permissions.canCreate && selectedDate && (
                  <Button
                    onClick={() => {
                      const dStr = formatDateStr(selectedDate);
                      handleOpenAddBooking(dStr);
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] py-2 px-2.5 rounded-lg border-none shadow-sm cursor-pointer"
                  >
                    <Plus className="size-3" />
                    จองศาลา
                  </Button>
                )}
              </div>

              {/* If selected day is Wan Kao Kong, show alert banner */}
              {selectedDate && (() => {
                const info = checkWanKaoKong(selectedDate);
                if (info.isWanKaoKong) {
                  return (
                    <div className="mb-3.5 p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-extrabold flex items-center gap-1.5 animate-pulse">
                      <AlertTriangle className="size-3.5 shrink-0" />
                      <span>วันเก้ากอง (ห้ามเผาศพ): วัน{info.daySign} (เดือน {info.lannaMonthName})</span>
                    </div>
                  );
                }
                return null;
              })()}

              {selectedDateBookings.length === 0 && selectedDateEvents.length === 0 ? (
                <div className="p-8 text-center">
                  <Clock className="size-8 mx-auto text-amber-200 dark:text-amber-950/50 mb-2" />
                  <p className="text-xs text-amber-700/60 dark:text-amber-500/50">ไม่มีข้อมูลการจองหรือกิจกรรมงานนิมนต์ในวันนี้</p>
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
                  {selectedDateEvents.map((e) => (
                    <div
                      key={e.id}
                      className="p-3 bg-amber-500/5 dark:bg-[#1a150e] rounded-xl border border-amber-500/20 dark:border-amber-950/30 space-y-2 relative"
                    >
                      <div className="absolute top-3 right-3 text-[10px] text-amber-750 dark:text-amber-400 font-bold flex items-center gap-1">
                        <Clock className="size-3.5" /> {e.time} น.
                      </div>
                      <span className="inline-block text-[9px] font-bold px-2 py-0.5 border rounded-sm border-amber-500/40 text-amber-600 bg-amber-500/5">
                        งานนิมนต์และศาสนพิธี
                      </span>
                      <h4 className="font-bold text-xs text-amber-950 dark:text-amber-100 pr-16 font-heading leading-snug">
                        {e.title}
                      </h4>
                      <div className="space-y-1 text-[10px] text-amber-800/80 dark:text-amber-400/80">
                        <div>สถานที่: {e.location}</div>
                        <div>เจ้าภาพ: {e.host_name}</div>
                        <div>นิมนต์พระสงฆ์: {e.monks_needed} รูป</div>
                      </div>
                      <div className="text-[9px] text-amber-750/60 dark:text-amber-400/50 pt-1.5 border-t border-amber-100/50 dark:border-amber-950/20 italic">
                        * จัดการงานนิมนต์นี้ได้ที่เมนู "ตารางงานนิมนต์และศาสนพิธี"
                      </div>
                    </div>
                  ))}
                  {selectedDateBookings.map((bk) => {
                    const salaObj = salas.find(s => s.id === bk.sala_id);
                    return (
                      <div
                        key={bk.id}
                        className="p-3 bg-amber-500/5 dark:bg-[#1a150e] rounded-xl border border-amber-200/30 dark:border-amber-950/20 space-y-2 relative"
                      >
                        {/* Status label */}
                        <div className="absolute top-3 right-3">
                          {getStatusBadge(bk.status)}
                        </div>

                        {/* Hall Label */}
                        <span className={`inline-block text-[9px] font-bold px-2 py-0.5 border rounded-sm ${getSalaColor(bk.sala_id)}`}>
                          {salaObj?.short_name || 'ไม่พบข้อมูลศาลา'}
                        </span>

                        <h4 className="font-bold text-xs text-amber-950 dark:text-amber-100 pr-12 font-heading leading-snug">
                          {bk.event_title}
                        </h4>

                        <div className="space-y-1 text-[10px] text-amber-800/80 dark:text-amber-400/80">
                          <div className="flex items-center gap-1.5">
                            <Clock className="size-3.5 text-amber-600/60" />
                            <span>{bk.start_date === bk.end_date ? `จอง 1 วัน (${formatThaiDate(bk.start_date)})` : `จอง ${bk.num_days} วัน (${formatThaiDate(bk.start_date)} ถึง ${formatThaiDate(bk.end_date)})`}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <User className="size-3.5 text-amber-600/60" />
                            <span>ผู้จอง: <strong className="font-semibold text-amber-900 dark:text-amber-300">{bk.booker_name}</strong></span>
                          </div>
                          {bk.booker_phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="size-3.5 text-amber-600/60" />
                              <span>โทร: <strong className="font-semibold text-amber-900 dark:text-amber-300">{bk.booker_phone}</strong></span>
                            </div>
                          )}
                          {bk.notes && (
                            <div className="flex items-start gap-1.5 mt-1 pt-1 border-t border-amber-100/50 dark:border-amber-950/20 text-[9px]">
                              <Info className="size-3 text-amber-600/50 mt-0.5 shrink-0" />
                              <span className="italic">หมายเหตุ: {bk.notes}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-1 pt-2">
                          {permissions.canEdit && (
                            <button
                              onClick={() => handleOpenEditBooking(bk)}
                              className="p-1 rounded-lg border border-amber-200/50 dark:border-amber-950 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 cursor-pointer"
                            >
                              <Edit className="size-3.5" />
                            </button>
                          )}
                          {permissions.canDelete && (
                            <button
                              onClick={() => handleDeleteBooking(bk.id)}
                              className="p-1 rounded-lg border border-rose-200/50 dark:border-rose-950 hover:bg-rose-500/10 text-rose-600 dark:text-rose-450 cursor-pointer"
                            >
                              <Trash className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: SALAS LIST --- */}
      {activeTab === 'salas' && (
        <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 overflow-hidden shadow-md shadow-amber-100/5">
          <div className="p-4 border-b border-amber-100/50 dark:border-amber-950/30 flex justify-between items-center bg-amber-50/10">
            <span className="text-xs font-bold text-amber-800/80 dark:text-amber-300">
              ศาลาทั้งหมด ({salas.length})
            </span>
            {permissions.canCreate && (
              <Button
                onClick={handleOpenAddSala}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] py-2 px-3 rounded-lg border-none shadow-sm cursor-pointer"
              >
                <Plus className="size-3" />
                เพิ่มศาลาใหม่
              </Button>
            )}
          </div>
          
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="size-6 text-amber-500 animate-spin mx-auto" />
            </div>
          ) : salas.length === 0 ? (
            <div className="p-12 text-center">
              <Info className="size-12 mx-auto text-amber-200 dark:text-amber-950/50 mb-3" />
              <p className="text-sm text-amber-800/50 dark:text-amber-500/40">ยังไม่มีการเพิ่มรายชื่อศาลาในระบบ</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-amber-500/10 border-b border-amber-200/30 dark:border-amber-950/30 text-amber-900 dark:text-amber-300 font-bold">
                    <th className="p-4 w-36">ชื่อย่อ (สั้น)</th>
                    <th className="p-4">ชื่อเรียกอย่างเป็นทางการ</th>
                    <th className="p-4 w-36 text-center">ความจุ (คน)</th>
                    <th className="p-4 w-32 text-center">สถานะใช้งาน</th>
                    <th className="p-4 w-28 text-center">ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100/50 dark:divide-amber-950/20">
                  {salas.map((sala) => (
                    <tr key={sala.id} className="hover:bg-amber-50/20 dark:hover:bg-amber-950/10 transition-colors">
                      <td className="p-4 font-bold text-amber-950 dark:text-amber-100">
                        {sala.short_name}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-amber-900 dark:text-amber-250">{sala.full_name || '-'}</div>
                        {sala.description && (
                          <div className="text-[10px] text-amber-700/60 dark:text-amber-400/50 mt-0.5">{sala.description}</div>
                        )}
                      </td>
                      <td className="p-4 text-center font-bold text-amber-950 dark:text-amber-100">
                        {sala.capacity ? `${sala.capacity.toLocaleString()} คน` : 'ไม่ระบุ'}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleSalaActive(sala)}
                          disabled={!permissions.canEdit}
                          className={`mx-auto w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${
                            sala.is_active ? 'bg-emerald-500 justify-end' : 'bg-gray-300 dark:bg-zinc-800 justify-start'
                          } ${!permissions.canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span className="bg-white w-4 h-4 rounded-full shadow-md flex items-center justify-center">
                            {sala.is_active && <Check className="size-3 text-emerald-600 font-bold" />}
                          </span>
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-1.5">
                          {permissions.canEdit && (
                            <button
                              onClick={() => handleOpenEditSala(sala)}
                              className="p-1.5 rounded-lg border border-amber-200/50 dark:border-amber-950 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 cursor-pointer"
                            >
                              <Edit className="size-4" />
                            </button>
                          )}
                          {permissions.canDelete && (
                            <button
                              onClick={() => handleDeleteSala(sala.id)}
                              className="p-1.5 rounded-lg border border-rose-200/50 dark:border-rose-950 hover:bg-rose-500/10 text-rose-600 dark:text-rose-450 cursor-pointer"
                            >
                              <Trash className="size-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- MODAL: SALA CRUD --- */}
      {isSalaModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/50 dark:border-amber-950/40 shadow-2xl w-full max-w-md overflow-hidden relative">
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-sm font-heading">
                {currentSala.id ? 'แก้ไขข้อมูลศาลา' : 'เพิ่มศาลาใหม่'}
              </h3>
              <button onClick={() => setIsSalaModalOpen(false)} className="text-white hover:text-amber-100 cursor-pointer p-1">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSala} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ชื่อย่อศาลา *</label>
                <input
                  type="text"
                  required
                  value={currentSala.short_name || ''}
                  onChange={(e) => setCurrentSala({ ...currentSala, short_name: e.target.value })}
                  placeholder="เช่น ศาลา 1, ศาลาการเปรียญ"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ชื่อเรียกอย่างเป็นทางการ</label>
                <input
                  type="text"
                  value={currentSala.full_name || ''}
                  onChange={(e) => setCurrentSala({ ...currentSala, full_name: e.target.value })}
                  placeholder="เช่น ศาลาบำเพ็ญกุศลธรรมสังเวช"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ความจุศาลา (คน)</label>
                <input
                  type="number"
                  min="0"
                  value={currentSala.capacity === undefined ? '' : currentSala.capacity}
                  onChange={(e) => setCurrentSala({ ...currentSala, capacity: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="เช่น 100"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">คำอธิบายเพิ่มเติม</label>
                <textarea
                  value={currentSala.description || ''}
                  onChange={(e) => setCurrentSala({ ...currentSala, description: e.target.value })}
                  placeholder="รายละเอียดสิ่งอำนวยความสะดวก หรือหมายเหตุศาลานี้..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSalaModalOpen(false)}
                  className="flex-1 border-amber-200 text-amber-950 hover:bg-amber-50/50 dark:border-amber-950/80 dark:text-amber-350 dark:hover:bg-amber-950/20 py-5 text-xs font-bold cursor-pointer"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-5 text-xs font-bold border-none shadow-md shadow-amber-500/10 cursor-pointer"
                >
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: BOOKING CRUD --- */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/50 dark:border-amber-950/40 shadow-2xl w-full max-w-md overflow-hidden relative">
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-sm font-heading">
                {currentBooking.id ? 'แก้ไขรายละเอียดการจอง' : 'จองศาลาใหม่'}
              </h3>
              <button onClick={() => setIsBookingModalOpen(false)} className="text-white hover:text-amber-100 cursor-pointer p-1">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBooking} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Select Sala */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">เลือกศาลา *</label>
                <select
                  value={currentBooking.sala_id || ''}
                  onChange={(e) => setCurrentBooking({ ...currentBooking, sala_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                >
                  {salas.filter(s => s.is_active).map(s => (
                    <option key={s.id} value={s.id}>{s.short_name} ({s.full_name || 'ศาลา'})</option>
                  ))}
                </select>
              </div>

              {/* Event Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ชื่องาน / กิจกรรม (หัวข้อการจอง) *</label>
                <input
                  type="text"
                  required
                  value={currentBooking.event_title || ''}
                  onChange={(e) => setCurrentBooking({ ...currentBooking, event_title: e.target.value })}
                  placeholder="เช่น งานศพคุณยายสมศรี, งานสวดมนต์เย็นเทศบาล"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* Event Type */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ประเภทกิจกรรม *</label>
                <select
                  value={currentBooking.event_type || 'funeral'}
                  onChange={(e) => setCurrentBooking({ ...currentBooking, event_type: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                >
                  <option value="funeral">งานศพ / บำเพ็ญกุศล (Funeral)</option>
                  <option value="ceremony">งานพิธีการ / สวดมนต์ (Ceremony)</option>
                  <option value="wedding">งานมงคลสมรส (Wedding)</option>
                  <option value="other">อื่นๆ (Other)</option>
                </select>
              </div>

              {/* Booker Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ชื่อผู้ติดต่อ / ผู้จองหลัก *</label>
                <input
                  type="text"
                  required
                  value={currentBooking.booker_name || ''}
                  onChange={(e) => setCurrentBooking({ ...currentBooking, booker_name: e.target.value })}
                  placeholder="ชื่อ-นามสกุล ผู้แทนครอบครัว/เจ้าภาพ"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* Booker Phone */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">เบอร์โทรศัพท์ผู้ติดต่อ</label>
                <input
                  type="text"
                  value={currentBooking.booker_phone || ''}
                  onChange={(e) => setCurrentBooking({ ...currentBooking, booker_phone: e.target.value })}
                  placeholder="เช่น 081-xxxxxxx"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* Date Ranges */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">วันที่เริ่มจอง *</label>
                  <ThaiDatePicker
                    required
                    value={currentBooking.start_date || ''}
                    onChange={(val) => setCurrentBooking({ ...currentBooking, start_date: val })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">วันที่สิ้นสุด *</label>
                  <ThaiDatePicker
                    required
                    value={currentBooking.end_date || ''}
                    onChange={(val) => setCurrentBooking({ ...currentBooking, end_date: val })}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">สถานะคำขอการจอง *</label>
                <select
                  value={currentBooking.status || 'pending'}
                  onChange={(e) => setCurrentBooking({ ...currentBooking, status: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                >
                  <option value="pending">รอยืนยัน (Pending)</option>
                  <option value="confirmed">ยืนยันการจองแล้ว (Confirmed)</option>
                  <option value="completed">เสร็จสิ้นงานพิธี (Completed)</option>
                  <option value="cancelled">ยกเลิกการจอง (Cancelled)</option>
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">หมายเหตุเพิ่มเติม</label>
                <textarea
                  value={currentBooking.notes || ''}
                  onChange={(e) => setCurrentBooking({ ...currentBooking, notes: e.target.value })}
                  placeholder="เช่น ต้องการพัดลมเพิ่ม 2 ตัว, จัดอาหารถวายพระ..."
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="flex-1 border-amber-200 text-amber-950 hover:bg-amber-50/50 dark:border-amber-950/80 dark:text-amber-350 dark:hover:bg-amber-950/20 py-5 text-xs font-bold cursor-pointer"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-5 text-xs font-bold border-none shadow-md shadow-amber-500/10 cursor-pointer"
                >
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึกการจอง'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
