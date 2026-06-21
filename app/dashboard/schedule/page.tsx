'use client';

import React from 'react';
import {
  Calendar as CalendarIcon,
  Search,
  Plus,
  Edit,
  Trash,
  X,
  Clock,
  MapPin,
  User,
  Loader2,
  Users,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useScheduleController } from '@/app/Controllers/useScheduleController';
import { CustomDialog } from '@/components/ui/custom-dialog';
import { usePermission } from '@/lib/usePermission';
import { db, Sala, SalaBooking } from '@/lib/db';

// Thai Month Names
const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

// Helper to format date object to YYYY-MM-DD
const formatDateStr = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Wan Phra and Thai Important Days Lookup
const getSpecialDayInfo = (dateStr: string) => {
  const md = dateStr.substring(5); // 'MM-DD'
  
  // Fixed annual Thai holidays
  const fixedHolidays: { [key: string]: string } = {
    '01-01': 'วันขึ้นปีใหม่',
    '04-06': 'วันจักรี',
    '04-13': 'วันสงกรานต์',
    '04-14': 'วันสงกรานต์',
    '04-15': 'วันสงกรานต์',
    '05-01': 'วันแรงงานแห่งชาติ',
    '05-04': 'วันฉัตรมงคล',
    '06-03': 'วันเฉลิมพระชนมพรรษาราชินี',
    '07-28': 'วันเฉลิมพระชนมพรรษา ร.10',
    '07-29': 'วันภาษาไทยแห่งชาติ',
    '08-12': 'วันแม่แห่งชาติ',
    '10-13': 'วันนวมินทรมหาราช (ร.9)',
    '10-23': 'วันปิยมหาราช',
    '12-05': 'วันพ่อแห่งชาติ / วันชาติ',
    '12-10': 'วันรัฐธรรมนูญ',
    '12-31': 'วันสิ้นปี'
  };

  // Dynamic Buddhist/Thai holidays & Wan Phra for 2026-2027
  const dynamicDays: { [key: string]: { label: string; isWanPhra: boolean; title?: string } } = {
    // 2026
    '2026-01-03': { label: 'ขึ้น 15 ค่ำ เดือน 2', isWanPhra: true },
    '2026-01-11': { label: 'แรม 8 ค่ำ เดือน 2', isWanPhra: true },
    '2026-01-18': { label: 'แรม 15 ค่ำ เดือน 2', isWanPhra: true },
    '2026-01-26': { label: 'ขึ้น 8 ค่ำ เดือน 3', isWanPhra: true },
    '2026-02-02': { label: 'ขึ้น 15 ค่ำ เดือน 3', isWanPhra: true },
    '2026-02-10': { label: 'แรม 8 ค่ำ เดือน 3', isWanPhra: true },
    '2026-02-16': { label: 'แรม 14 ค่ำ เดือน 3', isWanPhra: true },
    '2026-02-24': { label: 'ขึ้น 8 ค่ำ เดือน 4', isWanPhra: true },
    '2026-03-03': { label: 'ขึ้น 15 ค่ำ เดือน 4', isWanPhra: true, title: 'วันมาฆบูชา' },
    '2026-03-11': { label: 'แรม 8 ค่ำ เดือน 4', isWanPhra: true },
    '2026-03-18': { label: 'แรม 15 ค่ำ เดือน 4', isWanPhra: true },
    '2026-03-26': { label: 'ขึ้น 8 ค่ำ เดือน 5', isWanPhra: true },
    '2026-04-02': { label: 'ขึ้น 15 ค่ำ เดือน 5', isWanPhra: true },
    '2026-04-10': { label: 'แรม 8 ค่ำ เดือน 5', isWanPhra: true },
    '2026-04-16': { label: 'แรม 14 ค่ำ เดือน 5', isWanPhra: true },
    '2026-04-24': { label: 'ขึ้น 8 ค่ำ เดือน 6', isWanPhra: true },
    '2026-05-01': { label: 'ขึ้น 15 ค่ำ เดือน 6', isWanPhra: true },
    '2026-05-09': { label: 'แรม 8 ค่ำ เดือน 6', isWanPhra: true },
    '2026-05-16': { label: 'แรม 15 ค่ำ เดือน 6', isWanPhra: true },
    '2026-05-24': { label: 'ขึ้น 8 ค่ำ เดือน 7', isWanPhra: true },
    '2026-05-31': { label: 'ขึ้น 15 ค่ำ เดือน 7', isWanPhra: true, title: 'วันวิสาขบูชา' },
    '2026-06-08': { label: 'แรม 8 ค่ำ เดือน 7', isWanPhra: true, title: 'วันอัฏฐมีบูชา' },
    '2026-06-14': { label: 'แรม 15 ค่ำ เดือน 7', isWanPhra: true },
    '2026-06-22': { label: 'ขึ้น 8 ค่ำ เดือน 8', isWanPhra: true },
    '2026-06-29': { label: 'ขึ้น 15 ค่ำ เดือน 8', isWanPhra: true },
    '2026-07-07': { label: 'แรม 8 ค่ำ เดือน 8', isWanPhra: true },
    '2026-07-14': { label: 'แรม 15 ค่ำ เดือน 8', isWanPhra: true },
    '2026-07-22': { label: 'ขึ้น 8 ค่ำ เดือน 8-8', isWanPhra: true },
    '2026-07-29': { label: 'ขึ้น 15 ค่ำ เดือน 8-8', isWanPhra: true, title: 'วันอาสาฬหบูชา' },
    '2026-07-30': { label: 'แรม 1 ค่ำ เดือน 8-8', isWanPhra: false, title: 'วันเข้าพรรษา' },
    '2026-08-06': { label: 'แรม 8 ค่ำ เดือน 8-8', isWanPhra: true },
    '2026-08-13': { label: 'แรม 15 ค่ำ เดือน 8-8', isWanPhra: true },
    '2026-08-21': { label: 'ขึ้น 8 ค่ำ เดือน 9', isWanPhra: true },
    '2026-08-28': { label: 'ขึ้น 15 ค่ำ เดือน 9', isWanPhra: true },
    '2026-09-05': { label: 'แรม 8 ค่ำ เดือน 9', isWanPhra: true },
    '2026-09-11': { label: 'แรม 14 ค่ำ เดือน 9', isWanPhra: true },
    '2026-09-19': { label: 'ขึ้น 8 ค่ำ เดือน 10', isWanPhra: true },
    '2026-09-26': { label: 'ขึ้น 15 ค่ำ เดือน 10', isWanPhra: true },
    '2026-10-04': { label: 'แรม 8 ค่ำ เดือน 10', isWanPhra: true },
    '2026-10-11': { label: 'แรม 15 ค่ำ เดือน 10', isWanPhra: true },
    '2026-10-19': { label: 'ขึ้น 8 ค่ำ เดือน 11', isWanPhra: true },
    '2026-10-26': { label: 'ขึ้น 15 ค่ำ เดือน 11', isWanPhra: true, title: 'วันออกพรรษา' },
    '2026-11-03': { label: 'แรม 8 ค่ำ เดือน 11', isWanPhra: true },
    '2026-11-09': { label: 'แรม 14 ค่ำ เดือน 11', isWanPhra: true },
    '2026-11-17': { label: 'ขึ้น 8 ค่ำ เดือน 12', isWanPhra: true },
    '2026-11-24': { label: 'ขึ้น 15 ค่ำ เดือน 12', isWanPhra: true, title: 'วันลอยกระทง' },
    '2026-12-02': { label: 'แรม 8 ค่ำ เดือน 12', isWanPhra: true },
    '2026-12-09': { label: 'แรม 15 ค่ำ เดือน 12', isWanPhra: true },
    '2026-12-17': { label: 'ขึ้น 8 ค่ำ เดือน 1', isWanPhra: true },
    '2026-12-24': { label: 'ขึ้น 15 ค่ำ เดือน 1', isWanPhra: true },

    // 2027
    '2027-01-01': { label: 'ขึ้น 8 ค่ำ เดือน 2', isWanPhra: true },
    '2027-01-09': { label: 'ขึ้น 15 ค่ำ เดือน 2', isWanPhra: true },
    '2027-01-17': { label: 'แรม 8 ค่ำ เดือน 2', isWanPhra: true },
    '2027-01-23': { label: 'แรม 14 ค่ำ เดือน 2', isWanPhra: true },
    '2027-01-31': { label: 'ขึ้น 8 ค่ำ เดือน 3', isWanPhra: true },
    '2027-02-07': { label: 'ขึ้น 15 ค่ำ เดือน 3', isWanPhra: true },
    '2027-02-15': { label: 'แรม 8 ค่ำ เดือน 3', isWanPhra: true },
    '2027-02-21': { label: 'แรม 14 ค่ำ เดือน 3', isWanPhra: true, title: 'วันมาฆบูชา' },
    '2027-03-01': { label: 'ขึ้น 8 ค่ำ เดือน 4', isWanPhra: true },
    '2027-03-09': { label: 'ขึ้น 15 ค่ำ เดือน 4', isWanPhra: true },
    '2027-03-17': { label: 'แรม 8 ค่ำ เดือน 4', isWanPhra: true },
    '2027-03-23': { label: 'แรม 14 ค่ำ เดือน 4', isWanPhra: true },
    '2027-03-31': { label: 'ขึ้น 8 ค่ำ เดือน 5', isWanPhra: true },
    '2027-04-08': { label: 'ขึ้น 15 ค่ำ เดือน 5', isWanPhra: true },
    '2027-04-16': { label: 'แรม 8 ค่ำ เดือน 5', isWanPhra: true },
    '2027-04-22': { label: 'แรม 14 ค่ำ เดือน 5', isWanPhra: true },
    '2027-04-30': { label: 'ขึ้น 8 ค่ำ เดือน 6', isWanPhra: true },
    '2027-05-08': { label: 'ขึ้น 15 ค่ำ เดือน 6', isWanPhra: true },
    '2027-05-16': { label: 'แรม 8 ค่ำ เดือน 6', isWanPhra: true },
    '2027-05-22': { label: 'แรม 14 ค่ำ เดือน 6', isWanPhra: true },
    '2027-05-30': { label: 'ขึ้น 8 ค่ำ เดือน 7', isWanPhra: true },
    '2027-06-07': { label: 'ขึ้น 15 ค่ำ เดือน 7', isWanPhra: true },
    '2027-06-15': { label: 'แรม 8 ค่ำ เดือน 7', isWanPhra: true },
    '2027-06-21': { label: 'แรม 14 ค่ำ เดือน 7', isWanPhra: true },
    '2027-06-29': { label: 'ขึ้น 8 ค่ำ เดือน 8', isWanPhra: true },
    '2027-07-03': { label: 'แรม 15 ค่ำ เดือน 7', isWanPhra: true },
    '2027-07-11': { label: 'ขึ้น 8 ค่ำ เดือน 8', isWanPhra: true },
    '2027-07-18': { label: 'ขึ้น 15 ค่ำ เดือน 8', isWanPhra: true, title: 'วันอาสาฬหบูชา' },
    '2027-07-26': { label: 'แรม 8 ค่ำ เดือน 8', isWanPhra: true },
    '2027-08-01': { label: 'แรม 14 ค่ำ เดือน 8', isWanPhra: true },
    '2027-08-02': { label: 'แรม 15 ค่ำ เดือน 8', isWanPhra: true },
    '2027-08-10': { label: 'ขึ้น 8 ค่ำ เดือน 9', isWanPhra: true },
    '2027-08-17': { label: 'ขึ้น 15 ค่ำ เดือน 9', isWanPhra: true },
    '2027-08-25': { label: 'แรม 8 ค่ำ เดือน 9', isWanPhra: true },
    '2027-08-31': { label: 'แรม 14 ค่ำ เดือน 9', isWanPhra: true },
    '2027-09-08': { label: 'ขึ้น 8 ค่ำ เดือน 10', isWanPhra: true },
    '2027-09-16': { label: 'ขึ้น 15 ค่ำ เดือน 10', isWanPhra: true },
    '2027-09-24': { label: 'แรม 8 ค่ำ เดือน 10', isWanPhra: true },
    '2027-09-30': { label: 'แรม 14 ค่ำ เดือน 10', isWanPhra: true },
    '2027-10-01': { label: 'แรม 15 ค่ำ เดือน 10', isWanPhra: true },
    '2027-10-09': { label: 'ขึ้น 8 ค่ำ เดือน 11', isWanPhra: true },
    '2027-10-17': { label: 'ขึ้น 15 ค่ำ เดือน 11', isWanPhra: true },
    '2027-10-25': { label: 'แรม 8 ค่ำ เดือน 11', isWanPhra: true },
    '2027-10-31': { label: 'แรม 14 ค่ำ เดือน 11', isWanPhra: true },
    '2027-11-01': { label: 'แรม 15 ค่ำ เดือน 11', isWanPhra: true },
    '2027-11-09': { label: 'ขึ้น 8 ค่ำ เดือน 12', isWanPhra: true },
    '2027-11-17': { label: 'ขึ้น 15 ค่ำ เดือน 12', isWanPhra: true },
    '2027-11-25': { label: 'แรม 8 ค่ำ เดือน 12', isWanPhra: true },
    '2027-12-01': { label: 'แรม 14 ค่ำ เดือน 12', isWanPhra: true },
    '2027-12-02': { label: 'แรม 15 ค่ำ เดือน 12', isWanPhra: true },
    '2027-12-10': { label: 'ขึ้น 8 ค่ำ เดือน 1', isWanPhra: true },
    '2027-12-18': { label: 'ขึ้น 15 ค่ำ เดือน 1', isWanPhra: true },
    '2027-12-26': { label: 'แรม 8 ค่ำ เดือน 1', isWanPhra: true },
    '2027-12-31': { label: 'แรม 13 ค่ำ เดือน 1', isWanPhra: true },
  };

  const info: { isWanPhra: boolean; label?: string; holidayName?: string } = {
    isWanPhra: false,
    label: undefined,
    holidayName: undefined
  };

  if (fixedHolidays[md]) {
    info.holidayName = fixedHolidays[md];
  }

  if (dynamicDays[dateStr]) {
    const dyn = dynamicDays[dateStr];
    if (dyn.isWanPhra) {
      info.isWanPhra = true;
      info.label = dyn.label;
    }
    if (dyn.title) {
      info.holidayName = dyn.title;
    }
  }

  return info;
};

