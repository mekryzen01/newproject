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
  Info,
  MessageSquare,
  Receipt,
  Send,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomDialog } from '@/components/ui/custom-dialog';
import { db, Sala, SalaBooking, TempleEvent, FuneralArrangement, Quotation, CostItem } from '@/lib/db';
import { formatThaiDate } from '@/lib/utils';
import { usePermission } from '@/lib/usePermission';
import { ThaiDatePicker } from '@/components/ui/thai-date-picker';
import { checkWanKaoKong } from '@/lib/lanna-calendar';

export default function SalaManagement() {
  const { permissions, role } = usePermission();
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
  
  // Modal states for Funeral arrangements (รายละเอียดจัดตั้งศพ)
  const [isFuneralModalOpen, setIsFuneralModalOpen] = useState(false);
  const [currentFuneral, setCurrentFuneral] = useState<Partial<FuneralArrangement>>({});
  const [selectedBookingForFuneral, setSelectedBookingForFuneral] = useState<SalaBooking | null>(null);
  const [funeralArrangements, setFuneralArrangements] = useState<FuneralArrangement[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [isSavingFuneral, setIsSavingFuneral] = useState(false);
  const [isUploadingCertificate, setIsUploadingCertificate] = useState(false);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

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

  const [costItems, setCostItems] = useState<CostItem[]>([]);

  // Load all data
  const loadData = async () => {
    setLoading(true);
    try {
      const [salasList, bookingsList, eventsList, funeralList, costList] = await Promise.all([
        db.salas.list(),
        db.salaBookings.list(),
        db.events.list(),
        db.funeralArrangements.list(),
        db.costItems.list()
      ]);
      setSalas(salasList);
      setBookings(bookingsList);
      setTempleEvents(eventsList);
      setFuneralArrangements(funeralList);
      setCostItems(costList.filter(c => c.is_active));
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

  // Integrated Funeral & Quotation Form states
  const [bookingModalStep, setBookingModalStep] = useState<1 | 2 | 3>(1);
  const [quoteType, setQuoteType] = useState<'package' | 'custom'>('package');
  const [deceasedName, setDeceasedName] = useState('');
  const [deceasedAge, setDeceasedAge] = useState('');

  const validateStep1 = () => {
    if (!currentBooking.sala_id) {
      showAlert('ข้อมูลไม่ครบถ้วน', 'กรุณาเลือกศาลาที่ต้องการจอง *', 'warning');
      return false;
    }
    if (!currentBooking.event_title?.trim()) {
      showAlert('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกชื่องาน / กิจกรรม (หัวข้อการจอง) *', 'warning');
      return false;
    }
    if (!currentBooking.booker_name?.trim()) {
      showAlert('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกชื่อผู้ติดต่อ / เจ้าภาพ *', 'warning');
      return false;
    }
    if (!currentBooking.booker_phone?.trim()) {
      showAlert('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกเบอร์โทรติดต่อ *', 'warning');
      return false;
    }
    if (!currentBooking.start_date || !currentBooking.end_date) {
      showAlert('ข้อมูลไม่ครบถ้วน', 'กรุณาระบุวันที่เริ่มและวันที่สิ้นสุดการจอง *', 'warning');
      return false;
    }

    const start = new Date(currentBooking.start_date);
    const end = new Date(currentBooking.end_date);
    if (end < start) {
      showAlert('วันที่ไม่ถูกต้อง', 'วันสิ้นสุดการจองต้องไม่อยู่ก่อนหน้าวันเริ่มต้น', 'warning');
      return false;
    }

    // 1. Check Wan Kao Kong validation for funerals/cremations (ตามจารีตประเพณีล้านนา)
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
        return false;
      }
    }

    // 2. Check for double booking conflicts on the same sala_id
    if (currentBooking.status !== 'cancelled') {
      const conflict = bookings.find(b => {
        if (b.sala_id !== currentBooking.sala_id || b.id === currentBooking.id || b.status === 'cancelled') {
          return false;
        }

        const newStart = currentBooking.start_date!;
        const newEnd = currentBooking.end_date!;
        const bStart = b.start_date;
        const bEnd = b.end_date;

        // If both are exact single-day bookings on the exact same date (e.g. both 24-24)
        if (newStart === newEnd && bStart === bEnd && newStart === bStart) {
          return true;
        }

        // Allow turnover on same day (e.g., Previous booking ends on 24 July [ฌาปนกิจ/เผาบ่าย] 
        // and New booking starts on 24 July [ตั้งศพ/สวดคืนแรกเย็น]).
        // Overlap only occurs when newStart < bEnd AND newEnd > bStart
        return newStart < bEnd && newEnd > bStart;
      });

      if (conflict) {
        const salaObj = salas.find(s => s.id === currentBooking.sala_id);
        const salaName = salaObj ? salaObj.short_name : 'ศาลา';
        showAlert(
          'ตรวจพบการจองซ้ำซ้อน', 
          `ไม่สามารถจองได้เนื่องจาก ${salaName} มีการจองงาน "${conflict.event_title}" อยู่แล้วในช่วงเวลาดังกล่าว (${formatThaiDate(conflict.start_date)} ถึง ${formatThaiDate(conflict.end_date)})`, 
          'warning'
        );
        return false;
      }
    }

    return true;
  };

  const validateStep2 = () => {
    if (!deceasedName?.trim()) {
      showAlert('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกชื่อผู้วายชนม์ *', 'warning');
      return false;
    }
    if (!deceasedAge?.trim()) {
      showAlert('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกอายุผู้วายชนม์ (ปี) *', 'warning');
      return false;
    }
    if (!scheduleChantTime?.trim()) {
      showAlert('ข้อมูลไม่ครบถ้วน', 'กรุณาระบุเวลาสวดอภิธรรม *', 'warning');
      return false;
    }
    if (!scheduleCremationMonksCount?.trim()) {
      showAlert('ข้อมูลไม่ครบถ้วน', 'กรุณาระบุจำนวนพระสงฆ์วันเผา *', 'warning');
      return false;
    }
    if (!scheduleMatikaTime?.trim()) {
      showAlert('ข้อมูลไม่ครบถ้วน', 'กรุณาระบุเวลามาติกา หน้าไฟ *', 'warning');
      return false;
    }
    return true;
  };
  
  const [quoteItems, setQuoteItems] = useState<{ id: string; name: string; amount: number | string; statusText?: string; isChecked: boolean }[]>([
    { id: 'item-1', name: 'บูชาผ้าบังสุกุล กัณฑ์เทศน์', amount: 0, statusText: '', isChecked: true },
    { id: 'item-2', name: 'สวยดอก', amount: 0, statusText: '', isChecked: true },
    { id: 'item-3', name: 'ภัตตาหารเพล', amount: 0, statusText: '', isChecked: true },
    { id: 'item-4', name: 'ชุดเก็บอัฐิ', amount: 0, statusText: '', isChecked: true },
    { id: 'item-5', name: 'น้ำปานะ', amount: 0, statusText: '', isChecked: true },
    { id: 'item-6', name: 'ดอกไม้ประโลง', amount: 0, statusText: '', isChecked: true },
    { id: 'item-7', name: 'เฮือนตาน เลขที่', amount: 0, statusText: '', isChecked: true }
  ]);

  const [scheduleChantTime, setScheduleChantTime] = useState('19.00 น.');
  const [scheduleCremationMonksCount, setScheduleCremationMonksCount] = useState('8');
  const [scheduleMatikaTime, setScheduleMatikaTime] = useState('12.20 น.');
  
  // LINE Preview Modal state
  const [isLinePreviewOpen, setIsLinePreviewOpen] = useState(false);
  const [previewLineMessage, setPreviewLineMessage] = useState('');

  // Helper: Format Thai Date Range Short (e.g. 24-27 ก.ค. 69)
  const formatShortThaiDateRange = (startStr?: string, endStr?: string) => {
    if (!startStr) return '';
    const MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const s = new Date(startStr);
    const sDay = s.getDate();
    const sMonth = MONTHS[s.getMonth()];
    const sYear = (s.getFullYear() + 543).toString().slice(-2);

    if (!endStr || startStr === endStr) {
      return `${sDay} ${sMonth} ${sYear}`;
    }

    const e = new Date(endStr);
    const eDay = e.getDate();
    const eMonth = MONTHS[e.getMonth()];
    const eYear = (e.getFullYear() + 543).toString().slice(-2);

    if (sMonth === eMonth && sYear === eYear) {
      return `${sDay}-${eDay} ${sMonth} ${sYear}`;
    }

    return `${sDay} ${sMonth} - ${eDay} ${eMonth} ${eYear}`;
  };

  // Helper: Build exact LINE Summary text
  const buildLineSummaryText = (booking: Partial<SalaBooking>) => {
    const salaObj = salas.find(s => s.id === booking.sala_id);
    const salaName = salaObj ? salaObj.short_name : (booking.sala_id || 'ศาลา 2');
    const dateRangeStr = formatShortThaiDateRange(booking.start_date, booking.end_date);

    let numDays = 1;
    let numNights = 1;
    if (booking.start_date && booking.end_date) {
      const start = new Date(booking.start_date);
      const end = new Date(booking.end_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      numDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      numNights = Math.max(1, numDays - 1);
    }

    const lines: string[] = [];

    // 1. Sala name
    lines.push(salaName);
    lines.push(' ');

    // 2. Date range
    lines.push(dateRangeStr);
    lines.push(' ');

    // 3. Days & Nights
    lines.push(`${numDays} วัน ${numNights} คืน `);
    lines.push(' ');

    // 4. Deceased info
    const ageText = deceasedAge?.trim() ? `  อายุ ${deceasedAge.trim()} ปี` : '  อายุ  ปี';
    lines.push(`ผู้วายชนม์ ${deceasedName?.trim() || ''}${ageText}`);
    lines.push(' ');

    // 5. Host info
    lines.push(`เจ้าภาพ ${booking.booker_name || ''}`);
    lines.push(`ติดต่อ  ${booking.booker_phone || ''}`);
    lines.push(' ');

    // 6. Quote items / Package
    if (quoteType === 'package') {
      lines.push('แพคเกจ');
    }

    quoteItems.filter(it => it.isChecked).forEach(it => {
      let itemLine = `- ${it.name}`;
      const numAmt = parseFloat(it.amount?.toString() || '0');
      if (numAmt > 0) {
        itemLine += ` ${numAmt}`;
      }
      if (it.statusText?.trim()) {
        itemLine += `  ${it.statusText.trim()}`;
      }
      lines.push(itemLine);
    });

    lines.push(' ');
    lines.push('สวดอภิธรรม ');
    lines.push(`เวลา ${scheduleChantTime || '19.00 น.'} `);
    lines.push(' ');
    lines.push(`เผา  ${scheduleCremationMonksCount || '8'} รูป `);
    lines.push(`มาติกา หน้าไฟ ${scheduleMatikaTime || '12.20 น.'}`);

    return lines.join('\n');
  };

  const handleOpenLineSummary = (booking: SalaBooking) => {
    setCurrentBooking({ ...booking });
    const msg = buildLineSummaryText(booking);
    setPreviewLineMessage(msg);
    setIsLinePreviewOpen(true);
  };

  const handleCopyLineText = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showAlert('คัดลอกข้อความแล้ว', 'คัดลอกรูปแบบข้อความ LINE ลง Clipboard เรียบร้อยแล้ว', 'success');
    }
  };

  const handleShareToLineApp = (text: string) => {
    const url = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleSendLineNotifyDirect = async (text: string) => {
    try {
      const res = await fetch('/api/notifications/line', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'custom_text',
          custom_message: text,
          event: { title: currentBooking.event_title || 'จองศาลา' }
        })
      });
      if (res.ok) {
        showAlert('ส่ง LINE Notify สำเร็จ', 'ระบบส่งข้อความเข้ากลุ่ม LINE วัดเรียบร้อยแล้ว', 'success');
      } else {
        showAlert('เปิดแอป LINE', 'กำลังเปิดแอปพลิเคชัน LINE เพื่อส่งข้อความ...', 'info');
        handleShareToLineApp(text);
      }
    } catch (err: any) {
      console.error(err);
      handleShareToLineApp(text);
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
    setDeceasedName('');
    setDeceasedAge('');
    setQuoteItems([
      { id: 'item-1', name: 'บูชาผ้าบังสุกุล กัณฑ์เทศน์', amount: 0, statusText: '', isChecked: true },
      { id: 'item-2', name: 'สวยดอก', amount: 0, statusText: '', isChecked: true },
      { id: 'item-3', name: 'ภัตตาหารเพล', amount: 0, statusText: '', isChecked: true },
      { id: 'item-4', name: 'ชุดเก็บอัฐิ', amount: 0, statusText: '', isChecked: true },
      { id: 'item-5', name: 'น้ำปานะ', amount: 0, statusText: '', isChecked: true },
      { id: 'item-6', name: 'ดอกไม้ประโลง', amount: 0, statusText: '', isChecked: true },
      { id: 'item-7', name: 'เฮือนตาน เลขที่', amount: 0, statusText: '', isChecked: true }
    ]);
    setBookingModalStep(1);
    setIsBookingModalOpen(true);
  };

  const handleOpenEditBooking = (booking: SalaBooking) => {
    setCurrentBooking({ ...booking });
    setBookingModalStep(1);
    setIsBookingModalOpen(true);
  };

  // Helper: Calculate package prices based on booking duration & selected sala
  const calculatePackagePrice = (booking: Partial<SalaBooking>) => {
    let days = 1;
    let nights = 1;
    if (booking.start_date && booking.end_date) {
      const start = new Date(booking.start_date);
      const end = new Date(booking.end_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
      nights = Math.max(1, days - 1);
    }

    const extraNights = Math.max(0, nights - 1);
    const extraRate = 10000;
    const basePrice = 38500;
    const extraPrice = extraNights * extraRate;

    const selectedSala = salas.find(s => s.id === booking.sala_id);
    const isSala1 = selectedSala?.short_name?.trim() === 'ศาลา 1';
    const sala1Surcharge = isSala1 ? (1000 * days) : 0;

    const totalPackage = basePrice + extraPrice + sala1Surcharge;
    return { days, nights, extraNights, extraRate, basePrice, extraPrice, sala1Surcharge, isSala1, totalPackage };
  };

  // Save Booking CRUD Handler
  const handleSaveBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1() || !validateStep2()) {
      return;
    }

    setIsSaving(true);
    try {
      const bookingId = currentBooking.id || `bk-${Date.now()}`;
      const quotationId = currentBooking.quotation_id || `qt-${Date.now()}`;

      const { days, nights, extraNights, extraRate, basePrice, extraPrice, sala1Surcharge, isSala1, totalPackage } = calculatePackagePrice(currentBooking);

      const bookingToSave: SalaBooking = {
        id: bookingId,
        sala_id: currentBooking.sala_id!,
        event_title: currentBooking.event_title!,
        event_type: currentBooking.event_type as 'funeral' | 'ceremony' | 'wedding' | 'other',
        booker_name: currentBooking.booker_name!,
        booker_phone: currentBooking.booker_phone || '',
        start_date: currentBooking.start_date!,
        end_date: currentBooking.end_date!,
        num_days: days,
        status: currentBooking.status as 'pending' | 'confirmed' | 'completed' | 'cancelled',
        notes: currentBooking.notes || '',
        quotation_id: quotationId,
        created_at: currentBooking.created_at || new Date().toISOString()
      };

      await db.salaBookings.save(bookingToSave);

      // Prepare line items & quotation object matching Quotation Module
      const salaName = salas.find((s) => s.id === bookingToSave.sala_id)?.short_name || 'ศาลา 2';
      let lineItems: any[] = [];
      let finalTotalAmount = 0;

      if (quoteType === 'package') {
        lineItems.push({
          cost_item_id: 'package-base',
          name: `แพ็กเกจเหมาจ่ายเริ่มต้น 1 คืน 2 วัน (รายการบริการและปัจจัยถวายพระครบวงจร)`,
          amount: basePrice,
          quantity: 1,
          subtotal: basePrice
        });

        if (extraNights > 0) {
          lineItems.push({
            cost_item_id: 'package-extra',
            name: `ราคาส่วนเพิ่มสวดอภิธรรม คืนเพิ่มเติม (คืนละ ${extraRate.toLocaleString('th-TH')} บาท x ${extraNights} คืน)`,
            amount: extraRate,
            quantity: extraNights,
            subtotal: extraPrice
          });
        }

        if (isSala1) {
          lineItems.push({
            cost_item_id: 'package-sala-surcharge',
            name: `ค่านิมนต์บำรุงสถานที่ส่วนเพิ่มสำหรับ ${salaName} (วันละ 1,000 บาท x ${days} วัน)`,
            amount: 1000,
            quantity: days,
            subtotal: sala1Surcharge
          });
        }

        // Add included items
        const included = [
          { name: 'ค่าบำรุงศาลา (เหมาจ่าย)', amount: 0, quantity: 1 },
          { name: 'บูชาผ้าบังสุกุล กัณฑ์เทศน์ (เหมาจ่าย)', amount: 0, quantity: 1 },
          { name: 'เจ้าหน้าที่ศาลา (เหมาจ่าย)', amount: 0, quantity: 1 },
          { name: 'แม่บ้านทำความสะอาด (เหมาจ่าย)', amount: 0, quantity: 1 },
          { name: 'บำรุงโลงเย็น (เหมาจ่าย)', amount: 0, quantity: 1 },
          { name: 'ชุดเก็บอัฐิ (เหมาจ่าย)', amount: 0, quantity: 1 },
          { name: 'ภัตตาหารเพล วันเผา (เหมาจ่าย)', amount: 0, quantity: 1 },
          { name: `น้ำดื่ม ตลอดงาน (${nights} คืน + วันเผา)`, amount: 0, quantity: 5 * nights + 10 },
          { name: `สวยดอก กรวยดอกไม้ ข้าวร้อยห่อ ขันตั้งสัปเหร่อ`, amount: 0, quantity: 1 },
          { name: `น้ำปานะถวายพระ (${nights} คืน + วันเผา)`, amount: 0, quantity: 1 },
          { name: 'ซองถวายพระ (สวดมาติกา) 8 รูป (เหมาจ่าย)', amount: 0, quantity: 8 },
          { name: `ซองถวายพระ (สวดอภิธรรม) (คืนละ 6 ซอง x ${nights} คืน)`, amount: 0, quantity: 6 * nights }
        ];

        included.forEach(inc => {
          lineItems.push({
            cost_item_id: 'package-included',
            name: inc.name,
            amount: inc.amount,
            quantity: inc.quantity,
            subtotal: 0
          });
        });

        // Custom extra lines
        const customLines = quoteItems
          .filter(it => it.isChecked)
          .map((it, idx) => ({
            cost_item_id: `custom-${idx}`,
            name: `${it.name}${it.statusText ? ` (${it.statusText})` : ''}`,
            amount: parseFloat(it.amount?.toString() || '0'),
            quantity: 1,
            subtotal: parseFloat(it.amount?.toString() || '0')
          }));

        lineItems = [...lineItems, ...customLines];
        const customSum = customLines.reduce((s, c) => s + c.subtotal, 0);
        finalTotalAmount = totalPackage + customSum;
      } else {
        // Custom / Normal Mode
        lineItems = quoteItems
          .filter(it => it.isChecked)
          .map((it, idx) => ({
            cost_item_id: `ci-${idx}`,
            name: `${it.name}${it.statusText ? ` (${it.statusText})` : ''}`,
            amount: parseFloat(it.amount?.toString() || '0'),
            quantity: 1,
            subtotal: parseFloat(it.amount?.toString() || '0')
          }));

        finalTotalAmount = lineItems.reduce((sum, item) => sum + item.subtotal, 0);
      }

      let quotationNo = `QT-${new Date().getFullYear() + 543}-${Date.now().toString().slice(-4)}`;
      try {
        quotationNo = await db.quotations.getNextNo();
      } catch (errNo) {
        console.error(errNo);
      }

      const quotationObj: Quotation = {
        id: quotationId,
        quotation_no: quotationNo,
        booking_id: bookingId,
        customer_name: currentBooking.booker_name || '',
        customer_phone: currentBooking.booker_phone || '',
        event_type: currentBooking.event_type || 'funeral',
        num_days: days,
        sala_id: currentBooking.sala_id,
        quote_type: quoteType === 'package' ? 'package' : 'normal',
        package_rice_box_option: '50_100',
        package_extra_night_rate: extraRate,
        items: lineItems,
        total_amount: finalTotalAmount,
        status: 'approved',
        notes: `สร้างใบเสนอราคาจากการจองศาลา ${salaName}`,
        created_at: new Date().toISOString()
      };

      await db.quotations.save(quotationObj);

      // Auto-save Funeral Arrangement Record
      const funeralObj: FuneralArrangement = {
        id: `fn-${Date.now()}`,
        booking_id: bookingId,
        deceased_name: deceasedName || currentBooking.event_title || '',
        deceased_age: deceasedAge ? parseInt(deceasedAge) : undefined,
        reporter_name: currentBooking.booker_name || '',
        reporter_phone: currentBooking.booker_phone || '',
        chant_nights: nights,
        cremation_date: currentBooking.end_date,
        cremation_time: scheduleMatikaTime || '12.20 น.',
        undertaker_name: `สวด ${scheduleChantTime || '19.00 น.'} / เผาพระ ${scheduleCremationMonksCount || '8'} รูป`,
        created_at: new Date().toISOString()
      };
      await db.funeralArrangements.save(funeralObj);
      
      // Build and send LINE Notification
      const formattedLineMessage = buildLineSummaryText(bookingToSave);
      fetch('/api/notifications/line', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'custom_text',
          custom_message: formattedLineMessage,
          event: { ...bookingToSave, sala_name: salaName }
        })
      }).catch(err => console.error('Failed to send LINE notification on save booking:', err));

      setIsBookingModalOpen(false);
      showAlert('สำเร็จ', 'บันทึกการจองศาลาและสร้างใบเสนอราคาเรียบร้อยแล้ว 🎉', 'success');
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

  // --- Funeral arrangements handlers ---
  const hasFuneralDetail = (bookingId: string) => {
    return funeralArrangements.some(f => f.booking_id === bookingId && f.deceased_name);
  };

  const handleOpenFuneralDetail = async (booking: SalaBooking) => {
    setSelectedBookingForFuneral(booking);
    try {
      const arr = await db.funeralArrangements.getByBookingId(booking.id);
      if (arr) {
        setCurrentFuneral(arr);
      } else {
        let suggestedName = booking.event_title;
        suggestedName = suggestedName.replace(/งานศพของ|งานศพคุณแม่|งานศพคุณพ่อ|งานศพนาย|งานศพนาง|งานศพ|งานฌาปนกิจศพของ|งานฌาปนกิจศพ/g, '').trim();
        
        setCurrentFuneral({
          id: '',
          booking_id: booking.id,
          deceased_name: suggestedName,
          deceased_age: undefined,
          deceased_photo_url: '',
          death_certificate_no: '',
          death_certificate_url: '',
          receipt_no: '',
          receipt_url: '',
          cremation_date: booking.end_date,
          cremation_time: '13:00',
          coffin_type: '',
          undertaker_name: '',
          undertaker_phone: '',
          monk_representative: '',
          notes: ''
        });
      }
      setIsFuneralModalOpen(true);
    } catch (err: any) {
      showAlert('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถดึงข้อมูลรายละเอียดจัดตั้งศพได้', 'destructive');
    }
  };

  const handleSaveFuneralDetail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFuneral.deceased_name?.trim()) {
      showAlert('ข้อมูลไม่ครบถ้วน', 'กรุณาระบุชื่อผู้วายชนม์', 'warning');
      return;
    }

    setIsSavingFuneral(true);
    try {
      const dataToSave: FuneralArrangement = {
        id: currentFuneral.id || `fn-${Date.now()}`,
        booking_id: currentFuneral.booking_id!,
        deceased_name: currentFuneral.deceased_name,
        deceased_age: currentFuneral.deceased_age ? Number(currentFuneral.deceased_age) : undefined,
        deceased_photo_url: currentFuneral.deceased_photo_url || '',
        death_certificate_no: currentFuneral.death_certificate_no || '',
        death_certificate_url: currentFuneral.death_certificate_url || '',
        receipt_no: currentFuneral.receipt_no || '',
        receipt_url: currentFuneral.receipt_url || '',
        cremation_date: currentFuneral.cremation_date || '',
        cremation_time: currentFuneral.cremation_time || '',
        coffin_type: currentFuneral.coffin_type || '',
        undertaker_name: currentFuneral.undertaker_name || '',
        undertaker_phone: currentFuneral.undertaker_phone || '',
        monk_representative: currentFuneral.monk_representative || '',
        notes: currentFuneral.notes || '',
        created_at: currentFuneral.created_at || new Date().toISOString()
      };

      await db.funeralArrangements.save(dataToSave);
      setIsFuneralModalOpen(false);
      showAlert('สำเร็จ', 'บันทึกข้อมูลจัดตั้งศพเรียบร้อยแล้ว', 'success');
      loadData();
    } catch (err: any) {
      showAlert('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถบันทึกข้อมูลได้', 'destructive');
    } finally {
      setIsSavingFuneral(false);
    }
  };

  const handleUploadCertificate = async (file: File) => {
    setIsUploadingCertificate(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload/drive', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success && data.path) {
        setCurrentFuneral(prev => ({ ...prev, death_certificate_url: data.path }));
        showAlert('สำเร็จ', 'อัปโหลดใบมรณบัตรไปยัง Google Drive เรียบร้อยแล้ว', 'success');
      } else {
        showAlert('ล้มเหลว', data.error || 'เกิดข้อผิดพลาดในการอัปโหลด', 'destructive');
      }
    } catch (err: any) {
      showAlert('เกิดข้อผิดพลาด', err.message || 'เกิดข้อผิดพลาดในการอัปโหลด', 'destructive');
    } finally {
      setIsUploadingCertificate(false);
    }
  };

  const handleUploadReceipt = async (file: File) => {
    setIsUploadingReceipt(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload/drive', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success && data.path) {
        setCurrentFuneral(prev => ({ ...prev, receipt_url: data.path }));
        showAlert('สำเร็จ', 'อัปโหลดใบเสร็จไปยัง Google Drive เรียบร้อยแล้ว', 'success');
      } else {
        showAlert('ล้มเหลว', data.error || 'เกิดข้อผิดพลาดในการอัปโหลด', 'destructive');
      }
    } catch (err: any) {
      showAlert('เกิดข้อผิดพลาด', err.message || 'เกิดข้อผิดพลาดในการอัปโหลด', 'destructive');
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const handleUploadPhoto = async (file: File) => {
    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload/drive', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success && data.path) {
        setCurrentFuneral(prev => ({ ...prev, deceased_photo_url: data.path }));
        showAlert('สำเร็จ', 'อัปโหลดรูปถ่ายผู้วายชนม์ไปยัง Google Drive เรียบร้อยแล้ว', 'success');
      } else {
        showAlert('ล้มเหลว', data.error || 'เกิดข้อผิดพลาดในการอัปโหลด', 'destructive');
      }
    } catch (err: any) {
      showAlert('เกิดข้อผิดพลาด', err.message || 'เกิดข้อผิดพลาดในการอัปโหลด', 'destructive');
    } finally {
      setIsUploadingPhoto(false);
    }
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

  const pkgCalc = calculatePackagePrice(currentBooking);

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
                        <div className="flex justify-end gap-1.5 pt-2 items-center">
                          <button
                            onClick={() => handleOpenLineSummary(bk)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all border bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50"
                            title="ข้อความสรุปส่ง LINE"
                          >
                            <MessageSquare className="size-3 text-emerald-600" />
                            <span>ส่ง LINE</span>
                          </button>
                          {bk.event_type === 'funeral' && (
                            <button
                              onClick={() => handleOpenFuneralDetail(bk)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all border ${
                                role === 'member'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-[#1c1810] dark:text-amber-400 dark:border-amber-900/40'
                                  : hasFuneralDetail(bk.id)
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/50'
                                    : 'bg-red-550/10 text-red-650 border-red-500/20 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50 animate-pulse-subtle'
                              }`}
                            >
                              {role === 'member'
                                ? 'รายละเอียดจัดตั้งศพ'
                                : hasFuneralDetail(bk.id) 
                                  ? 'จัดตั้งศพ (ครบ) ✓' 
                                  : 'จัดตั้งศพ (ไม่ครบ) ⚠️'
                              }
                            </button>
                          )}
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

      {/* --- MODAL: BOOKING CRUD (STEP WIZARD WITH PROGRESS % & REQUIRED VALIDATIONS) --- */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/50 dark:border-amber-950/40 shadow-2xl w-full max-w-2xl overflow-hidden relative">
            {/* Header with Step Wizard & Progress % Bar */}
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 text-white">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-sm font-heading flex items-center gap-2">
                  <CalendarIcon className="size-4" />
                  {currentBooking.id ? 'แก้ไขรายละเอียดการจองศาลา' : 'จองศาลา & ทำใบเสนอราคาใหม่'}
                </h3>
                <button onClick={() => setIsBookingModalOpen(false)} className="text-white hover:text-amber-100 cursor-pointer p-1">
                  <X className="size-4" />
                </button>
              </div>

              {/* Progress % Bar */}
              <div className="space-y-1 mb-3">
                <div className="flex justify-between items-center text-[11px] font-bold text-amber-100">
                  <span>ขั้นตอนที่ {bookingModalStep} จาก 3</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] shadow-2xs">
                    ความคืบหน้า {bookingModalStep === 1 ? '33%' : bookingModalStep === 2 ? '66%' : '100%'}
                  </span>
                </div>
                <div className="w-full bg-black/25 h-2 rounded-full overflow-hidden p-0.5">
                  <div
                    className="bg-white h-full transition-all duration-300 rounded-full shadow-xs"
                    style={{ width: `${bookingModalStep === 1 ? 33 : bookingModalStep === 2 ? 66 : 100}%` }}
                  />
                </div>
              </div>

              {/* Step Navigation Pills */}
              <div className="flex gap-1.5 bg-black/10 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setBookingModalStep(1)}
                  className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 border-none cursor-pointer ${
                    bookingModalStep === 1 ? 'bg-white text-amber-900 shadow-sm' : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <CalendarIcon className="size-3.5" />
                  <span>1. จองศาลา *</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep1()) setBookingModalStep(2);
                  }}
                  className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 border-none cursor-pointer ${
                    bookingModalStep === 2 ? 'bg-white text-amber-900 shadow-sm' : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <Receipt className="size-3.5" />
                  <span>2. ใบเสนอราคา *</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep1() && validateStep2()) setBookingModalStep(3);
                  }}
                  className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 border-none cursor-pointer ${
                    bookingModalStep === 3 ? 'bg-white text-amber-900 shadow-sm' : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <MessageSquare className="size-3.5" />
                  <span>3. สรุป LINE</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveBooking} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* STEP 1: BOOKING BASIC INFO */}
              {bookingModalStep === 1 && (
                <div className="space-y-4">
                  {/* Select Sala */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">
                      เลือกศาลา <span className="text-rose-500 font-extrabold">*</span>
                    </label>
                    <select
                      required
                      value={currentBooking.sala_id || ''}
                      onChange={(e) => setCurrentBooking({ ...currentBooking, sala_id: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                    >
                      {salas.filter(s => s.is_active).map(s => (
                        <option key={s.id} value={s.id}>{s.short_name} ({s.full_name || 'ศาลา'})</option>
                      ))}
                    </select>
                  </div>

                  {/* Event Title */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">
                      ชื่องาน / กิจกรรม (หัวข้อการจอง) <span className="text-rose-500 font-extrabold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={currentBooking.event_title || ''}
                      onChange={(e) => setCurrentBooking({ ...currentBooking, event_title: e.target.value })}
                      placeholder="เช่น งานบำเพ็ญกุศลศพ..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  {/* Event Type & Status */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">
                        ประเภทกิจกรรม <span className="text-rose-500 font-extrabold">*</span>
                      </label>
                      <select
                        value={currentBooking.event_type || 'funeral'}
                        onChange={(e) => setCurrentBooking({ ...currentBooking, event_type: e.target.value as any })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                      >
                        <option value="funeral">งานศพ / บำเพ็ญกุศล (Funeral)</option>
                        <option value="ceremony">งานพิธีการ / สวดมนต์ (Ceremony)</option>
                        <option value="wedding">งานมงคลสมรส (Wedding)</option>
                        <option value="other">อื่นๆ (Other)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">
                        สถานะคำขอ <span className="text-rose-500 font-extrabold">*</span>
                      </label>
                      <select
                        value={currentBooking.status || 'pending'}
                        onChange={(e) => setCurrentBooking({ ...currentBooking, status: e.target.value as any })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                      >
                        <option value="pending">รอยืนยัน (Pending)</option>
                        <option value="confirmed">ยืนยันการจองแล้ว (Confirmed)</option>
                        <option value="completed">เสร็จสิ้นงานพิธี (Completed)</option>
                        <option value="cancelled">ยกเลิกการจอง (Cancelled)</option>
                      </select>
                    </div>
                  </div>

                  {/* Host Booker Details */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">
                        ชื่อผู้ติดต่อ / เจ้าภาพ <span className="text-rose-500 font-extrabold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={currentBooking.booker_name || ''}
                        onChange={(e) => setCurrentBooking({ ...currentBooking, booker_name: e.target.value })}
                        placeholder="ระบุชื่อเจ้าภาพ / ผู้แทน..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">
                        เบอร์โทรติดต่อ <span className="text-rose-500 font-extrabold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={currentBooking.booker_phone || ''}
                        onChange={(e) => setCurrentBooking({ ...currentBooking, booker_phone: e.target.value })}
                        placeholder="ระบุเบอร์โทร..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Date Ranges */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">
                        วันที่เริ่มจอง <span className="text-rose-500 font-extrabold">*</span>
                      </label>
                      <ThaiDatePicker
                        required
                        value={currentBooking.start_date || ''}
                        onChange={(val) => setCurrentBooking({ ...currentBooking, start_date: val })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">
                        วันที่สิ้นสุด <span className="text-rose-500 font-extrabold">*</span>
                      </label>
                      <ThaiDatePicker
                        required
                        value={currentBooking.end_date || ''}
                        onChange={(val) => setCurrentBooking({ ...currentBooking, end_date: val })}
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">หมายเหตุเพิ่มเติม</label>
                    <textarea
                      value={currentBooking.notes || ''}
                      onChange={(e) => setCurrentBooking({ ...currentBooking, notes: e.target.value })}
                      placeholder="หมายเหตุเพิ่มเติมสำหรับการจองศาลา..."
                      rows={2}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: QUOTATION & ITEMS DETAIL */}
              {bookingModalStep === 2 && (
                <div className="space-y-4">
                  {/* Duration Banner */}
                  <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-amber-950 dark:text-amber-100 flex items-center gap-1.5">
                        <Clock className="size-3.5 text-amber-600" />
                        <span>ระยะเวลาจัดงาน: {pkgCalc.days} วัน {pkgCalc.nights} คืน</span>
                        <span className="text-[11px] text-amber-700 dark:text-amber-400 font-normal">
                          ({formatShortThaiDateRange(currentBooking.start_date, currentBooking.end_date)})
                        </span>
                      </div>
                      <div className="text-[10px] text-amber-700/70 dark:text-amber-400/60 mt-0.5">
                        {quoteType === 'package' ? 'คิดคำนวณตามแพคเกจเหมาจ่ายระบบใบเสนอราคา' : 'คิดตามรายการย่อยที่เลือก'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuoteType('package')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border cursor-pointer ${
                          quoteType === 'package' ? 'bg-amber-500 text-white border-amber-500 shadow-xs' : 'bg-white dark:bg-zinc-800 text-amber-900 dark:text-amber-200 border-amber-300'
                        }`}
                      >
                        เหมาเหมา (แพคเกจ)
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuoteType('custom')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border cursor-pointer ${
                          quoteType === 'custom' ? 'bg-amber-500 text-white border-amber-500 shadow-xs' : 'bg-white dark:bg-zinc-800 text-amber-900 dark:text-amber-200 border-amber-300'
                        }`}
                      >
                        จัดเอง / คิดตามรายการ
                      </button>
                    </div>
                  </div>

                  {/* Package Summary Calculation Banner */}
                  {quoteType === 'package' && (
                    <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 space-y-1.5 text-xs text-amber-950 dark:text-amber-100">
                      <div className="font-bold text-emerald-800 dark:text-emerald-300 flex justify-between items-center">
                        <span>📦 รายละเอียดคำนวณราคาแพ็กเกจเหมาจ่าย</span>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                          รวม ฿{pkgCalc.totalPackage.toLocaleString('th-TH')} บาท
                        </span>
                      </div>
                      <div className="text-[11px] space-y-0.5 text-amber-900/80 dark:text-amber-300/80 pl-2 border-l-2 border-emerald-500/30">
                        <div>• แพ็กเกจเหมาจ่ายพื้นฐาน (1 คืน 2 วัน): <span className="font-bold">฿38,500</span></div>
                        {pkgCalc.extraNights > 0 && (
                          <div>• คืนสวดอภิธรรมเพิ่มเติม ({pkgCalc.extraNights} คืน x ฿10,000): <span className="font-bold text-amber-600">+฿{pkgCalc.extraPrice.toLocaleString('th-TH')}</span></div>
                        )}
                        {pkgCalc.isSala1 && (
                          <div>• ค่านิมนต์บำรุงสถานที่ส่วนเพิ่ม (ศาลา 1 x {pkgCalc.days} วัน): <span className="font-bold text-amber-600">+฿{pkgCalc.sala1Surcharge.toLocaleString('th-TH')}</span></div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Deceased Info */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-1">
                      <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">
                        ชื่อผู้วายชนม์ <span className="text-rose-500 font-extrabold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={deceasedName}
                        onChange={(e) => setDeceasedName(e.target.value)}
                        placeholder="กรอกชื่อผู้วายชนม์..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">
                        อายุ (ปี) <span className="text-rose-500 font-extrabold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={deceasedAge}
                        onChange={(e) => setDeceasedAge(e.target.value)}
                        placeholder="ระบุอายุ..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>

                  {/* Service Items Table / List */}
                  <div className="space-y-2 pt-2 border-t border-amber-100 dark:border-amber-950/40">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">
                        รายการสิ่งของ & ศาสนพิธีที่รวมในใบเสนอราคา ({quoteItems.filter(i => i.isChecked).length})
                      </label>

                      <div className="flex gap-1.5">
                        {costItems.length > 0 && (
                          <select
                            onChange={(e) => {
                              if (!e.target.value) return;
                              const selectedCost = costItems.find(c => c.id === e.target.value);
                              if (selectedCost) {
                                setQuoteItems(prev => [
                                  ...prev,
                                  {
                                    id: `item-${Date.now()}`,
                                    name: selectedCost.name,
                                    amount: selectedCost.amount || 0,
                                    statusText: '',
                                    isChecked: true
                                  }
                                ]);
                              }
                              e.target.value = '';
                            }}
                            className="text-[10px] font-bold px-2 py-1 rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-[#110e08] text-amber-900 dark:text-amber-200 outline-none cursor-pointer"
                          >
                            <option value="">+ เพิ่มจากคลังวัด ({costItems.length})</option>
                            {costItems.map(c => (
                              <option key={c.id} value={c.id}>{c.name} ({c.amount} บาท)</option>
                            ))}
                          </select>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setQuoteItems(prev => [
                              ...prev,
                              { id: `item-${Date.now()}`, name: 'รายการใหม่', amount: 0, statusText: '', isChecked: true }
                            ]);
                          }}
                          className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white border-none cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="size-3" />
                          <span>รายการใหม่</span>
                        </button>
                      </div>
                    </div>

                    {/* Interactive Item Rows */}
                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                      {quoteItems.map((item, idx) => (
                        <div
                          key={item.id}
                          className={`p-2 rounded-xl border flex items-center gap-2 transition-colors text-xs ${
                            item.isChecked
                              ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-950/40'
                              : 'bg-gray-50/30 dark:bg-zinc-900/20 border-gray-200/40 dark:border-zinc-800/40 opacity-60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={item.isChecked}
                            onChange={(e) => {
                              const updated = [...quoteItems];
                              updated[idx].isChecked = e.target.checked;
                              setQuoteItems(updated);
                            }}
                            className="rounded text-amber-500 cursor-pointer shrink-0"
                          />
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => {
                              const updated = [...quoteItems];
                              updated[idx].name = e.target.value;
                              setQuoteItems(updated);
                            }}
                            placeholder="ชื่อรายการ..."
                            className="flex-1 px-2 py-1 text-xs rounded-lg border border-amber-200/60 dark:border-amber-950/40 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none"
                          />
                          <input
                            type="text"
                            value={item.amount || ''}
                            onChange={(e) => {
                              const updated = [...quoteItems];
                              updated[idx].amount = e.target.value;
                              setQuoteItems(updated);
                            }}
                            placeholder="ราคา"
                            className="w-20 px-2 py-1 text-xs rounded-lg border border-amber-200/60 dark:border-amber-950/40 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none text-right"
                          />
                          <input
                            type="text"
                            value={item.statusText || ''}
                            onChange={(e) => {
                              const updated = [...quoteItems];
                              updated[idx].statusText = e.target.value;
                              setQuoteItems(updated);
                            }}
                            placeholder="สถานะ/หมายเหตุ"
                            className="w-24 px-2 py-1 text-xs rounded-lg border border-amber-200/60 dark:border-amber-950/40 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setQuoteItems(prev => prev.filter(i => i.id !== item.id));
                            }}
                            className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                            title="ลบรายการ"
                          >
                            <Trash className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ceremony Schedule Details */}
                  <div className="space-y-2 pt-2 border-t border-amber-100 dark:border-amber-950/40">
                    <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">กำหนดการเวลาศาสนพิธี</label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-amber-700 dark:text-amber-400">
                          สวดอภิธรรม เวลา <span className="text-rose-500 font-extrabold">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={scheduleChantTime}
                          onChange={(e) => setScheduleChantTime(e.target.value)}
                          placeholder="19.00 น."
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-amber-700 dark:text-amber-400">
                          เผา (พระสงฆ์ รูป) <span className="text-rose-500 font-extrabold">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={scheduleCremationMonksCount}
                          onChange={(e) => setScheduleCremationMonksCount(e.target.value)}
                          placeholder="8"
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-amber-700 dark:text-amber-400">
                          มาติกา หน้าไฟ เวลา <span className="text-rose-500 font-extrabold">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={scheduleMatikaTime}
                          onChange={(e) => setScheduleMatikaTime(e.target.value)}
                          placeholder="12.20 น."
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: LINE PREVIEW & ACTIONS */}
              {bookingModalStep === 3 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      <MessageSquare className="size-4 text-emerald-600" />
                      พรีวิวข้อความที่จะส่ง LINE (เรียลไทม์)
                    </label>
                    <button
                      type="button"
                      onClick={() => handleCopyLineText(buildLineSummaryText(currentBooking))}
                      className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="size-3" />
                      คัดลอกข้อความ
                    </button>
                  </div>

                  <textarea
                    readOnly
                    rows={12}
                    value={buildLineSummaryText(currentBooking)}
                    className="w-full font-mono text-xs p-3.5 rounded-xl border border-amber-200 dark:border-amber-950 bg-amber-50/50 dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none leading-relaxed select-all"
                  />

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSendLineNotifyDirect(buildLineSummaryText(currentBooking))}
                      className="flex-1 h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border-none shadow-sm cursor-pointer"
                    >
                      <Send className="size-3.5" />
                      <span>ส่ง LINE Notify กลุ่มวัด</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShareToLineApp(buildLineSummaryText(currentBooking))}
                      className="h-9 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border-none shadow-sm cursor-pointer"
                    >
                      <ExternalLink className="size-3.5" />
                      <span>เปิดใน LINE App</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Modal Footer Step Controls */}
              <div className="flex gap-2 pt-3 border-t border-amber-100/80 dark:border-amber-950/40">
                {bookingModalStep === 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsBookingModalOpen(false)}
                    className="w-1/3 border-amber-200 text-amber-950 hover:bg-amber-50/50 dark:border-amber-950/80 dark:text-amber-350 dark:hover:bg-amber-950/20 py-5 text-xs font-bold cursor-pointer rounded-xl"
                  >
                    ยกเลิก
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setBookingModalStep((prev) => (prev - 1) as any)}
                    className="w-1/3 border-amber-200 text-amber-950 hover:bg-amber-50/50 dark:border-amber-950/80 dark:text-amber-350 dark:hover:bg-amber-950/20 py-5 text-xs font-bold cursor-pointer rounded-xl"
                  >
                    ⬅️ ย้อนกลับ
                  </Button>
                )}

                {bookingModalStep < 3 ? (
                  <Button
                    type="button"
                    onClick={() => {
                      if (bookingModalStep === 1 && validateStep1()) {
                        setBookingModalStep(2);
                      } else if (bookingModalStep === 2 && validateStep2()) {
                        setBookingModalStep(3);
                      }
                    }}
                    className="w-2/3 bg-amber-500 hover:bg-amber-600 text-white py-5 text-xs font-bold border-none shadow-md shadow-amber-500/10 cursor-pointer flex items-center justify-center gap-1 rounded-xl"
                  >
                    <span>ถัดไป ({bookingModalStep === 1 ? '2. ใบเสนอราคา' : '3. สรุป LINE'})</span>
                    <ChevronRight className="size-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white py-5 text-xs font-bold border-none shadow-md shadow-emerald-600/10 cursor-pointer flex items-center justify-center gap-1 rounded-xl"
                  >
                    {isSaving ? 'กำลังบันทึก...' : 'บันทึกการจอง & ทำใบเสนอราคา'}
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- STANDALONE LINE PREVIEW MODAL --- */}
      {isLinePreviewOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[150] bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/50 dark:border-amber-950/40 shadow-2xl w-full max-w-md overflow-hidden relative">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-sm font-heading flex items-center gap-2">
                <MessageSquare className="size-4" />
                สรุปข้อความส่ง LINE (สำหรับแชทกลุ่มวัด / เจ้าภาพ)
              </h3>
              <button onClick={() => setIsLinePreviewOpen(false)} className="text-white hover:text-emerald-100 cursor-pointer p-1">
                <X className="size-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <textarea
                readOnly
                rows={14}
                value={previewLineMessage}
                className="w-full font-mono text-xs p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-950/50 bg-emerald-50/30 dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none leading-relaxed select-all"
              />

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleSendLineNotifyDirect(previewLineMessage)}
                  className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 border-none shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <Send className="size-4" />
                  <span>ส่ง LINE Notify เข้ากลุ่มวัดทันที</span>
                </button>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleShareToLineApp(previewLineMessage)}
                    className="h-9 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border-none cursor-pointer"
                  >
                    <ExternalLink className="size-3.5" />
                    <span>เปิดใน LINE App</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyLineText(previewLineMessage)}
                    className="h-9 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border-none cursor-pointer"
                  >
                    <Copy className="size-3.5" />
                    <span>คัดลอกข้อความ</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: ข้อมูลจัดตั้งศพเพิ่มเติม */}
      {isFuneralModalOpen && selectedBookingForFuneral && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-xs p-4 animate-fade-in text-xs animate-fade-in">
          <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/50 dark:border-amber-950/40 shadow-2xl w-full max-w-4xl overflow-hidden relative">
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 flex justify-between items-center text-white">
              <div>
                <h3 className="font-bold text-sm font-heading text-white">
                  รายละเอียดจัดตั้งศพ: {selectedBookingForFuneral.event_title}
                </h3>
                <p className="text-[10px] text-amber-100 mt-0.5">
                  เชื่อมโยงกับการจอง: {salas.find(s => s.id === selectedBookingForFuneral.sala_id)?.short_name || 'ศาลา'} | วันที่ {formatThaiDate(selectedBookingForFuneral.start_date)} - {formatThaiDate(selectedBookingForFuneral.end_date)}
                </p>
              </div>
              <button onClick={() => setIsFuneralModalOpen(false)} className="text-white hover:text-amber-100 cursor-pointer p-1">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFuneralDetail} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left Card: ข้อมูลผู้วายชนม์ */}
                <div className="bg-amber-500/5 dark:bg-[#110e08]/30 p-5 rounded-2xl border border-amber-200/20 dark:border-amber-950/20 space-y-4">
                  <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 border-b border-amber-200/30 pb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-3.5 bg-amber-500 rounded-sm inline-block" />
                    ข้อมูลผู้วายชนม์
                  </h4>

                  {currentFuneral.deceased_photo_url && (
                    <div className="flex justify-center mb-3">
                      <div className="relative size-20 rounded-full overflow-hidden border-2 border-amber-500/50 shadow-md">
                        <img 
                          src={currentFuneral.deceased_photo_url} 
                          alt="รูปผู้วายชนม์" 
                          className="size-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-900/80 dark:text-amber-350">ชื่อ-นามสกุล ผู้วายชนม์ *</label>
                    <input
                      type="text"
                      required
                      value={currentFuneral.deceased_name || ''}
                      onChange={(e) => setCurrentFuneral({ ...currentFuneral, deceased_name: e.target.value })}
                      placeholder="เช่น นายสมศักดิ์ รักดี"
                      className="w-full px-3 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    />
                  </div>

                  {/* Row 2: อายุ / เลขที่ใบมรณบัตร */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-amber-900/80 dark:text-amber-355">อายุ (ปี)</label>
                      <input
                        type="number"
                        value={currentFuneral.deceased_age || ''}
                        onChange={(e) => setCurrentFuneral({ ...currentFuneral, deceased_age: e.target.value ? Number(e.target.value) : undefined })}
                        placeholder="เช่น 75"
                        className="w-full px-3 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-amber-900/80 dark:text-amber-355">เลขที่ใบมรณบัตร</label>
                      <input
                        type="text"
                        value={currentFuneral.death_certificate_no || ''}
                        onChange={(e) => setCurrentFuneral({ ...currentFuneral, death_certificate_no: e.target.value })}
                        placeholder="ระบุเลขที่ใบมรณบัตร"
                        className="w-full px-3 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Row 3: รูปถ่ายผู้วายชนม์ */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-900/80 dark:text-amber-350 flex justify-between items-center">
                      <span>รูปถ่ายผู้วายชนม์</span>
                      {currentFuneral.deceased_photo_url && (
                        <span className="text-[9px] text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">มีรูป ✓</span>
                      )}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentFuneral.deceased_photo_url || ''}
                        onChange={(e) => setCurrentFuneral({ ...currentFuneral, deceased_photo_url: e.target.value })}
                        placeholder="ลิงก์รูป..."
                        className="flex-1 px-3 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      />
                      <label className="cursor-pointer bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 border border-amber-200 dark:border-amber-950 text-amber-800 dark:text-amber-300 px-3 py-2.5 rounded-xl text-[10px] font-bold flex items-center gap-1 shrink-0 transition-colors">
                        <span>{isUploadingPhoto ? 'กำลังส่ง...' : 'อัปโหลด'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isUploadingPhoto}
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleUploadPhoto(e.target.files[0]);
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Row 4: ใบมรณบัตร (อัปโหลด) */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-900/80 dark:text-amber-355 flex justify-between items-center">
                      <span>ใบมรณบัตร (URL / อ้างอิงไฟล์)</span>
                      {currentFuneral.death_certificate_url && (
                        <span className="text-[9px] text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">มีไฟล์ ✓</span>
                      )}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentFuneral.death_certificate_url || ''}
                        onChange={(e) => setCurrentFuneral({ ...currentFuneral, death_certificate_url: e.target.value })}
                        placeholder="ระบุที่อยู่ไฟล์ภาพใบมรณบัตร"
                        className="flex-1 px-3 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      />
                      <label className="cursor-pointer bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 border border-amber-200 dark:border-amber-950 text-amber-800 dark:text-amber-300 px-3 py-2.5 rounded-xl text-[10px] font-bold flex items-center gap-1 shrink-0 transition-colors">
                        <span>{isUploadingCertificate ? 'กำลังส่ง...' : 'อัปโหลด'}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          disabled={isUploadingCertificate}
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleUploadCertificate(e.target.files[0]);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Right Card: ข้อมูลพิธีฌาปนกิจและการชำระเงิน */}
                <div className="bg-amber-500/5 dark:bg-[#110e08]/30 p-5 rounded-2xl border border-amber-200/20 dark:border-amber-950/20 space-y-4">
                  <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 border-b border-amber-200/30 pb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-3.5 bg-amber-500 rounded-sm inline-block" />
                    ข้อมูลพิธีฌาปนกิจและการเงิน
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-amber-900/80 dark:text-amber-355">วันที่ฌาปนกิจ *</label>
                      <ThaiDatePicker
                        required
                        value={currentFuneral.cremation_date || ''}
                        onChange={(val) => setCurrentFuneral({ ...currentFuneral, cremation_date: val })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-amber-900/80 dark:text-amber-355">เวลาฌาปนกิจ</label>
                      <input
                        type="text"
                        value={currentFuneral.cremation_time || ''}
                        onChange={(e) => setCurrentFuneral({ ...currentFuneral, cremation_time: e.target.value })}
                        placeholder="เช่น 13:00 น."
                        className="w-full px-3 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Row 2: เลขที่ใบเสร็จรับเงิน */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-900/80 dark:text-amber-355">เลขที่ใบเสร็จรับเงิน</label>
                    <input
                      type="text"
                      value={currentFuneral.receipt_no || ''}
                      onChange={(e) => setCurrentFuneral({ ...currentFuneral, receipt_no: e.target.value })}
                      placeholder="ระบุเลขที่ใบเสร็จ"
                      className="w-full px-3 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    />
                  </div>

                  {/* Row 3: ใบเสร็จชำระเงิน (อัปโหลด) */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-900/80 dark:text-amber-350 flex justify-between items-center">
                      <span>ใบเสร็จชำระเงิน (URL / อ้างอิงไฟล์)</span>
                      {currentFuneral.receipt_url && (
                        <span className="text-[9px] text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">มีไฟล์ ✓</span>
                      )}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentFuneral.receipt_url || ''}
                        onChange={(e) => setCurrentFuneral({ ...currentFuneral, receipt_url: e.target.value })}
                        placeholder="ลิงก์ หรืออัปโหลดไฟล์..."
                        className="flex-1 px-3 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      />
                      <label className="cursor-pointer bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 border border-amber-200 dark:border-amber-950 text-amber-800 dark:text-amber-300 px-3 py-2.5 rounded-xl text-[10px] font-bold flex items-center gap-1 shrink-0 transition-colors">
                        <span>{isUploadingReceipt ? 'กำลังส่ง...' : 'อัปโหลด'}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          disabled={isUploadingReceipt}
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleUploadReceipt(e.target.files[0]);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">หมายเหตุเพิ่มเติม</label>
                <textarea
                  value={currentFuneral.notes || ''}
                  onChange={(e) => setCurrentFuneral({ ...currentFuneral, notes: e.target.value })}
                  placeholder="ข้อมูลอื่น ๆ เพิ่มเติม เช่น สวดกี่คืน แขกสำคัญ ฯลฯ"
                  rows={2}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none transition-all"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFuneralModalOpen(false)}
                  className="flex-1 border-amber-200/80 text-amber-950 hover:bg-amber-50 dark:border-amber-950/80 dark:text-amber-350 dark:hover:bg-amber-950/20 py-5 text-xs font-bold cursor-pointer rounded-xl transition-all"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingFuneral}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-5 text-xs font-bold border-none shadow-md shadow-amber-500/10 cursor-pointer rounded-xl transition-all"
                >
                  {isSavingFuneral ? 'กำลังบันทึก...' : 'บันทึกรายละเอียดจัดตั้งศพ'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
