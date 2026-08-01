'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit,
  Trash,
  X,
  Loader2,
  Printer,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  User,
  Phone,
  MapPin,
  Calendar,
  AlertTriangle,
  Info,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomDialog } from '@/components/ui/custom-dialog';
import { usePermission } from '@/lib/usePermission';
import { db, Quotation, CostItem, Sala, QuotationLineItem } from '@/lib/db';
import { formatThaiDate } from '@/lib/utils';

export default function QuotationsManagement() {
  const { permissions } = usePermission();

  // Data lists
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [costItems, setCostItems] = useState<CostItem[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Mode management: 'list' | 'create' | 'view'
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'view'>('list');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [settings, setSettings] = useState<any>(null);

  // Form wizard state (Phase 1 & Phase 2)
  const [formPhase, setFormPhase] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<Partial<Quotation>>({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    event_type: 'funeral',
    num_days: 3, // default to 3 days (2 nights)
    sala_id: '',
    notes: '',
    status: 'draft',
    quote_type: 'normal',
    package_rice_box_option: '50_100',
    package_extra_night_rate: 10000,
    monks_count_funeral: 4,
    water_packs_count: 20,
    ice_bags_count: 4
  });

  // Selected cost items mapping: { [costItemId]: { checked: boolean, quantity: number } }
  const [selectedItemsMap, setSelectedItemsMap] = useState<Record<string, { checked: boolean; quantity: number }>>({});

  const [isSaving, setIsSaving] = useState(false);

  // Dialog alerts
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

  const showAlert = (title: string, description: string, variant: 'success' | 'destructive' | 'warning' | 'info' = 'info') => {
    setAlertState({
      show: true,
      title,
      description,
      variant
    });
  };

  // Load all data
  const loadData = async () => {
    setLoading(true);
    try {
      const [qList, cList, sList, config] = await Promise.all([
        db.quotations.list(),
        db.costItems.list(),
        db.salas.list(),
        db.settings.get()
      ]);
      setQuotations(qList);
      setCostItems(cList.filter(item => item.is_active));
      setSalas(sList.filter(sala => sala.is_active));
      setSettings(config);
    } catch (err: any) {
      showAlert('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถโหลดข้อมูลระบบใบเสนอราคาได้', 'destructive');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (viewMode === 'create') {
      const days = Number(formData.num_days || 3);
      const nights = Math.max(1, days - 1);

      setSelectedItemsMap(prev => {
        const next = { ...prev };
        if (next['norm-sala']) next['norm-sala'].quantity = days;
        if (next['norm-maid']) next['norm-maid'].quantity = days;
        if (next['norm-staff']) next['norm-staff'].quantity = days;
        if (next['norm-freezer']) next['norm-freezer'].quantity = nights;
        if (next['norm-pana']) next['norm-pana'].quantity = nights * 5 + 9;
        return next;
      });
    }
  }, [formData.num_days, viewMode]);

  // Switch to Create Mode
  const handleOpenCreate = () => {
    setFormData({
      customer_name: '',
      customer_phone: '',
      customer_address: '',
      event_type: 'funeral',
      num_days: 3, // default 3 days (2 nights)
      sala_id: salas.length > 0 ? salas[0].id : '',
      notes: '',
      status: 'draft',
      temple_name: settings?.templeName || 'วัด',
      temple_address: settings?.address || '',
      quote_type: 'normal',
      package_rice_box_option: '50_100',
      package_extra_night_rate: 10000,
      monks_count_funeral: 4,
      water_packs_count: 20,
      ice_bags_count: 4
    });

    // Initialize items: all normal template items checked by default
    const initialMap: Record<string, { checked: boolean; quantity: number }> = {
      'norm-sala': { checked: true, quantity: 3 },
      'norm-bangsukul': { checked: true, quantity: 1 },
      'norm-suaydok': { checked: true, quantity: 1 },
      'norm-food': { checked: true, quantity: 1 },
      'norm-maid': { checked: true, quantity: 3 },
      'norm-staff': { checked: true, quantity: 3 },
      'norm-freezer': { checked: true, quantity: 2 },
      'norm-water': { checked: true, quantity: 20 },
      'norm-ice': { checked: true, quantity: 4 },
      'norm-bones': { checked: false, quantity: 1 },
      'norm-pana': { checked: false, quantity: 19 }
    };

    // Include custom database items as unchecked
    costItems.forEach(item => {
      initialMap[item.id] = {
        checked: false,
        quantity: 1
      };
    });
    setSelectedItemsMap(initialMap);

    setFormPhase(1);
    setViewMode('create');
  };

  // Phase 1 -> Phase 2
  const handleGoToPhase2 = () => {
    if (!formData.customer_name?.trim()) {
      showAlert('ข้อมูลไม่ครบถ้วน', 'กรุณาระบุชื่อเจ้าภาพ / ผู้ติดต่อ', 'warning');
      return;
    }
    if (!formData.customer_phone?.trim()) {
      showAlert('ข้อมูลไม่ครบถ้วน', 'กรุณาระบุเบอร์โทรศัพท์ผู้ติดต่อ', 'warning');
      return;
    }
    setFormPhase(2);
  };

  // Toggle checklist items
  const handleToggleItem = (itemId: string) => {
    setSelectedItemsMap(prev => {
      const next = { ...prev };
      const isChecking = !next[itemId]?.checked;
      
      next[itemId] = {
        ...next[itemId],
        checked: isChecking
      };

      // Mutual exclusivity for monks count pana
      if (itemId === 'norm-pana-4' && isChecking) {
        if (next['norm-pana-8']) next['norm-pana-8'].checked = false;
      } else if (itemId === 'norm-pana-8' && isChecking) {
        if (next['norm-pana-4']) next['norm-pana-4'].checked = false;
      }

      return next;
    });
  };

  // Update quantities
  const handleUpdateQty = (itemId: string, qty: number) => {
    if (qty < 1) return;
    setSelectedItemsMap(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        quantity: qty
      }
    }));
  };

  // Standard Funeral Template Items for Normal Mode
  const getNormalModeItems = () => {
    const nights = Math.max(1, Number(formData.num_days || 3) - 1);
    const days = Number(formData.num_days || 3);

    // Helpers to match database cost item amounts
    const getDbItemAmount = (nameQuery: string, defaultAmount: number) => {
      const found = costItems.find(item => item.name.replace(/\s+/g, '').toLowerCase().includes(nameQuery.replace(/\s+/g, '').toLowerCase()));
      return found ? found.amount : defaultAmount;
    };

    const selectedSala = salas.find(s => s.id === formData.sala_id);
    const isSala1 = selectedSala?.short_name?.trim() === 'ศาลา 1';
    
    // Normal mode: always use DB price regardless of sala (no surcharge)
    const salaAmount = isSala1 
      ? getDbItemAmount('ค่าบำรุงศาลา ศ.1', 2500) 
      : getDbItemAmount('ค่าบำรุงศาลา ศ.2-4', 1500);

    const bangsukulAmount = getDbItemAmount('บูชาผ้าบังสุกุล', 1500);
    const suaydokBase = getDbItemAmount('สวยดอก', 1200);
    const foodAmount = getDbItemAmount('ภัตตาหารเพล', 2500);
    const maidAmount = getDbItemAmount('แม่บ้านทำความสะอาด', 300);
    const staffAmount = getDbItemAmount('เจ้าหน้าที่ศาลา', 300);
    const freezerAmount = getDbItemAmount('บำรุงโลงเย็น', 300);
    const bonesAmount = getDbItemAmount('ชุดเก็บอัฐิ', 500);
    const waterAmount = getDbItemAmount('น้ำดื่ม', 45);
    const iceAmount = getDbItemAmount('น้ำแข็งกระสอบ', 40);

    const panaAmount = getDbItemAmount('น้ำปานะ', 30);

    return [
      { id: 'norm-sala', name: `ค่าบำรุงสถานที่ (${selectedSala?.short_name || 'ศาลา'})`, amount: salaAmount, category: 'required', quantity: days, subtotal: salaAmount * days },
      { id: 'norm-bangsukul', name: 'บูชาผ้าบังสุกุล กัณฑ์เทศน์ ตลอดงาน', amount: bangsukulAmount, category: 'required', quantity: 1, subtotal: bangsukulAmount },
      { id: 'norm-suaydok', name: 'สวยดอก(กรวยดอกไม้) ข้าวร้อยห่อ ขันตั้งสัปเหร่อ', amount: suaydokBase + Math.max(0, days - 2) * 100, category: 'required', quantity: 1, subtotal: suaydokBase + Math.max(0, days - 2) * 100 },
      { id: 'norm-food', name: 'ภัตตาหารเพล วันเผา', amount: foodAmount, category: 'required', quantity: 1, subtotal: foodAmount },
      { id: 'norm-maid', name: 'แม่บ้านทำความสะอาด', amount: maidAmount, category: 'required', quantity: days, subtotal: maidAmount * days },
      { id: 'norm-staff', name: 'เจ้าหน้าที่ศาลา', amount: staffAmount, category: 'required', quantity: days, subtotal: staffAmount * days },
      { id: 'norm-freezer', name: 'บำรุงโลงเย็น', amount: freezerAmount, category: 'required', quantity: nights, subtotal: freezerAmount * nights },
      { id: 'norm-water', name: 'น้ำดื่ม', amount: waterAmount, category: 'optional', quantity: 20, subtotal: waterAmount * 20 },
      { id: 'norm-ice', name: 'น้ำแข็งกระสอบ', amount: iceAmount, category: 'optional', quantity: 4, subtotal: iceAmount * 4 },
      { id: 'norm-bones', name: 'ชุดเก็บอัฐิ', amount: bonesAmount, category: 'optional', quantity: 1, subtotal: bonesAmount },
      { id: 'norm-pana', name: 'น้ำปานะถวายพระ', amount: panaAmount, category: 'optional', quantity: nights * 5 + 9, subtotal: panaAmount * (nights * 5 + 9) }
    ];
  };

  // Calculate Running Totals
  const calculateTotal = () => {
    if (formData.quote_type === 'package') {
      const nights = Math.max(1, Number(formData.num_days || 2) - 1);
      const extraNights = Math.max(0, nights - 1);
      const extraRate = formData.package_extra_night_rate || 10000;
      let total = 38500 + (extraNights * extraRate);
      
      const selectedSala = salas.find(s => s.id === formData.sala_id);
      const isSala1 = selectedSala?.short_name?.trim() === 'ศาลา 1';
      if (isSala1) {
        total += 1000 * Number(formData.num_days || 2);
      }
      return total;
    }

    let total = 0;
    // Standard template items
    const normalItems = getNormalModeItems();
    normalItems.forEach(item => {
      const selection = selectedItemsMap[item.id];
      if (selection?.checked) {
        total += item.amount * selection.quantity;
      }
    });

    // Custom database items
    costItems.forEach(item => {
      const selection = selectedItemsMap[item.id];
      if (selection?.checked) {
        total += item.amount * selection.quantity;
      }
    });

    return total;
  };

  // Save Quotation to DB
  const handleSaveQuotation = async () => {
    setIsSaving(true);
    try {
      // 1. Get next serial number
      const nextNo = await db.quotations.getNextNo();

      // 2. Prepare line items
      const lineItems: QuotationLineItem[] = [];

      if (formData.quote_type === 'package') {
        const nights = Math.max(1, Number(formData.num_days || 2) - 1);
        const extraNights = Math.max(0, nights - 1);
        const extraRate = formData.package_extra_night_rate || 10000;
        
        lineItems.push({
          cost_item_id: 'package-base',
          name: `แพ็กเกจเหมาจ่ายเริ่มต้น 1 คืน 2 วัน (รายการบริการและปัจจัยถวายพระครบวงจร)`,
          amount: 38500,
          quantity: 1,
          subtotal: 38500
        });

        if (extraNights > 0) {
          lineItems.push({
            cost_item_id: 'package-extra',
            name: `ราคาส่วนเพิ่มสวดอภิธรรม คืนเพิ่มเติม (คืนละ ${extraRate.toLocaleString('th-TH')} บาท x ${extraNights} คืน)`,
            amount: extraRate,
            quantity: extraNights,
            subtotal: extraRate * extraNights
          });
        }

        const selectedSala = salas.find(s => s.id === formData.sala_id);
        const isSala1 = selectedSala?.short_name?.trim() === 'ศาลา 1';
        if (isSala1) {
          lineItems.push({
            cost_item_id: 'package-sala-surcharge',
            name: `ค่านิมนต์บำรุงสถานที่ส่วนเพิ่มสำหรับ ${selectedSala?.short_name || 'ศาลา 1'} (วันละ 1,000 บาท x ${formData.num_days} วัน)`,
            amount: 1000,
            quantity: Number(formData.num_days || 2),
            subtotal: 1000 * Number(formData.num_days || 2)
          });
        }

        const included = [
          { name: 'ค่าบำรุงศาลา (เหมาจ่าย)', amount: 0, quantity: 1 },
          { name: 'บูชาผ้าบังสุกุล กัณฑ์เทศน์ (เหมาจ่าย)', amount: 0, quantity: 1 },
          { name: 'เจ้าหน้าที่ศาลา (เหมาจ่าย)', amount: 0, quantity: 1 },
          { name: 'แม่บ้านทำความสะอาด (เหมาจ่าย)', amount: 0, quantity: 1 },
          { name: 'บำรุงโลงเย็น (เหมาจ่าย)', amount: 0, quantity: 1 },
          { name: 'ชุดเก็บอัฐิ (เหมาจ่าย)', amount: 0, quantity: 1 },
          { name: 'ภัตตาหารเพล วันเผา (เหมาจ่าย)', amount: 0, quantity: 1 },
          { name: `น้ำดื่ม ตลอดงาน (วันละ 5 แพ็ค + วันเผา 10 แพ็ค) (เหมาจ่าย)`, amount: 0, quantity: 5 * nights + 10 },
          { name: 'น้ำแข็งกระสอบ (เหมาจ่าย)', amount: 0, quantity: 2 * nights },
          { name: `สวยดอก กรวยดอกไม้ ข้าวร้อยห่อ ขันตั้งสัปเหร่อ (เริ่มต้น 1,200 + วันละ 100)`, amount: 0, quantity: 1 },
          { name: `น้ำปานะถวายพระ (คืนละ 5 ชุด x ${nights} คืน + วันเผา 9 ชุด)`, amount: 0, quantity: 1 },
          { name: `ขนมเลี้ยงแขก (คืนละ 50 กล่อง x ${nights} คืน)`, amount: 0, quantity: 50 * nights },
          { name: 'ซองถวายพระ (สวดมาติกา) 8 รูป (เหมาจ่าย)', amount: 0, quantity: 8 },
          { name: `ซองถวายพระ (สวดอภิธรรม) (คืนละ 6 ซอง x ${nights} คืน)`, amount: 0, quantity: 6 * nights },
          { name: `ซองมอบมัคทายก (คืนละ 1 ซอง x ${nights} คืน + วันเผา 1 ซอง)`, amount: 0, quantity: nights + 1 },
          { 
            name: `ข้าวกล่องวันเผา (${formData.package_rice_box_option === '100_50' ? '100 กล่อง x 50 บาท' : '50 กล่อง x 100 บาท'})`, 
            amount: 0, 
            quantity: formData.package_rice_box_option === '100_50' ? 100 : 50
          },
          { name: 'ดอกไม้จันทน์ วันเผา (ของแถม)', amount: 0, quantity: 1 },
          { name: `กาแฟโอวัลติน ทุกคืน (ของแถม) (คืนละ 1 ชุด x ${nights} คืน)`, amount: 0, quantity: nights }
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
      } else {
        const normalItems = getNormalModeItems();
        normalItems.forEach(item => {
          const selection = selectedItemsMap[item.id];
          if (selection?.checked) {
            lineItems.push({
              cost_item_id: item.id,
              name: item.name,
              amount: item.amount,
              quantity: selection.quantity,
              subtotal: item.amount * selection.quantity
            });
          }
        });

        costItems.forEach(item => {
          const selection = selectedItemsMap[item.id];
          if (selection?.checked) {
            lineItems.push({
              cost_item_id: item.id,
              name: item.name,
              amount: item.amount,
              quantity: selection.quantity,
              subtotal: item.amount * selection.quantity
            });
          }
        });
      }

      if (lineItems.length === 0) {
        showAlert('ไม่มีรายการค่าใช้จ่าย', 'กรุณาเลือกอย่างน้อย 1 รายการค่าใช้จ่าย', 'warning');
        setIsSaving(false);
        return;
      }

      const totalAmount = lineItems.reduce((acc, curr) => acc + curr.subtotal, 0);

      const quotationToSave: Quotation = {
        id: formData.id || `qt-${Date.now()}`,
        quotation_no: formData.quotation_no || nextNo,
        customer_name: formData.customer_name!,
        customer_phone: formData.customer_phone!,
        customer_address: formData.customer_address || '',
        event_type: formData.event_type!,
        num_days: Number(formData.num_days || 1),
        sala_id: formData.sala_id || undefined,
        items: lineItems,
        total_amount: totalAmount,
        status: formData.status as 'draft' | 'sent' | 'approved' | 'cancelled',
        notes: formData.notes || '',
        created_at: formData.created_at || new Date().toISOString(),
        temple_name: formData.temple_name || settings?.templeName || 'วัด',
        temple_address: formData.temple_address || settings?.address || '',
        quote_type: formData.quote_type || 'normal',
        package_rice_box_option: formData.package_rice_box_option || '50_100',
        package_extra_night_rate: formData.package_extra_night_rate || 10000,
        monks_count_funeral: formData.monks_count_funeral || 4,
        water_packs_count: formData.water_packs_count || 0,
        ice_bags_count: formData.ice_bags_count || 0
      };

      const saved = await db.quotations.save(quotationToSave);

      // Auto-trigger booking in sala bookings if status is approved or confirmed!
      if (quotationToSave.status === 'approved' && quotationToSave.sala_id) {
        const start = new Date();
        const end = new Date();
        end.setDate(end.getDate() + (quotationToSave.num_days - 1));

        await db.salaBookings.save({
          id: `bk-${Date.now()}`,
          sala_id: quotationToSave.sala_id,
          event_title: `งานจัดพิธี: ${quotationToSave.customer_name} (${getEventTypeLabel(quotationToSave.event_type)})`,
          event_type: quotationToSave.event_type === 'funeral' ? 'funeral' : quotationToSave.event_type === 'wedding' ? 'wedding' : 'ceremony',
          booker_name: quotationToSave.customer_name,
          booker_phone: quotationToSave.customer_phone,
          start_date: start.toISOString().split('T')[0],
          end_date: end.toISOString().split('T')[0],
          num_days: quotationToSave.num_days,
          status: 'confirmed',
          quotation_id: saved.id,
          created_at: new Date().toISOString()
        });
      }

      showAlert('สำเร็จ', `สร้างใบเสนอราคาเลขที่ ${nextNo} เรียบร้อยแล้ว`, 'success');
      setViewMode('list');
      loadData();
    } catch (err: any) {
      showAlert('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถบันทึกข้อมูลใบเสนอราคาได้', 'destructive');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Quotation
  const handleDeleteQuotation = (id: string) => {
    setConfirmState({
      show: true,
      title: 'ยืนยันการลบใบเสนอราคา',
      description: 'คุณต้องการลบใบเสนอราคานี้ใช่หรือไม่? ข้อมูลการจองที่เชื่อมโยงจะไม่ถูกลบโดยอัตโนมัติ',
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await db.quotations.delete(id);
          showAlert('สำเร็จ', 'ลบใบเสนอราคาเรียบร้อยแล้ว', 'success');
          loadData();
        } catch (err: any) {
          showAlert('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถลบใบเสนอราคาได้', 'destructive');
        }
      }
    });
  };

  // Update quotation status in list
  const handleUpdateStatus = async (item: Quotation, nextStatus: any) => {
    try {
      const updated = {
        ...item,
        status: nextStatus
      };
      await db.quotations.save(updated);
      showAlert('สำเร็จ', 'อัพเดทสถานะใบเสนอราคาแล้ว', 'success');
      loadData();
    } catch (err: any) {
      showAlert('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถเปลี่ยนสถานะได้', 'destructive');
    }
  };

  // Trigger browser print
  const handlePrint = (qt: Quotation) => {
    setSelectedQuotation(qt);
    const originalTitle = document.title;
    document.title = ""; // Clear title to prevent printing "WatDongOS" or document path
    setTimeout(() => {
      window.print();
      document.title = originalTitle;
    }, 100);
  };

  const isSalaMaintenanceItem = (name: string) => {
    const n = name.toLowerCase();
    return n.includes('บำรุงศาลา') || n.includes('ค่าศาลา') || n.includes('บำรุงสถานที่');
  };

  const isAlreadyIncludedInPackage = (name: string) => {
    const n = name.toLowerCase();
    return (
      n.includes('บำรุงศาลา') ||
      n.includes('ค่าศาลา') ||
      n.includes('บังสุกุล') ||
      n.includes('กัณฑ์เทศน์') ||
      n.includes('แม่บ้าน') ||
      n.includes('เจ้าหน้าที่ศาลา') ||
      n.includes('โลงเย็น') ||
      n.includes('เก็บอัฐิ') ||
      n.includes('ภัตตาหาร') ||
      n.includes('น้ำดื่ม') ||
      n.includes('น้ำแข็ง') ||
      n.includes('สวยดอก') ||
      n.includes('สัปเหร่อ') ||
      n.includes('ปานะ') ||
      n.includes('ขนมเลี้ยง') ||
      n.includes('ข้าวกล่อง') ||
      n.includes('ซองถวาย') ||
      n.includes('มัคทายก')
    );
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'funeral': return 'งานศพ / บำเพ็ญกุศล';
      case 'ceremony': return 'งานทำบุญ / สวดมนต์พิธี';
      case 'wedding': return 'งานมงคลสมรส';
      default: return 'อื่นๆ';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-gray-500/10 text-gray-500">แบบร่าง (Draft)</span>;
      case 'sent':
        return <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">ส่งแล้ว (Sent)</span>;
      case 'approved':
        return <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">อนุมัติแล้ว (Approved)</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-450">ยกเลิก (Cancelled)</span>;
      default:
        return null;
    }
  };

  // Filter Quotations
  const filteredQuotations = quotations.filter(q => {
    const matchesSearch = q.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      q.quotation_no.toLowerCase().includes(search.toLowerCase()) ||
      (q.customer_phone && q.customer_phone.includes(search));

    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && q.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Dynamic media print layout hidden by default */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page {
            margin: 0 !important;
          }
          body {
            margin: 0 !important;
          }
          /* Hide everything except the print-only div */
          body * {
            visibility: hidden !important;
          }
          #print-wrapper, #print-wrapper * {
            visibility: visible !important;
          }
          #print-wrapper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            min-height: 100% !important;
            padding: 15mm 15mm 15mm 15mm !important;
            background: white !important;
            color: black !important;
            box-sizing: border-box !important;
          }
          .no-print {
            display: none !important;
          }
          .print-watermark {
            display: block !important;
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) rotate(-25deg) !important;
            font-size: 3rem !important;
            font-weight: 900 !important;
            color: rgba(0, 0, 0, 0.08) !important;
            white-space: nowrap !important;
            z-index: 9999 !important;
            pointer-events: none !important;
            user-select: none !important;
            border: 6px solid rgba(0, 0, 0, 0.08) !important;
            padding: 8px 16px !important;
            letter-spacing: 0.15em !important;
            border-radius: 8px !important;
            opacity: 0.8 !important;
          }
        }
        .print-watermark {
          display: none;
        }
      ` }} />

      {selectedQuotation && (
        <div id="print-wrapper" className="hidden print:block space-y-4 font-sans text-black bg-white relative">
          {/* Custom Print Header with Thai DateTime */}
          <div className="hidden print:flex justify-between items-center text-[10px] text-gray-500 border-b border-gray-250 pb-2 mb-1.5">
            <span>พิมพ์เมื่อ: {(() => {
              const d = new Date();
              const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
              const year = d.getFullYear() + 543;
              const hours = String(d.getHours()).padStart(2, '0');
              const minutes = String(d.getMinutes()).padStart(2, '0');
              return `${d.getDate()} ${months[d.getMonth()]} ${year} เวลา ${hours}:${minutes} น.`;
            })()}</span>
            <span>ใบเสนอราคาเลขที่: {selectedQuotation.quotation_no}</span>
          </div>

          <div className="print-watermark">
            ไม่อนุญาตให้นำไปเผยแพร่
          </div>
          <div className="text-center space-y-1.5 pb-4 border-b border-gray-300">
            <h1 className="text-xl font-bold">ใบเสนอราคา / รายการจัดงานพิธี</h1>
            <p className="text-sm font-semibold">{selectedQuotation.temple_name || settings?.templeName || ''}</p>
            <p className="text-[10px] text-gray-500">{selectedQuotation.temple_address || settings?.address || ''}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs pt-2">
            <div className="space-y-1">
              <div><strong>ผู้ติดต่อ / เจ้าภาพ:</strong> {selectedQuotation.customer_name}</div>
              <div><strong>เบอร์โทรศัพท์:</strong> {selectedQuotation.customer_phone}</div>
              {selectedQuotation.customer_address && (
                <div><strong>ที่อยู่:</strong> {selectedQuotation.customer_address}</div>
              )}
            </div>
            <div className="space-y-1 text-right">
              <div><strong>เลขที่ใบเสนอราคา:</strong> {selectedQuotation.quotation_no}</div>
              <div><strong>วันที่จัดทำ:</strong> {formatThaiDate(selectedQuotation.created_at)}</div>
              <div><strong>ประเภทงานพิธี:</strong> {getEventTypeLabel(selectedQuotation.event_type)}</div>
              {selectedQuotation.sala_id && (
                <div><strong>ศาสนสถาน:</strong> {salas.find(s => s.id === selectedQuotation.sala_id)?.short_name || 'ไม่ระบุ'}</div>
              )}
              <div><strong>จำนวนวันจัดงาน:</strong> {selectedQuotation.num_days} วัน</div>
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-left border-collapse text-xs border border-gray-300">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300 font-bold">
                <th className="p-2 border border-gray-300 text-center w-12">ลำดับ</th>
                <th className="p-2 border border-gray-300">รายการค่าใช้จ่าย / การจัดงาน</th>
                <th className="p-2 border border-gray-300 text-right w-24">ราคาต่อหน่วย</th>
                <th className="p-2 border border-gray-300 text-center w-16">จำนวน</th>
                <th className="p-2 border border-gray-300 text-right w-28">ยอดรวม (บาท)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300">
              {(() => {
                const items = [...selectedQuotation.items];
                if (selectedQuotation.quote_type === 'package') {
                  const nights = Math.max(1, Number(selectedQuotation.num_days || 2) - 1);
                  if (!items.some(i => i.name.includes('ดอกไม้จันทน์ วันเผา'))) {
                    items.push({
                      cost_item_id: 'package-included',
                      name: 'ดอกไม้จันทน์ วันเผา (ของแถม)',
                      amount: 0,
                      quantity: 1,
                      subtotal: 0
                    });
                  }
                  if (!items.some(i => i.name.includes('กาแฟโอวัลติน ทุกคืน'))) {
                    items.push({
                      cost_item_id: 'package-included',
                      name: `กาแฟโอวัลติน ทุกคืน (ของแถม) (คืนละ 1 ชุด x ${nights} คืน)`,
                      amount: 0,
                      quantity: nights,
                      subtotal: 0
                    });
                  }
                }
                return items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-2 border border-gray-300 text-center">{idx + 1}</td>
                    <td className="p-2 border border-gray-300">{item.name}</td>
                    <td className="p-2 border border-gray-300 text-right">
                      {item.amount === 0 || item.cost_item_id === 'package-included' ? (
                        <span className="text-[10px] text-gray-500 italic font-semibold">รวมในแพ็กเกจ</span>
                      ) : (
                        `฿${item.amount.toLocaleString('th-TH')}`
                      )}
                    </td>
                    <td className="p-2 border border-gray-300 text-center">{item.quantity}</td>
                    <td className="p-2 border border-gray-300 text-right font-bold">
                      {item.subtotal === 0 || item.cost_item_id === 'package-included' ? (
                        <span className="text-[10px] text-gray-500 italic font-semibold">รวมแล้ว</span>
                      ) : (
                        `฿${item.subtotal.toLocaleString('th-TH')}`
                      )}
                    </td>
                  </tr>
                ));
              })()}
              <tr className="bg-gray-50 font-bold text-sm">
                <td colSpan={4} className="p-3 border border-gray-300 text-right">ยอดรวมสุทธิทั้งสิ้น:</td>
                <td className="p-3 border border-gray-300 text-right text-black font-bold">
                  ฿{selectedQuotation.total_amount.toLocaleString('th-TH')}
                </td>
              </tr>
            </tbody>
          </table>

          {selectedQuotation.notes && (
            <div className="text-[10px] bg-gray-50 p-2.5 rounded border border-gray-250">
              <strong>หมายเหตุเพิ่มเติม:</strong> {selectedQuotation.notes}
            </div>
          )}



          {/* หมายเหตุท้ายเอกสาร */}
          <div className="pt-6 space-y-1.5 text-[9px] text-gray-500 text-left border-t border-gray-300 mt-12">
            <p className="font-bold text-xs text-gray-700">** หมายเหตุ **</p>
            <p>- ใบเสนอราคานี้ ออกจากระบบ {settings?.abbr || 'TEMPLE OS'} ไม่สามารถใช้แทนใบเสร็จรับเงินอย่างเป็นทางการได้</p>
            <p>- ไม่อนุญาตให้ นำไปเผยแพร่ หรือ ให้บริการอื่น โดยไม่ได้รับอนุญาตจากทางวัด</p>
            <p>- ขอสงวนสิทธิ์ในการเปลี่ยนแปลงราคา และรายละเอียด โดยไม่แจ้งให้ทราบล่วงหน้า</p>
          </div>
        </div>
      )}

      {/* --- NORMAL VIEW MODE --- */}
      {viewMode === 'list' && (
        <>
          {/* Header section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold font-heading text-amber-900 dark:text-amber-200">
                ระบบใบเสนอราคาและการจัดงานพิธี
              </h2>
              <p className="text-xs text-amber-700/50 dark:text-amber-400/50">
                ออกเอกสารประมาณการค่าใช้จ่ายจัดงานบำเพ็ญกุศลศพ และงานพิธีทำบุญต่าง ๆ
              </p>
            </div>
            {permissions.canCreate && (
              <Button
                onClick={handleOpenCreate}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-5 px-5 rounded-xl flex items-center gap-1.5 border-none shadow-md shadow-amber-500/10 cursor-pointer"
              >
                <Plus className="size-4" />
                สร้างใบเสนอราคาใหม่
              </Button>
            )}
          </div>

          {/* Dialog alerts */}
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
              confirmText="ยืนยันการลบ"
              cancelText="ยกเลิก"
            />
          )}

          {/* Toolbar Search & Status Filters */}
          <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-[#15110a] p-4 rounded-xl border border-amber-200/40 dark:border-amber-950/30">
            {/* Search */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-700/40 dark:text-amber-500/30">
                <Search className="size-4" />
              </div>
              <input
                type="text"
                placeholder="ค้นหาเลขใบเสนอราคา, ชื่อเจ้าภาพ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-amber-200/60 dark:border-amber-950 bg-amber-50/10 dark:bg-[#1a150e] text-amber-950 dark:text-amber-100 placeholder-amber-700/30 dark:placeholder-amber-500/20 text-xs outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-amber-800/70 dark:text-amber-400/70 shrink-0">สถานะใบเสนอราคา:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2 px-3 rounded-lg border border-amber-200/60 dark:border-amber-950 bg-amber-50/10 dark:bg-[#1a150e] text-amber-950 dark:text-amber-100 text-xs outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
              >
                <option value="all">ทั้งหมด</option>
                <option value="draft">ร่าง (Draft)</option>
                <option value="sent">ส่งให้ลูกค้าแล้ว (Sent)</option>
                <option value="approved">ได้รับการอนุมัติ (Approved)</option>
                <option value="cancelled">ยกเลิก (Cancelled)</option>
              </select>
            </div>
          </div>

          {/* Quotations List Table */}
          {loading ? (
            <div className="min-h-[40vh] flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="size-8 text-amber-500 animate-spin" />
                <p className="text-xs font-bold text-amber-700/60 dark:text-amber-500/60">กำลังดึงข้อมูลใบเสนอราคา...</p>
              </div>
            </div>
          ) : filteredQuotations.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#15110a] rounded-xl border border-amber-200/40 dark:border-amber-950/30">
              <FileText className="size-12 mx-auto text-amber-200 dark:text-amber-950/50 mb-3" />
              <p className="text-sm text-amber-800/50 dark:text-amber-500/40">ไม่พบประวัติการทำใบเสนอราคาตามเงื่อนไขที่ระบุ</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 overflow-hidden shadow-md shadow-amber-100/5">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-amber-500/10 border-b border-amber-200/30 dark:border-amber-950/30 text-amber-900 dark:text-amber-300 font-bold">
                      <th className="p-4 w-32">เลขที่เอกสาร</th>
                      <th className="p-4">เจ้าภาพ / ผู้ติดต่อ</th>
                      <th className="p-4 w-36">ประเภทงาน</th>
                      <th className="p-4 w-24 text-center">จำนวนวัน</th>
                      <th className="p-4 w-36 text-right">ยอดเงินรวม</th>
                      <th className="p-4 w-36 text-center">สถานะเอกสาร</th>
                      <th className="p-4 w-28 text-center">ดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100/50 dark:divide-amber-950/20">
                    {filteredQuotations.map((qt) => (
                      <tr key={qt.id} className="hover:bg-amber-50/20 dark:hover:bg-amber-950/10 transition-colors">
                        <td className="p-4 font-bold text-amber-950 dark:text-amber-100">
                          {qt.quotation_no}
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-amber-950 dark:text-amber-100">{qt.customer_name}</div>
                          <div className="text-[10px] text-amber-700/60 dark:text-amber-400/50 flex items-center gap-1 mt-0.5">
                            <Phone className="size-3" />
                            <span>โทร: {qt.customer_phone || '-'}</span>
                          </div>
                        </td>
                        <td className="p-4 font-semibold text-amber-900 dark:text-amber-200">
                          {getEventTypeLabel(qt.event_type)}
                        </td>
                        <td className="p-4 text-center font-bold text-amber-950 dark:text-amber-100">
                          {qt.num_days} วัน
                        </td>
                        <td className="p-4 text-right font-bold text-amber-950 dark:text-amber-100 text-sm">
                          ฿{qt.total_amount.toLocaleString('th-TH')}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center gap-1.5">
                            {getStatusBadge(qt.status)}
                            {permissions.canEdit && (
                              <select
                                value={qt.status}
                                onChange={(e) => handleUpdateStatus(qt, e.target.value)}
                                className="text-[9px] py-0.5 px-1 bg-amber-50/20 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-950 text-amber-950 dark:text-amber-150 rounded outline-none cursor-pointer font-bold"
                              >
                                <option value="draft">ร่าง</option>
                                <option value="sent">ส่งแล้ว</option>
                                <option value="approved">อนุมัติ</option>
                                <option value="cancelled">ยกเลิก</option>
                              </select>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center gap-1.5">
                            <button
                              onClick={() => handlePrint(qt)}
                              className="p-1.5 rounded-lg border border-amber-200/50 dark:border-amber-950 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 cursor-pointer"
                              title="พิมพ์เอกสาร"
                            >
                              <Printer className="size-4" />
                            </button>
                            {permissions.canDelete && (
                              <button
                                onClick={() => handleDeleteQuotation(qt.id)}
                                className="p-1.5 rounded-lg border border-rose-200/50 dark:border-rose-950 hover:bg-rose-500/10 text-rose-600 dark:text-rose-455 cursor-pointer"
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
            </div>
          )}
        </>
      )}

      {/* --- CREATE WIZARD MODE --- */}
      {viewMode === 'create' && (
        <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 p-6 shadow-md shadow-amber-100/5 space-y-6">
          {/* Header wizard */}
          <div className="flex justify-between items-center pb-4 border-b border-amber-100/50 dark:border-amber-950/20">
            <div>
              <h3 className="font-bold text-base text-amber-950 dark:text-amber-100 font-heading">
                สร้างเอกสารใบเสนอราคาใหม่
              </h3>
              <p className="text-[10px] text-amber-700/50 dark:text-amber-400/50">
                ขั้นตอนที่ {formPhase} จาก 2: {formPhase === 1 ? 'ระบุข้อมูลติดต่อและศาสนสถาน' : 'เลือกรายละเอียดรายการค่าใช้จ่าย'}
              </p>
            </div>
            <button
              onClick={() => setViewMode('list')}
              className="p-1.5 rounded-lg text-amber-800 hover:bg-amber-500/10 cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* PHASE 1: BASIC INFO */}
          {formPhase === 1 && (
            <div className="space-y-4 max-w-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ชื่อเจ้าภาพ / ผู้ติดต่อหลัก *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 size-4 text-amber-700/40" />
                    <input
                      type="text"
                      required
                      value={formData.customer_name || ''}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      placeholder="ชื่อผู้แทนเจ้าภาพ หรือชื่องานคุณยายสมหมาย"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Customer phone */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">เบอร์โทรศัพท์ผู้ติดต่อ *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 size-4 text-amber-700/40" />
                    <input
                      type="text"
                      required
                      value={formData.customer_phone || ''}
                      onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                      placeholder="เช่น 089-xxxxxxx"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Customer Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ที่อยู่อาศัยเพื่อส่งติดต่อ</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 size-4 text-amber-700/40" />
                  <input
                    type="text"
                    value={formData.customer_address || ''}
                    onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                    placeholder="ที่อยู่บ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Offeror Temple Details */}
              <div className="space-y-3 border-t border-amber-100 dark:border-amber-950/40 pt-4 mt-2">
                <h4 className="font-extrabold text-xs text-amber-950 dark:text-amber-200 font-heading">
                  ข้อมูลวัดผู้เสนอราคา
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-amber-900/80 dark:text-amber-300">ชื่อวัดผู้เสนอราคา</label>
                    <input
                      type="text"
                      value={formData.temple_name || ''}
                      onChange={(e) => setFormData({ ...formData, temple_name: e.target.value })}
                      placeholder="ดึงจากระบบ หรือระบุเอง..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-amber-900/80 dark:text-amber-300">ที่อยู่วัดผู้เสนอราคา</label>
                    <input
                      type="text"
                      value={formData.temple_address || ''}
                      onChange={(e) => setFormData({ ...formData, temple_address: e.target.value })}
                      placeholder="ดึงจากระบบ หรือระบุเอง..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Event Type */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ประเภทการจัดงานพิธี *</label>
                  <select
                    value={formData.event_type || 'funeral'}
                    onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                  >
                    <option value="funeral">งานศพ / บำเพ็ญกุศล (Funeral)</option>
                    <option value="ceremony">งานทำบุญ / สวดมนต์พิธี (Ceremony)</option>
                    <option value="wedding">งานมงคลสมรส (Wedding)</option>
                    <option value="other">อื่นๆ (Other)</option>
                  </select>
                </div>

                {/* Num Days */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">จำนวนวันที่จัดงาน (วัน) *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 size-4 text-amber-700/40" />
                    <input
                      type="number"
                      min={formData.quote_type === 'package' ? 2 : 1}
                      required
                      value={formData.num_days || 1}
                      onChange={(e) => {
                        const minVal = formData.quote_type === 'package' ? 2 : 1;
                        setFormData({ ...formData, num_days: Math.max(minVal, Number(e.target.value)) });
                      }}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Select Sala */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ศาสนสถานที่เลือกจอง</label>
                <select
                  value={formData.sala_id || ''}
                  onChange={(e) => setFormData({ ...formData, sala_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                >
                  <option value="">-- ไม่ประสงค์ระบุศาลาจอง / จองด้วยวิธีอื่น --</option>
                  {salas.map(s => (
                    <option key={s.id} value={s.id}>{s.short_name} ({s.full_name || 'ศาลา'})</option>
                  ))}
                </select>
              </div>

              {/* Funeral Setup Type & Configuration (Only visible for event_type === 'funeral') */}
              {formData.event_type === 'funeral' && (
                <div className="space-y-3 border-t border-amber-100 dark:border-amber-950/40 pt-4 mt-2">
                  <h4 className="font-extrabold text-xs text-amber-950 dark:text-amber-200 font-heading">
                    รูปแบบการตั้งศพวัด
                  </h4>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ประเภทรูปแบบ *</label>
                      <select
                        value={formData.quote_type || 'normal'}
                        onChange={(e) => {
                          const val = e.target.value as 'normal' | 'package';
                          setFormData({
                            ...formData,
                            quote_type: val,
                            num_days: val === 'package' ? Math.max(2, formData.num_days || 2) : formData.num_days
                          });
                        }}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                      >
                        <option value="normal">แบบปกติ จัดเอง (เลือกและคิดราคาแยกตามจริง)</option>
                        <option value="package">แบบเหมาจ่าย (เริ่มต้น 38,500 บาท สำหรับ 1 คืน 2 วัน)</option>
                      </select>
                    </div>

                    {formData.quote_type === 'package' ? (
                      <div className="mt-2.5 p-3 bg-amber-500/10 dark:bg-amber-950/20 rounded-xl border border-amber-250/20 text-xs font-bold text-amber-900 dark:text-amber-100 flex items-center justify-between">
                        <span>💰 ยอดเหมาจ่ายสุทธิ ({formData.num_days} วัน / {Math.max(1, Number(formData.num_days || 2) - 1)} คืน):</span>
                        <span className="text-sm font-extrabold text-amber-600">฿{calculateTotal().toLocaleString('th-TH')} บาท</span>
                      </div>
                    ) : (
                      <div className="mt-2.5 p-3 bg-amber-500/10 dark:bg-amber-950/20 rounded-xl border border-amber-250/20 text-xs font-bold text-amber-900 dark:text-amber-100 flex items-center justify-between">
                        <span>💰 ยอดประมาณการเบื้องต้น ({formData.num_days} วัน / {Math.max(1, Number(formData.num_days || 2) - 1)} คืน):</span>
                        <span className="text-sm font-extrabold text-amber-600">฿{calculateTotal().toLocaleString('th-TH')} บาท</span>
                      </div>
                    )}




                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">หมายเหตุเพิ่มเติมสำหรับใบเสนอราคา</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="สิทธิประโยชน์ หรือบริการพิเศษ..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
                />
              </div>

              {/* Action next button */}
              <div className="pt-4 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setViewMode('list')}
                  className="flex-1 border-amber-200 text-amber-950 hover:bg-amber-50/50 dark:border-amber-950/80 dark:text-amber-350 dark:hover:bg-amber-950/20 py-5 text-xs font-bold cursor-pointer"
                >
                  ยกเลิก
                </Button>
                <Button
                  onClick={handleGoToPhase2}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-5 rounded-xl border-none shadow-md shadow-amber-500/10 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>ถัดไป - เลือกรายการค่าใช้จ่าย</span>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {/* PHASE 2: COST ITEM SELECTION */}
          {formPhase === 2 && (
            <div className="space-y-6">
              {/* Alert note */}
              <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-250/25 flex items-start gap-2.5 text-[10px] text-amber-800/80 dark:text-amber-400">
                <Info className="size-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  {formData.quote_type === 'package' 
                    ? 'รายการสิ่งของและภาระปัจจัยทั้งหมดรวมอยู่ในแพ็กเกจแล้ว คุณสามารถตรวจสอบรายการที่รวม หรือบวกเพิ่มรายการเสริมอื่นๆ เพิ่มเติมได้ด้านล่าง'
                    : 'กรุณาตรวจสอบและเลือกรายการค่าใช้จ่ายที่จำเป็นของการจัดงาน โดยระบบจะคำนวณตามจำนวนวันจัดพิธีให้โดยอัตโนมัติ'}
                </div>
              </div>

              {formData.quote_type === 'package' ? (
                <div className="space-y-6">
                  {/* Package Summary banner */}
                  <div className="p-5 bg-white dark:bg-[#15110a] border-2 border-amber-500/30 dark:border-amber-950 rounded-2xl max-w-xl mx-auto space-y-4 shadow-sm text-center">
                    <CheckCircle2 className="size-10 text-amber-500 mx-auto" />
                    <div>
                      <h4 className="font-bold text-amber-950 dark:text-amber-100 text-sm">เปิดใช้งานรูปแบบเหมาจ่าย (Package 38,500 บาท)</h4>
                      <p className="text-[10px] text-amber-700/60 dark:text-amber-400/60 mt-1">
                        ครอบคลุมโลงศพ, โลงเย็น, ผ้าบังสุกุล, เจ้าหน้าที่ศาลา/แม่บ้าน, ภัตตาหาร/ปานะ/ขนม, ซองถวายพระสงฆ์ครบถ้วน พร้อมของแถมดอกไม้จันทน์วันเผา และกาแฟโอวัลตินทุกคืน
                      </p>
                    </div>

                    {/* Configure package options directly inside Phase 2 banner */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left p-3.5 rounded-xl bg-amber-500/5 dark:bg-amber-950/20 border border-dashed border-amber-200/60 dark:border-amber-900/60">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-amber-800 dark:text-amber-400">ข้าวกล่องวันเผา (รวมในแพ็กเกจ):</label>
                        <select
                          value={formData.package_rice_box_option || '50_100'}
                          onChange={(e) => setFormData({ ...formData, package_rice_box_option: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs rounded-md border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer font-bold"
                        >
                          <option value="50_100">50 กล่อง (กล่องละ 100 บาท)</option>
                          <option value="100_50">100 กล่อง (กล่องละ 50 บาท)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-amber-800 dark:text-amber-400">ค่านิมนต์สวดเพิ่ม (บาท/คืน):</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.package_extra_night_rate || 10000}
                          onChange={(e) => setFormData({ ...formData, package_extra_night_rate: Number(e.target.value) })}
                          className="w-full px-2.5 py-1.5 text-xs rounded-md border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-1 focus:ring-amber-500 font-bold"
                        />
                      </div>
                    </div>
                    
                    <div className="text-left bg-amber-500/5 p-3.5 rounded-xl border border-amber-100 dark:border-amber-950 text-[10px] text-amber-950 dark:text-amber-300 space-y-1.5">
                      <p className="font-bold text-amber-950 dark:text-amber-100 text-xs border-b border-amber-200/40 pb-1 mb-1.5">💰 ยอดเงินคิดเหมาจ่าย:</p>
                      <p>• แพ็กเกจเริ่มต้น (1 คืน 2 วัน): <span className="font-bold text-amber-600">฿38,500</span></p>
                      {Math.max(1, Number(formData.num_days || 2) - 1) > 1 && (
                        <p>• เพิ่มเติมคืนสวดบำเพ็ญกุศล ({Math.max(1, Number(formData.num_days || 2) - 1) - 1} คืนเพิ่มเติม x ฿{(formData.package_extra_night_rate || 10000).toLocaleString()}): <span className="font-bold text-amber-600">฿{((Math.max(1, Number(formData.num_days || 2) - 1) - 1) * (formData.package_extra_night_rate || 10000)).toLocaleString()}</span></p>
                      )}
                      {(() => {
                        const selectedSala = salas.find(s => s.id === formData.sala_id);
                        const isSala1 = selectedSala?.short_name?.trim() === 'ศาลา 1';
                        return isSala1 && selectedSala && (
                          <p>• ค่าบำรุงสถานที่ส่วนเพิ่ม ({selectedSala.short_name} วันละ ฿1,000 x {formData.num_days} วัน): <span className="font-bold text-amber-600">฿{(1000 * Number(formData.num_days || 2)).toLocaleString()}</span></p>
                        );
                      })()}
                      <p className="border-t border-amber-200/40 pt-1.5 font-bold text-amber-950 dark:text-amber-100 text-xs flex justify-between">
                        <span>ยอดคำนวณสุทธิ:</span>
                        <span>฿{calculateTotal().toLocaleString('th-TH')} บาท</span>
                      </p>
                    </div>
                  </div>

                  {/* Add Optional custom database items for package */}
                  <div className="p-4 bg-white dark:bg-[#15110a] border border-amber-250/20 rounded-2xl space-y-3">
                    <h4 className="font-bold text-xs text-amber-900 dark:text-amber-300 flex items-center gap-1.5 font-heading">
                      <Plus className="size-4 text-amber-500" />
                      ต้องการเพิ่มรายการเสริมนอกเหนือจากแพ็กเกจ (Optional Extra)
                    </h4>
                    <div className="divide-y divide-gray-100 dark:divide-zinc-900 max-h-[220px] overflow-y-auto pr-1">
                      {costItems.filter(item => !isAlreadyIncludedInPackage(item.name)).map(item => {
                        const selection = selectedItemsMap[item.id] || { checked: false, quantity: 1 };
                        return (
                          <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={selection.checked}
                                onChange={() => handleToggleItem(item.id)}
                                className="rounded border-amber-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                              />
                              <div>
                                <div className="font-bold text-amber-950 dark:text-amber-150">{item.name}</div>
                                <div className="text-[10px] text-amber-600/60 dark:text-amber-500/40">฿{item.amount.toLocaleString()} / หน่วย</div>
                              </div>
                            </label>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] text-amber-700/65">จำนวน:</span>
                              <input
                                type="number"
                                min="1"
                                value={selection.quantity}
                                disabled={!selection.checked}
                                onChange={(e) => handleUpdateQty(item.id, Number(e.target.value))}
                                className="w-12 text-center p-1 py-0.5 rounded border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 disabled:opacity-40"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Required Template and DB items */}
                  <div className="p-4 bg-white dark:bg-[#15110a] border-2 border-rose-500/20 dark:border-rose-500/10 rounded-2xl space-y-3">
                    <h4 className="font-bold text-xs text-rose-600 flex items-center gap-1.5 font-heading">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      รายการจัดงานที่จำเป็น (Funeral Defaults)
                    </h4>
                    <div className="divide-y divide-gray-100 dark:divide-zinc-900 max-h-[350px] overflow-y-auto pr-1">
                      {/* Standard calculated items (required only) */}
                      {getNormalModeItems().filter(item => item.category === 'required' && (item.id !== 'norm-sala' || !formData.sala_id)).map(item => {
                        const selection = selectedItemsMap[item.id] || { checked: false, quantity: 1 };
                        return (
                          <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={selection.checked}
                                onChange={() => handleToggleItem(item.id)}
                                className="rounded border-amber-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                              />
                              <div>
                                <div className="font-bold text-amber-950 dark:text-amber-150">{item.name}</div>
                                <div className="text-[10px] text-amber-600/60 dark:text-amber-500/40">
                                  ฿{item.amount.toLocaleString()} {item.id.includes('sala') || item.id.includes('maid') || item.id.includes('staff') ? '/ คืน' : '/ หน่วย'}
                                </div>
                              </div>
                            </label>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] text-amber-700/65">จำนวน:</span>
                              <span className="w-10 text-center font-bold text-amber-950 dark:text-amber-100">
                                {selection.quantity}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {/* Note: required items come from getNormalModeItems() which already reads from DB */}
                    </div>
                  </div>

                  {/* Optional Custom Database items list */}
                  <div className="p-4 bg-white dark:bg-[#15110a] border-2 border-emerald-500/20 dark:border-emerald-500/10 rounded-2xl space-y-3">
                    <h4 className="font-bold text-xs text-emerald-600 flex items-center gap-1.5 font-heading">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      รายการค่าใช้จ่ายเสริม (Optional Cost)
                    </h4>
                    <div className="divide-y divide-gray-100 dark:divide-zinc-900 max-h-[350px] overflow-y-auto pr-1">
                      {/* Optional items: template items (น้ำดื่ม, น้ำแข็ง) + DB optional items (ชุดเก็บอัฐิ, ค่าจัดทำเฮือนตาน, ฯลฯ) */}
                      {/* Template optional items from getNormalModeItems */}
                      {getNormalModeItems().filter(ci => ci.category === 'optional').map(item => {
                        const selection = selectedItemsMap[item.id] || { checked: false, quantity: 1 };
                        return (
                          <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={selection.checked}
                                onChange={() => handleToggleItem(item.id)}
                                className="rounded border-amber-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                              />
                              <div>
                                <div className="font-bold text-amber-950 dark:text-amber-150">{item.name}</div>
                                <div className="text-[10px] text-amber-600/60 dark:text-amber-500/40">฿{item.amount.toLocaleString()} / หน่วย</div>
                              </div>
                            </label>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] text-amber-700/65">จำนวน:</span>
                              <input
                                type="number"
                                min="1"
                                value={selection.quantity}
                                disabled={!selection.checked}
                                onChange={(e) => handleUpdateQty(item.id, Number(e.target.value))}
                                className="w-14 text-center p-1 py-0.5 rounded border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 disabled:opacity-40"
                              />
                            </div>
                          </div>
                        );
                      })}

                      {/* DB optional items — only extras NOT already covered by normal mode template */}
                      {costItems.filter(ci => {
                        const n = ci.name.toLowerCase().replace(/\s+/g, '');
                        // Skip sala maintenance items (if sala already chosen from step 1)
                        if (formData.sala_id && isSalaMaintenanceItem(ci.name)) return false;
                        // Skip all items that are already in the template (Funeral Defaults or template Optional)
                        if (n.includes('น้ำดื่ม') || n.includes('น้ำแข็ง')) return false;
                        if (n.includes('น้ำปานะ') || n.includes('ชุดเก็บอัฐิ')) return false;
                        if (n.includes('บังสุกุล') || n.includes('กัณฑ์เทศน์')) return false;
                        if (n.includes('สวยดอก') || n.includes('สัปเหร่อ')) return false;
                        if (n.includes('ภัตตาหาร')) return false;
                        if (n.includes('แม่บ้าน')) return false;
                        if (n.includes('เจ้าหน้าที่ศาลา')) return false;
                        if (n.includes('โลงเย็น')) return false;
                        return true;
                      }).map(item => {
                        const selection = selectedItemsMap[item.id] || { checked: false, quantity: 1 };
                        return (
                          <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={selection.checked}
                                onChange={() => handleToggleItem(item.id)}
                                className="rounded border-amber-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                              />
                              <div>
                                <div className="font-bold text-amber-950 dark:text-amber-150">{item.name}</div>
                                <div className="text-[10px] text-amber-600/60 dark:text-amber-500/40">฿{item.amount.toLocaleString()} / หน่วย</div>
                              </div>
                            </label>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] text-amber-700/65">จำนวน:</span>
                              <input
                                type="number"
                                min="1"
                                value={selection.quantity}
                                disabled={!selection.checked}
                                onChange={(e) => handleUpdateQty(item.id, Number(e.target.value))}
                                className="w-14 text-center p-1 py-0.5 rounded border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 disabled:opacity-40"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Running Total Summary Card */}
              <div className="bg-amber-500/5 dark:bg-[#1a150e] border border-amber-200/50 dark:border-amber-950 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h4 className="font-heading text-xs font-bold text-amber-800 dark:text-amber-400">
                    สรุปใบเสนอราคา: คุณ {formData.customer_name}
                  </h4>
                  <p className="text-[10px] text-amber-700/50 dark:text-amber-400/50 mt-0.5">
                    งาน {getEventTypeLabel(formData.event_type || 'funeral')} ({formData.num_days} วัน)
                    {formData.sala_id && ` / ${salas.find(s => s.id === formData.sala_id)?.short_name}`}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[9px] block text-amber-600/50 dark:text-amber-400/50 font-semibold uppercase">Total Amount</span>
                    <span className="text-xl font-bold font-heading text-amber-950 dark:text-amber-100">
                      ฿{calculateTotal().toLocaleString('th-TH')}
                    </span>
                  </div>

                  {/* Status select for new quotation */}
                  <div className="flex items-center gap-1.5 bg-white dark:bg-[#110e08] p-1.5 rounded-lg border border-amber-200 dark:border-amber-950 text-xs">
                    <span className="text-[10px] text-amber-750 font-bold">สถานะเริ่มต้น:</span>
                    <select
                      value={formData.status || 'draft'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="text-[10px] outline-none border-none bg-transparent cursor-pointer font-bold text-amber-950 dark:text-amber-100"
                    >
                      <option value="draft">ร่างใบเสนอราคา (Draft)</option>
                      <option value="sent">ส่งข้อเสนอให้ลูกค้า (Sent)</option>
                      <option value="approved">ได้รับการยืนยัน (Approved)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Step Buttons */}
              <div className="pt-2 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormPhase(1)}
                  className="flex-1 border-amber-200 text-amber-950 hover:bg-amber-50/50 dark:border-amber-950/80 dark:text-amber-350 dark:hover:bg-amber-950/20 py-5 text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ChevronLeft className="size-4" />
                  <span>ย้อนกลับ</span>
                </Button>
                <Button
                  onClick={handleSaveQuotation}
                  disabled={isSaving}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-5 rounded-xl border-none shadow-md shadow-amber-500/10 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>กำลังจัดทำใบเสนอราคา...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" />
                      <span>บันทึกใบเสนอราคา</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