export default function ScheduleManagement() {
  const { permissions } = usePermission();
  const [viewMode, setViewMode] = React.useState<'calendar' | 'list'>('calendar');
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = React.useState<string>(formatDateStr(new Date()));

  const {
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
  } = useScheduleController();

  const [salas, setSalas] = React.useState<Sala[]>([]);
  const [bookings, setBookings] = React.useState<SalaBooking[]>([]);

  React.useEffect(() => {
    const loadSalasAndBookings = async () => {
      try {
        const [salasList, bookingsList] = await Promise.all([
          db.salas.list(),
          db.salaBookings.list()
        ]);
        setSalas(salasList);
        setBookings(bookingsList);
      } catch (err) {
        console.error('Failed to load salas/bookings for schedule:', err);
      }
    };
    loadSalasAndBookings();
  }, []);

  // Calendar parameters
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleGoToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(formatDateStr(today));
  };

  // Generate 42 days grid cells for the monthly calendar
  const calendarCells = React.useMemo(() => {
    const date = new Date(year, month, 1);
    const startDay = date.getDay(); // 0 = Sunday, 6 = Saturday
    const numDays = new Date(year, month + 1, 0).getDate();
    
    const cells = [];
    const prevMonthDays = new Date(year, month, 0).getDate();
    
    // Previous month filler days
    for (let i = startDay - 1; i >= 0; i--) {
      cells.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false
      });
    }
    
    // Current month days
    for (let i = 1; i <= numDays; i++) {
      cells.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Next month filler days (to fill exactly 6 rows)
    const nextPadding = 42 - cells.length;
    for (let i = 1; i <= nextPadding; i++) {
      cells.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return cells;
  }, [year, month]);

  const isTodayDate = (date: Date) => {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
  };

  const getEventsForDate = (dateStr: string) => {
    return filteredEvents.filter(event => event.date === dateStr);
  };

  const getBookingsForDate = (dateStr: string) => {
    return bookings.filter(b => dateStr >= b.start_date && dateStr <= b.end_date);
  };

  const handleOpenAddModalWithDate = (dateStr: string) => {
    setCurrentEvent({
      id: `e-${Date.now()}`,
      title: '',
      date: dateStr,
      time: '09:00',
      location: '',
      host_name: '',
      monks_needed: 9,
      assigned_monks: [],
      status: 'upcoming'
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* CSS Animations for Blinking Grid cells */}
      <style>{`
        @keyframes cell-today-pulse {
          0%, 100% {
            box-shadow: inset 0 0 0 2px rgba(245, 158, 11, 0.85), 0 0 12px rgba(245, 158, 11, 0.45);
            border-color: rgb(245, 158, 11);
          }
          50% {
            box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.25), 0 0 2px rgba(245, 158, 11, 0.1);
            border-color: rgba(245, 158, 11, 0.25);
          }
        }
        @keyframes cell-event-blink {
          0%, 100% {
            border-color: rgba(245, 158, 11, 0.4);
            box-shadow: inset 0 0 10px rgba(245, 158, 11, 0.08);
          }
          50% {
            border-color: rgba(245, 158, 11, 0.15);
            box-shadow: inset 0 0 2px rgba(245, 158, 11, 0.01);
          }
        }
        .animate-today-glow {
          animation: cell-today-pulse 2s infinite ease-in-out;
        }
        .animate-event-glow {
          animation: cell-event-blink 2.2s infinite ease-in-out;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(245, 158, 11, 0.2);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(245, 158, 11, 0.45);
        }
      `}</style>

      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading text-amber-900 dark:text-amber-200">
            ระบบตารางงานนิมนต์และศาสนพิธี
          </h2>
          <p className="text-xs text-amber-700/50 dark:text-amber-400/50">
            จัดเตรียมวันทำบุญงานเลี้ยงพระนอกวัด งานฌาปนกิจ ตลอดจนตารางเวรดูแลงานพิธีของพระคุณเจ้า
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* View Toggle Buttons */}
          <div className="flex bg-amber-100/40 dark:bg-amber-950/20 p-1 rounded-xl border border-amber-200/30 dark:border-amber-950/25 shrink-0">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all border-none ${
                viewMode === 'calendar'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-transparent text-amber-800/60 dark:text-amber-400/50 hover:text-amber-900 dark:hover:text-amber-200'
              }`}
            >
              ปฏิทินงาน
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all border-none ${
                viewMode === 'list'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-transparent text-amber-800/60 dark:text-amber-400/50 hover:text-amber-900 dark:hover:text-amber-200'
              }`}
            >
              รายการสรุป
            </button>
          </div>

          {permissions.canCreate && (
            <Button
              onClick={handleOpenAddModal}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-5 px-5 rounded-xl flex items-center gap-1.5 border-none shadow-md shadow-amber-500/10 cursor-pointer ml-auto md:ml-0"
            >
              <Plus className="size-4" />
              จัดงานนิมนต์ใหม่
            </Button>
          )}
        </div>
      </div>

      {/* Center Alert Notification Modal */}
      {alertState && alertState.show && (
        <CustomDialog
          show={alertState.show}
          type="alert"
          variant={alertState.variant}
          title={alertState.title}
          description={alertState.description}
          onConfirm={() => {}}
        />
      )}

      {/* Center Confirm Deletion Modal */}
      {confirmState && confirmState.show && (
        <CustomDialog
          show={confirmState.show}
          type="confirm"
          variant="destructive"
          title={confirmState.title}
          description={confirmState.description}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
          confirmText="ยืนยันการลบ"
          cancelText="ยกเลิก"
        />
      )}

      {/* Filters control */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-[#15110a] p-4 rounded-xl border border-amber-200/40 dark:border-amber-950/30">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-700/40 dark:text-amber-500/30">
            <Search className="size-4" />
          </div>
          <input
            type="text"
            placeholder="ค้นหาชื่องาน, สถานที่, เจ้าภาพ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-amber-200/60 dark:border-amber-950 bg-amber-50/10 dark:bg-[#1a150e] text-amber-950 dark:text-amber-100 placeholder-amber-700/30 dark:placeholder-amber-500/20 text-xs outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-amber-800/70 dark:text-amber-400/70 shrink-0">สถานะงานพิธี:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 rounded-lg border border-amber-200/60 dark:border-amber-950 bg-amber-50/10 dark:bg-[#1a150e] text-amber-950 dark:text-amber-100 text-xs outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
          >
            <option value="all">งานทั้งหมด</option>
            <option value="upcoming">เร็ว ๆ นี้ (ยังไม่จัด)</option>
            <option value="completed">เสร็จสิ้นแล้ว</option>
            <option value="cancelled">ยกเลิกแล้ว</option>
          </select>
        </div>
      </div>

      {/* Main Views Layout */}
      {loading ? (
        <div className="p-12 text-center animate-pulse-subtle">
          <Loader2 className="size-8 text-amber-500 animate-spin mx-auto mb-2" />
          <p className="text-xs font-bold text-amber-700/65">กำลังโหลดตารางจัดงานนิมนต์...</p>
        </div>
      ) : viewMode === 'calendar' ? (
        /* Calendar Monthly View Mode */
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 p-6 shadow-md shadow-amber-100/5">
            
            {/* Calendar Navigation */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-extrabold text-amber-950 dark:text-amber-100 font-heading">
                  {THAI_MONTHS[month]} พ.ศ. {year + 543}
                </h3>
                <span className="text-xs text-amber-700/40 dark:text-amber-500/35">
                  (ค.ศ. {year})
                </span>
              </div>
              <div className="flex items-center gap-1 bg-amber-50/50 dark:bg-amber-950/10 p-1 rounded-xl border border-amber-200/20 dark:border-amber-950/30">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 text-xs font-bold text-amber-900 dark:text-amber-300 hover:bg-amber-500/10 rounded-lg cursor-pointer transition-all border-none bg-transparent"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  onClick={handleGoToday}
                  className="px-3 py-1.5 text-xs font-bold text-amber-900 dark:text-amber-300 hover:bg-amber-500/10 rounded-lg cursor-pointer transition-all border-none bg-transparent"
                >
                  วันนี้
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-2 text-xs font-bold text-amber-900 dark:text-amber-300 hover:bg-amber-500/10 rounded-lg cursor-pointer transition-all border-none bg-transparent"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>

            {/* Weekdays Header */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-extrabold text-amber-900/60 dark:text-amber-400/60 border-b border-amber-100 dark:border-amber-950/30 pb-2">
              <div className="text-red-500 dark:text-red-400">อา.</div>
              <div>จ.</div>
              <div>อ.</div>
              <div>พ.</div>
              <div>พฤ.</div>
              <div>ศ.</div>
              <div className="text-sky-500 dark:text-sky-400">ส.</div>
            </div>

            {/* Calendar Cells Grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarCells.map((cell, idx) => {
                const cellDateStr = formatDateStr(cell.date);
                const isToday = isTodayDate(cell.date);
                const dayEvents = getEventsForDate(cellDateStr);
                const dayBookings = getBookingsForDate(cellDateStr);
                const specialInfo = getSpecialDayInfo(cellDateStr);
                const isSelected = selectedDateStr === cellDateStr;

                // Blinking effect: pulse today, or breathing blink if the cell contains events
                const blinkClass = isToday 
                  ? 'animate-today-glow ring-1 ring-amber-500 bg-amber-500/[0.04]' 
                  : (dayEvents.length > 0 || dayBookings.length > 0 ? 'animate-event-glow border-amber-500/40 bg-amber-500/[0.01]' : '');

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDateStr(cellDateStr)}
                    className={`min-h-[90px] sm:min-h-[110px] p-2 rounded-xl border flex flex-col justify-between transition-all relative cursor-pointer group ${
                      cell.isCurrentMonth
                        ? 'bg-amber-50/[0.02] dark:bg-[#1a150e]/10 border-amber-200/35 dark:border-amber-950/20 text-amber-950 dark:text-amber-100 hover:border-amber-500/50'
                        : 'bg-slate-500/[0.02] dark:bg-[#15110a]/5 border-slate-200/10 dark:border-slate-900/5 text-amber-950/25 dark:text-amber-500/20 hover:border-amber-500/20'
                    } ${isSelected ? 'ring-2 ring-amber-500 border-transparent bg-amber-500/5 dark:bg-amber-500/[0.03]' : ''} ${blinkClass}`}
                  >
                    {/* Date and Wan Phra lotus badge */}
                    <div className="flex justify-between items-start">
                      <span className={`text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                        isToday 
                          ? 'bg-amber-500 text-white font-extrabold shadow-sm shadow-amber-500/10' 
                          : 'text-amber-900/80 dark:text-amber-200/80'
                      }`}>
                        {cell.date.getDate()}
                      </span>
                      
                      {specialInfo.isWanPhra && (
                        <span 
                          className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 text-[8px] font-extrabold px-1 rounded flex items-center gap-0.5 shrink-0" 
                          title={`วันพระ: ${specialInfo.label}`}
                        >
                          🌸 วันพระ
                        </span>
                      )}
                    </div>

                    {/* Holiday names */}
                    {specialInfo.holidayName && (
                      <div className="text-[8px] font-bold text-red-500 dark:text-red-400 leading-none truncate max-w-full my-0.5" title={specialInfo.holidayName}>
                        📌 {specialInfo.holidayName}
                      </div>
                    )}

                    {/* Short Badges for Events and Bookings */}
                    <div className="mt-1 flex-1 flex flex-col gap-0.5 overflow-y-auto max-h-[50px] custom-scrollbar">
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          className={`text-[8px] font-extrabold p-0.5 rounded truncate border leading-none ${
                            event.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/15'
                              : event.status === 'cancelled'
                              ? 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/15'
                              : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20'
                          }`}
                          title={`${event.title} (${event.time} น.)`}
                        >
                          {event.time} | {event.title}
                        </div>
                      ))}
                      {dayBookings.map((b) => {
                        const salaObj = salas.find(s => s.id === b.sala_id);
                        return (
                          <div
                            key={b.id}
                            className="text-[8px] font-extrabold p-0.5 rounded truncate border leading-none bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/15"
                            title={`จองศาลา ${salaObj?.short_name || 'ศาลา'}: ${b.event_title}`}
                          >
                            [จอง] {salaObj?.short_name || 'ศาลา'}: {b.event_title}
                          </div>
                        );
                      })}
                    </div>

                    {/* Plus quick add button */}
                    {permissions.canCreate && cell.isCurrentMonth && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenAddModalWithDate(cellDateStr); }}
                        className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded bg-amber-500 hover:bg-amber-600 text-white cursor-pointer border-none"
                        title="จัดงานนิมนต์วันนี้"
                      >
                        <Plus className="size-2.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Date Details Panel */}
          <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 p-6 shadow-md shadow-amber-100/5 mt-4">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-amber-100/50 dark:border-amber-950/40">
              <h3 className="font-extrabold text-sm text-amber-900 dark:text-amber-200 flex items-center gap-2 font-heading">
                <CalendarIcon className="size-4 text-amber-600" />
                รายละเอียดประจำวัน: {(() => {
                  const d = new Date(selectedDateStr);
                  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} พ.ศ. ${d.getFullYear() + 543}`;
                })()}
              </h3>
              {permissions.canCreate && (
                <Button
                  onClick={() => handleOpenAddModalWithDate(selectedDateStr)}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] py-2 px-3 rounded-lg border-none flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="size-3" />
                  จัดงานนิมนต์วันนี้
                </Button>
              )}
            </div>

            {(() => {
              const dayEvents = getEventsForDate(selectedDateStr);
              const dayBookings = getBookingsForDate(selectedDateStr);
              const specialInfo = getSpecialDayInfo(selectedDateStr);
              
              return (
                <div className="space-y-3">
                  {/* Holidays or Wan Phra if any */}
                  {(specialInfo.isWanPhra || specialInfo.holidayName) && (
                    <div className="bg-amber-500/5 border border-amber-500/20 p-3.5 rounded-xl flex flex-col gap-1 text-xs">
                      {specialInfo.holidayName && (
                        <div className="text-red-600 dark:text-red-400 font-extrabold flex items-center gap-1">
                          📌 วันสำคัญของไทย: {specialInfo.holidayName}
                        </div>
                      )}
                      {specialInfo.isWanPhra && (
                        <div className="text-yellow-700 dark:text-yellow-400 font-extrabold flex items-center gap-1">
                          🌸 วันธรรมสวนะ (วันพระ): {specialInfo.label}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Events listed */}
                  {dayEvents.length === 0 && dayBookings.length === 0 ? (
                    <p className="text-xs text-amber-800/40 dark:text-amber-500/40 italic py-2">ไม่มีงานนิมนต์หรือตารางกิจกรรมในวันนี้</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dayEvents.map((event) => {
                        const assignedMonksDetails = monks.filter(m => event.assigned_monks.includes(m.id));
                        return (
                          <div key={event.id} className="border border-amber-200/40 dark:border-amber-950/30 p-4 rounded-xl space-y-3 bg-amber-50/10">
                            <div className="flex justify-between items-start">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                event.status === 'upcoming'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                  : event.status === 'completed'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-red-500/10 text-red-600 dark:text-red-400'
                              }`}>
                                {event.status === 'upcoming' ? 'เร็ว ๆ นี้' : event.status === 'completed' ? 'เสร็จสิ้น' : 'ยกเลิก'}
                              </span>
                              <span className="text-[10px] font-bold text-amber-700/50 dark:text-amber-400/40 flex items-center gap-1">
                                <Clock className="size-3.5" /> {event.time} น.
                              </span>
                            </div>

                            <h4 className="font-extrabold text-xs text-amber-950 dark:text-amber-100">{event.title}</h4>
                            
                            <div className="text-[11px] text-amber-800/80 dark:text-amber-400 space-y-1.5">
                              <div><strong>สถานที่:</strong> {event.location}</div>
                              <div><strong>เจ้าภาพ:</strong> {event.host_name}</div>
                            </div>

                            {/* Assigned Monks list */}
                            <div className="pt-2 border-t border-amber-100/50 dark:border-amber-950/20 text-[10px]">
                              <span className="font-bold text-amber-900 dark:text-amber-300 block mb-1">พระที่เข้าร่วม ({assignedMonksDetails.length} รูป):</span>
                              {assignedMonksDetails.length === 0 ? (
                                <span className="text-red-500 italic">ยังไม่ได้จัดสรรพระภิกษุ</span>
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {assignedMonksDetails.map(m => (
                                    <span key={m.id} className="bg-amber-500/10 text-amber-900 dark:text-amber-300 px-1.5 py-0.5 rounded font-semibold">
                                      {m.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Quick edit actions */}
                            {(permissions.canEdit || permissions.canDelete) && (
                              <div className="flex gap-2 pt-2 border-t border-amber-100/40 dark:border-amber-950/10">
                                {permissions.canEdit && (
                                  <button
                                    onClick={() => handleOpenEditModal(event)}
                                    className="text-[10px] font-bold text-amber-600 hover:text-amber-700 cursor-pointer border-none bg-transparent"
                                  >
                                    แก้ไขข้อมูล
                                  </button>
                                )}
                                {permissions.canDelete && (
                                  <button
                                    onClick={() => handleDeleteEvent(event.id)}
                                    className="text-[10px] font-bold text-red-600 hover:text-red-700 cursor-pointer ml-auto border-none bg-transparent"
                                  >
                                    ลบงาน
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {dayBookings.map((b) => {
                        const salaObj = salas.find(s => s.id === b.sala_id);
                        return (
                          <div key={b.id} className="border border-blue-200/40 dark:border-blue-950/30 p-4 rounded-xl space-y-3 bg-blue-50/10 dark:bg-blue-950/5">
                            <div className="flex justify-between items-start">
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                การจองศาลา ({salaObj?.short_name || 'ศาลา'})
                              </span>
                              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-450">
                                {b.status === 'confirmed' ? 'ยืนยันแล้ว' : b.status === 'completed' ? 'เสร็จสิ้น' : b.status === 'pending' ? 'รอยืนยัน' : 'ยกเลิก'}
                              </span>
                            </div>
                            <h4 className="font-extrabold text-xs text-blue-950 dark:text-blue-100">{b.event_title}</h4>
                            <div className="text-[11px] text-blue-800/80 dark:text-blue-400 space-y-1.5">
                              <div><strong>ช่วงเวลา:</strong> {b.start_date} ถึง {b.end_date} (รวม {b.num_days} วัน)</div>
                              <div><strong>ผู้ติดต่อ:</strong> {b.booker_name} {b.booker_phone && `(${b.booker_phone})`}</div>
                              {b.notes && <div><strong>หมายเหตุ:</strong> <span className="italic">{b.notes}</span></div>}
                            </div>
                            <div className="text-[9px] text-blue-700/60 dark:text-blue-400/50 pt-1.5 border-t border-blue-100/50 dark:border-blue-950/20 italic">
                              * จัดการการจองนี้ได้ที่เมนู "ระบบจองศาลา"
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      ) : (
        /* List / Table Grid View Mode */
        filteredEvents.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-amber-200/25 rounded-xl bg-white dark:bg-[#15110a] animate-fade-in">
            <CalendarIcon className="size-12 mx-auto text-amber-200 dark:text-amber-900/35 mb-2.5" />
            <p className="text-sm text-amber-800/50 dark:text-amber-500/40">ไม่พบตารางงานนิมนต์ที่ระบุ</p>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {filteredEvents.map((event) => {
              const assignedMonksDetails = monks.filter(m => event.assigned_monks.includes(m.id));

              return (
                <div
                  key={event.id}
                  className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 p-6 shadow-md shadow-amber-100/5 flex flex-col lg:flex-row justify-between gap-6 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
                >
                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          event.status === 'upcoming'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : event.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400'
                        }`}>
                          {event.status === 'upcoming' ? 'เร็ว ๆ นี้' : event.status === 'completed' ? 'เสร็จสิ้นแล้ว' : 'ยกเลิก'}
                        </span>
                        <span className="text-xs font-semibold text-amber-800/50 dark:text-amber-400/40 flex items-center gap-1">
                          <CalendarIcon className="size-3.5" /> {event.date}
                        </span>
                        <span className="text-xs font-semibold text-amber-800/50 dark:text-amber-400/40 flex items-center gap-1">
                          <Clock className="size-3.5" /> เวลา: {event.time} น.
                        </span>
                      </div>

                      <h3 className="font-extrabold text-base text-amber-950 dark:text-amber-100 font-heading">
                        {event.title}
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-amber-800/80 dark:text-amber-400">
                      <div className="flex items-start gap-2">
                        <MapPin className="size-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block font-semibold text-amber-950 dark:text-amber-200">สถานที่:</strong>
                          <span>{event.location}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <User className="size-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block font-semibold text-amber-950 dark:text-amber-200">เจ้าภาพ / โยมต้อนรับ:</strong>
                          <span>{event.host_name}</span>
                        </div>
                      </div>
                    </div>

                    {/* Assigned Monks List */}
                    <div className="pt-3 border-t border-amber-100/50 dark:border-amber-950/40">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Users className="size-4 text-amber-600 dark:text-amber-500" />
                        <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                          รายนามพระภิกษุที่เข้าร่วมงาน ({assignedMonksDetails.length} / {event.monks_needed} รูป)
                        </span>
                      </div>
                      {assignedMonksDetails.length === 0 ? (
                        <p className="text-[10px] text-red-500 font-semibold italic">ยังไม่ได้จัดสรร/มอบหมายพระภิกษุเข้าร่วมงาน</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {assignedMonksDetails.map((monk) => (
                            <span
                              key={monk.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-900 dark:text-amber-300 text-[10px] font-bold border border-amber-500/20"
                            >
                              {monk.name} ({monk.chaya})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Operations column */}
                  {(permissions.canEdit || permissions.canDelete) && (
                    <div className="flex lg:flex-col justify-end gap-2.5 shrink-0 self-end lg:self-center">
                      {permissions.canEdit && (
                        <Button
                          variant="outline"
                          onClick={() => handleOpenEditModal(event)}
                          className="flex items-center justify-center gap-1 py-2.5 px-4 border-amber-200 hover:bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs font-bold cursor-pointer"
                        >
                          <Edit className="size-3.5" />
                          แก้ไขข้อมูล
                        </Button>
                      )}
                      {permissions.canDelete && (
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteEvent(event.id)}
                          className="flex items-center justify-center gap-1 py-2.5 px-4 text-xs font-bold cursor-pointer"
                        >
                          <Trash className="size-3.5" />
                          ลบตารางงาน
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Add / Edit Event Form Modal */}
      {isModalOpen && currentEvent && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/50 dark:border-amber-950/40 shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-up">
            <div className="h-1.5 bg-gradient-to-r from-amber-400 to-amber-600" />
            <div className="p-6 border-b border-amber-100 dark:border-amber-950 flex justify-between items-center bg-amber-50/20 dark:bg-amber-950/5">
              <h3 className="font-bold text-base text-amber-900 dark:text-amber-200 font-heading">
                {currentEvent.title ? 'แก้ไขข้อมูลงานนิมนต์' : 'บันทึกจัดตารางงานนิมนต์ศาสนพิธีใหม่'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-amber-800 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer border-none bg-transparent"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Event Title */}
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ชื่องานนิมนต์ / พิธีกรรม</label>
                  <input
                    type="text"
                    required
                    value={currentEvent.title || ''}
                    onChange={(e) => updateFormFields('title', e.target.value)}
                    placeholder="เช่น งานนิมนต์สวดเจริญพระพุทธมนต์ ขึ้นบ้านใหม่โยมสมคิด"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {/* Host Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ชื่อเจ้าภาพ</label>
                  <input
                    type="text"
                    required
                    value={currentEvent.host_name || ''}
                    onChange={(e) => updateFormFields('host_name', e.target.value)}
                    placeholder="เช่น โยมพิมพา รุ่งเรือง"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">วันที่จัดพิธี</label>
                  <input
                    type="date"
                    required
                    value={currentEvent.date || ''}
                    onChange={(e) => updateFormFields('date', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {/* Time */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">เวลา (น.)</label>
                  <input
                    type="text"
                    required
                    value={currentEvent.time || ''}
                    onChange={(e) => updateFormFields('time', e.target.value)}
                    placeholder="เช่น 09:30"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {/* Monks Needed qty */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">จำนวนพระภิกษุที่นิมนต์ (รูป)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={currentEvent.monks_needed || ''}
                    onChange={(e) => updateFormFields('monks_needed', Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {/* Location */}
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">สถานที่ประกอบพิธี</label>
                  <input
                    type="text"
                    required
                    value={currentEvent.location || ''}
                    onChange={(e) => updateFormFields('location', e.target.value)}
                    placeholder="เช่น บ้านเลขที่ 123 ต.ในเมือง อ.เมือง"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {/* Status selection */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">สถานะโครงการงาน</label>
                  <select
                    value={currentEvent.status || 'upcoming'}
                    onChange={(e) => updateFormFields('status', e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                  >
                    <option value="upcoming">เร็ว ๆ นี้</option>
                    <option value="completed">เสร็จสิ้นการนิมนต์</option>
                    <option value="cancelled">ยกเลิกแล้ว</option>
                  </select>
                </div>

                {/* Assign Monks List checkboxes */}
                <div className="md:col-span-2 pt-2 space-y-2">
                  <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">
                    มอบหมายพระภิกษุเข้าร่วมงานนิมนต์ (เลือกจากพระจำพรรษา):
                  </label>
                  <div className="grid grid-cols-2 gap-2 border border-amber-100 dark:border-amber-950 p-4 rounded-xl max-h-40 overflow-y-auto bg-amber-50/10">
                    {monks.map((monk) => {
                      const isAssigned = (currentEvent.assigned_monks || []).includes(monk.id);
                      return (
                        <label
                          key={monk.id}
                          className="flex items-center gap-2 p-2 hover:bg-amber-500/10 rounded-lg cursor-pointer text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={isAssigned}
                            onChange={() => handleToggleMonkSelection(monk.id)}
                            className="accent-amber-500 size-3.5"
                          />
                          <span className="text-amber-900 dark:text-amber-200 font-semibold">{monk.name} ({monk.chaya})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Modal footer controls */}
              <div className="flex gap-3 justify-end pt-4 border-t border-amber-100 dark:border-amber-950 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 text-xs font-bold border-amber-200 hover:bg-amber-500/10 text-amber-800 dark:text-amber-400 cursor-pointer"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2.5 px-5 rounded-lg flex items-center gap-1 border-none shadow-md shadow-amber-500/10 cursor-pointer"
                >
                  {isSaving && <Loader2 className="size-3.5 animate-spin" />}
                  บันทึกข้อมูล
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
