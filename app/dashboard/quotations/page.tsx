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

  // Form wizard state (Phase 1 & Phase 2)
  const [formPhase, setFormPhase] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<Partial<Quotation>>({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    event_type: 'funeral',
    num_days: 1,
    sala_id: '',
    notes: '',
    status: 'draft'
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

  // Load all data
  const loadData = async () => {
    setLoading(true);
    try {
      const [qList, cList, sList] = await Promise.all([
        db.quotations.list(),
        db.costItems.list(),
        db.salas.list()
      ]);
      setQuotations(qList);
      setCostItems(cList.filter(item => item.is_active));
      setSalas(sList.filter(sala => sala.is_active));
    } catch (err: any) {
      showAlert('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถโหลดข้อมูลระบบใบเสนอราคาได้', 'destructive');
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

  // Switch to Create Mode
  const handleOpenCreate = () => {
    setFormData({
      customer_name: '',
      customer_phone: '',
      customer_address: '',
      event_type: 'funeral',
      num_days: 1,
      sala_id: salas.length > 0 ? salas[0].id : '',
      notes: '',
      status: 'draft'
    });

    // Initialize items: all "required" items are checked by default
    const initialMap: Record<string, { checked: boolean; quantity: number }> = {};
    costItems.forEach(item => {
      initialMap[item.id] = {
        checked: item.category === 'required',
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
    setSelectedItemsMap(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        checked: !prev[itemId]?.checked
      }
    }));
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

  // Calculate Running Totals
  const calculateTotal = () => {
    let total = 0;
    costItems.forEach(item => {
      const selection = selectedItemsMap[item.id];
      if (selection?.checked) {
        total += item.amount * selection.quantity;
      }
    });
    // Add Sala cost if any (Multiply by days)
    // For now, let's assume Sala booking fee is added as a general costItem, or calculated based on num_days.
    // The reference project may not have a special sala multiplier unless added manually as a costItem.
    // We will multiply the line items by quantity. If they want it to scale with num_days, they can adjust the quantity.
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

      if (lineItems.length === 0) {
        showAlert('ไม่มีรายการค่าใช้จ่าย', 'กรุณาเลือกอย่างน้อย 1 รายการค่าใช้จ่าย', 'warning');
        setIsSaving(false);
        return;
      }

      const totalAmount = lineItems.reduce((acc, curr) => acc + curr.subtotal, 0);

      const quotationToSave: Quotation = {
        id: `qt-${Date.now()}`,
        quotation_no: nextNo,
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
        created_at: new Date().toISOString()
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
    setTimeout(() => {
      window.print();
    }, 100);
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
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
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
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      ` }} />

      {/* --- PRINT TEMPLATE --- */}
      {selectedQuotation && (
        <div id="print-wrapper" className="hidden print:block p-8 space-y-6 font-sans text-black bg-white">
          <div className="text-center space-y-1.5 pb-4 border-b border-gray-300">
            <h1 className="text-xl font-bold">ใบเสนอราคา / รายการจัดงานพิธี</h1>
            <p className="text-sm font-semibold">วัดศรีสว่างธรรมาราม</p>
            <p className="text-[10px] text-gray-500">ต.ในเมือง อ.เมือง จ.ขอนแก่น 40000</p>
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
              {selectedQuotation.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="p-2 border border-gray-300 text-center">{idx + 1}</td>
                  <td className="p-2 border border-gray-300">{item.name}</td>
                  <td className="p-2 border border-gray-300 text-right">฿{item.amount.toLocaleString('th-TH')}</td>
                  <td className="p-2 border border-gray-300 text-center">{item.quantity}</td>
                  <td className="p-2 border border-gray-300 text-right font-bold">฿{item.subtotal.toLocaleString('th-TH')}</td>
                </tr>
              ))}
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

          {/* Signature Grid */}
          <div className="grid grid-cols-2 gap-8 pt-12 text-center text-xs">
            <div className="space-y-12">
              <p>ลงชื่อ.......................................................... ผู้เสนอราคา<br />( เจ้าหน้าที่ฝ่ายกิจกรรมสงฆ์ )</p>
            </div>
            <div className="space-y-12">
              <p>ลงชื่อ.......................................................... ผู้รับใบเสนอราคา<br />( เจ้าภาพ / ผู้มีอำนาจตัดสินใจ )</p>
            </div>
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
                      min="1"
                      required
                      value={formData.num_days || 1}
                      onChange={(e) => setFormData({ ...formData, num_days: Math.max(1, Number(e.target.value)) })}
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
                  กรุณาตรวจสอบและคลิกเลือกเครื่องหมายถูกหน้าค่าใช้จ่ายที่ต้องการรวมในประมาณการครั้งนี้ 
                  คุณสามารถกำหนดจำนวนชิ้น (เช่น โลงศพ 1 ชิ้น, สวดอภิธรรม 3 คืน) เพื่อคำนวณราคายอดรวมได้ทันที
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Required list */}
                <div className="p-4 bg-white dark:bg-[#15110a] border-2 border-rose-500/20 dark:border-rose-500/10 rounded-2xl space-y-3">
                  <h4 className="font-bold text-xs text-rose-600 flex items-center gap-1.5 font-heading">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    รายการค่าใช้จ่ายจำเป็น (Required)
                  </h4>
                  <div className="divide-y divide-gray-100 dark:divide-zinc-900 max-h-[300px] overflow-y-auto pr-1">
                    {costItems.filter(ci => ci.category === 'required').map(item => {
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

                {/* Optional list */}
                <div className="p-4 bg-white dark:bg-[#15110a] border-2 border-emerald-500/20 dark:border-emerald-500/10 rounded-2xl space-y-3">
                  <h4 className="font-bold text-xs text-emerald-600 flex items-center gap-1.5 font-heading">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    รายการค่าใช้จ่ายเสริม (Optional)
                  </h4>
                  <div className="divide-y divide-gray-100 dark:divide-zinc-900 max-h-[300px] overflow-y-auto pr-1">
                    {costItems.filter(ci => ci.category === 'optional').map(item => {
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
