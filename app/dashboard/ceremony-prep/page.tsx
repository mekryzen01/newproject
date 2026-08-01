'use client';

import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  BookOpen, 
  Printer, 
  Sparkles,
  Info,
  ListTodo,
  FileText,
  Save,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { db, DBCeremonyTemplate, DBCeremonyPrep, InventoryItem } from '@/lib/db';
import { CustomDialog } from '@/components/ui/custom-dialog';

interface PrepItem {
  id: string;
  order: number;
  name: string;
  qty: number;
  prepared: boolean;
  collected: boolean;
  notes: string;
}

export default function CeremonyPrepPage() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<DBCeremonyTemplate[]>([]);
  const [prepSheets, setPrepSheets] = useState<DBCeremonyPrep[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string>('');
  const [settings, setSettings] = useState<any>(null);
  
  // Custom dialog and confirmation states
  const [alertState, setAlertState] = useState<{
    show: boolean;
    variant: 'success' | 'destructive' | 'warning' | 'info';
    title: string;
    description: string;
  } | null>(null);

  const [confirmState, setConfirmState] = useState<{
    show: boolean;
    variant?: 'success' | 'destructive' | 'warning' | 'info';
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);
  
  // Active states
  const [activeSheet, setActiveSheet] = useState<DBCeremonyPrep | null>(null);

  // Template creation state
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);

  // Prep sheet creation state
  const [newSheetName, setNewSheetName] = useState('');
  const [selectedTemplateForNewSheet, setSelectedTemplateForNewSheet] = useState<string>('');

  // Item inputs state
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState<number>(1);
  const [newItemNotes, setNewItemNotes] = useState('');

  // Load everything on mount
  const loadData = async () => {
    setLoading(true);
    try {
      const [tplList, sheetList, config, invList] = await Promise.all([
        db.ceremonyTemplates.list(),
        db.ceremonyPreps.list(),
        db.settings.get(),
        db.inventory.list()
      ]);
      setTemplates(tplList);
      setPrepSheets(sheetList);
      setSettings(config);
      setInventoryItems(invList || []);

      // Select first sheet by default if none selected or if previously selected is missing
      if (sheetList.length > 0) {
        const previousId = localStorage.getItem('temple_selected_prep_id');
        const matched = sheetList.find(s => s.id === previousId) || sheetList[0];
        setSelectedSheetId(matched.id);
        setActiveSheet(matched);
      } else {
        setSelectedSheetId('');
        setActiveSheet(null);
      }
    } catch (e) {
      console.error('Failed to load ceremony preparation data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Set active sheet whenever selection changes
  const handleSelectSheet = (id: string) => {
    const matched = prepSheets.find(s => s.id === id) || null;
    setSelectedSheetId(id);
    setActiveSheet(matched);
    if (id) {
      localStorage.setItem('temple_selected_prep_id', id);
    } else {
      localStorage.removeItem('temple_selected_prep_id');
    }
  };

  // Helper to save active sheet updates directly to database
  const saveSheetToDB = async (updatedSheet: DBCeremonyPrep) => {
    try {
      const result = await db.ceremonyPreps.save(updatedSheet);
      // Update local state list
      setPrepSheets(prev => prev.map(s => s.id === result.id ? result : s));
      if (selectedSheetId === result.id) {
        setActiveSheet(result);
      }
    } catch (e) {
      console.error('Failed to save prep sheet update', e);
    }
  };

  // Add sheet (Create new preparation sheet)
  const handleCreateSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSheetName.trim()) return;

    let items: PrepItem[] = [];

    // Pre-populate items if template is selected
    if (selectedTemplateForNewSheet) {
      const tpl = templates.find(t => t.id === selectedTemplateForNewSheet);
      if (tpl && Array.isArray(tpl.items)) {
        items = tpl.items.map((item: any, idx: number) => ({
          id: `item-${idx}-${Date.now()}`,
          order: item.order || idx + 1,
          name: item.name,
          qty: item.qty || 1,
          prepared: false,
          collected: false,
          notes: item.notes || ''
        }));
      }
    }

    const newSheet: DBCeremonyPrep = {
      id: `prep-${Date.now()}`,
      name: newSheetName.trim(),
      items: items
    };

    try {
      const result = await db.ceremonyPreps.save(newSheet);
      setPrepSheets(prev => [result, ...prev]);
      setSelectedSheetId(result.id);
      setActiveSheet(result);
      localStorage.setItem('temple_selected_prep_id', result.id);
      
      setNewSheetName('');
      setSelectedTemplateForNewSheet('');
    } catch (e) {
      setAlertState({
        show: true,
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาด',
        description: 'เกิดข้อผิดพลาดในการบันทึกใบเตรียมงานใหม่'
      });
    }
  };

  // Delete active sheet
  const handleDeleteSheet = async () => {
    if (!activeSheet) return;
    setConfirmState({
      show: true,
      variant: 'destructive',
      title: 'ยืนยันการลบใบเตรียมงาน',
      description: `คุณแน่ใจว่าต้องการลบใบจัดเตรียมงาน "${activeSheet.name}" หรือไม่? ข้อมูลทั้งหมดจะถูกลบออกจากฐานข้อมูลระบบอย่างถาวร`,
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await db.ceremonyPreps.delete(activeSheet.id);
          const remaining = prepSheets.filter(s => s.id !== activeSheet.id);
          setPrepSheets(remaining);
          if (remaining.length > 0) {
            setSelectedSheetId(remaining[0].id);
            setActiveSheet(remaining[0]);
            localStorage.setItem('temple_selected_prep_id', remaining[0].id);
          } else {
            setSelectedSheetId('');
            setActiveSheet(null);
            localStorage.removeItem('temple_selected_prep_id');
          }
          setAlertState({
            show: true,
            variant: 'success',
            title: 'ลบสำเร็จ',
            description: 'ลบใบจัดเตรียมงานเรียบร้อยแล้ว'
          });
        } catch (e) {
          setAlertState({
            show: true,
            variant: 'destructive',
            title: 'ลบล้มเหลว',
            description: 'ไม่สามารถลบใบจัดเตรียมงานนี้ได้'
          });
        }
      }
    });
  };

  // Add item to active sheet
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSheet || !newItemName.trim()) return;

    const currentItems = Array.isArray(activeSheet.items) ? (activeSheet.items as PrepItem[]) : [];
    const nextOrder = currentItems.length > 0 ? Math.max(...currentItems.map(i => i.order)) + 1 : 1;

    const newItem: PrepItem = {
      id: `item-custom-${Date.now()}`,
      order: nextOrder,
      name: newItemName.trim(),
      qty: newItemQty,
      prepared: false,
      collected: false,
      notes: newItemNotes.trim()
    };

    const updatedSheet = {
      ...activeSheet,
      items: [...currentItems, newItem]
    };

    await saveSheetToDB(updatedSheet);
    setNewItemName('');
    setNewItemQty(1);
    setNewItemNotes('');
  };

  // Remove item from active sheet
  const handleRemoveItem = async (itemId: string) => {
    if (!activeSheet) return;
    const currentItems = Array.isArray(activeSheet.items) ? (activeSheet.items as PrepItem[]) : [];
    const filtered = currentItems.filter(item => item.id !== itemId);
    
    // Re-index orders
    const updatedItems = filtered.map((item, idx) => ({
      ...item,
      order: idx + 1
    }));

    const updatedSheet = {
      ...activeSheet,
      items: updatedItems
    };

    await saveSheetToDB(updatedSheet);
  };

  // Toggle item boolean values (prepared or collected)
  const handleToggleStatus = async (itemId: string, field: 'prepared' | 'collected') => {
    if (!activeSheet) return;
    const currentItems = Array.isArray(activeSheet.items) ? (activeSheet.items as PrepItem[]) : [];
    const updatedItems = currentItems.map(item => 
      item.id === itemId ? { ...item, [field]: !item[field] } : item
    );

    const updatedSheet = {
      ...activeSheet,
      items: updatedItems
    };

    await saveSheetToDB(updatedSheet);
  };

  // Update item field values inline
  const handleUpdateField = async (itemId: string, field: 'name' | 'qty' | 'notes', value: any) => {
    if (!activeSheet) return;
    const currentItems = Array.isArray(activeSheet.items) ? (activeSheet.items as PrepItem[]) : [];
    const updatedItems = currentItems.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    );

    const updatedSheet = {
      ...activeSheet,
      items: updatedItems
    };

    // Save locally immediately to avoid lag, then write to DB (since standard React input onChange triggers this, we could bounce or save on blur, but let's update list in DB on every change)
    // To make input typing smooth, we update the state list immediately first
    setPrepSheets(prev => prev.map(s => s.id === activeSheet.id ? updatedSheet : s));
    setActiveSheet(updatedSheet);

    // Save to DB
    await db.ceremonyPreps.save(updatedSheet);
  };

  // Save current checklist items as template
  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSheet || !newTemplateName.trim()) return;

    const currentItems = Array.isArray(activeSheet.items) ? (activeSheet.items as PrepItem[]) : [];
    const templateItems = currentItems.map(item => ({
      order: item.order,
      name: item.name,
      qty: item.qty,
      notes: item.notes
    }));

    const newTemplate: DBCeremonyTemplate = {
      id: `tpl-${Date.now()}`,
      name: newTemplateName.trim(),
      description: newTemplateDesc.trim(),
      items: templateItems
    };

    try {
      const result = await db.ceremonyTemplates.save(newTemplate);
      setTemplates(prev => [...prev, result]);
      setNewTemplateName('');
      setNewTemplateDesc('');
      setIsCreatingTemplate(false);
      setAlertState({
        show: true,
        variant: 'success',
        title: 'บันทึกแม่แบบสำเร็จ',
        description: `บันทึกแม่แบบพิธี "${result.name}" เข้าฐานข้อมูลสำเร็จ!`
      });
    } catch (e) {
      setAlertState({
        show: true,
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาด',
        description: 'เกิดข้อผิดพลาดในการบันทึกแม่แบบ'
      });
    }
  };

  // Apply a template directly to the active sheet items
  const handleApplyTemplateToSheet = async (tpl: DBCeremonyTemplate) => {
    if (!activeSheet) return;
    setConfirmState({
      show: true,
      variant: 'warning',
      title: 'ดึงรายการจากแม่แบบ',
      description: `คุณต้องการดึงรายการในแม่แบบ "${tpl.name}" มาบันทึกใส่ใบเตรียมงาน "${activeSheet.name}" หรือไม่? (การดำเนินการนี้จะลบรายการเตรียมของในใบงานปัจจุบันทิ้งทั้งหมด)`,
      onConfirm: async () => {
        setConfirmState(null);
        const templateItems = Array.isArray(tpl.items) ? tpl.items : [];
        const loadedItems: PrepItem[] = templateItems.map((item: any, idx: number) => ({
          id: `item-${idx}-${Date.now()}`,
          order: item.order || idx + 1,
          name: item.name,
          qty: item.qty || 1,
          prepared: false,
          collected: false,
          notes: item.notes || ''
        }));

        const updatedSheet = {
          ...activeSheet,
          items: loadedItems
        };

        await saveSheetToDB(updatedSheet);
        setAlertState({
          show: true,
          variant: 'success',
          title: 'ดึงแม่แบบสำเร็จ',
          description: 'ดึงรายการจัดเตรียมเข้าใบงานเรียบร้อยแล้ว'
        });
      }
    });
  };

  // Delete a template from database
  const handleDeleteTemplate = async (id: string, name: string) => {
    setConfirmState({
      show: true,
      variant: 'destructive',
      title: 'ยืนยันการลบแม่แบบ',
      description: `คุณแน่ใจว่าต้องการลบแม่แบบพิธี "${name}" หรือไม่?`,
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await db.ceremonyTemplates.delete(id);
          setTemplates(prev => prev.filter(t => t.id !== id));
          setAlertState({
            show: true,
            variant: 'success',
            title: 'ลบแม่แบบสำเร็จ',
            description: 'ลบแม่แบบพิธีเรียบร้อยแล้ว'
          });
        } catch (e) {
          setAlertState({
            show: true,
            variant: 'destructive',
            title: 'เกิดข้อผิดพลาด',
            description: 'ไม่สามารถลบแม่แบบนี้ได้'
          });
        }
      }
    });
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-20 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 text-amber-500 animate-spin" />
        <p className="text-sm text-amber-800/40">กำลังโหลดข้อมูลระบบจัดเตรียมพิธีการ...</p>
      </div>
    );
  }

  const activeItems = activeSheet && Array.isArray(activeSheet.items) ? (activeSheet.items as PrepItem[]) : [];
  const totalItems = activeItems.length;
  const completedItems = activeItems.filter(item => item.prepared && item.collected).length;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <div className="space-y-6">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          form,
          .print-none,
          .print\\:hidden,
          .no-print,
          aside,
          header,
          nav,
          button,
          iframe,
          footer {
            display: none !important;
            height: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
          }
        }
      `}} />
      {/* Custom Alerts */}
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

      {/* Custom Confirmation Modals */}
      {confirmState && confirmState.show && (
        <CustomDialog
          show={confirmState.show}
          type="confirm"
          variant={confirmState.variant || 'destructive'}
          title={confirmState.title}
          description={confirmState.description}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
          confirmText="ยืนยัน"
          cancelText="ยกเลิก"
        />
      )}
      
      {/* Header section (Hidden on print) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold font-heading text-amber-900 dark:text-amber-200 flex items-center gap-2">
            <Sparkles className="size-6 text-amber-500 animate-pulse" />
            ระบบจัดเตรียมพิธีการ
          </h2>
          <p className="text-xs text-amber-700/50 dark:text-amber-400/50">
            ระบบลงทะเบียนเตรียมเครื่องประกอบพิธีกรรมสำหรับกิจกรรมต่างๆ ของวัด จัดเก็บข้อมูลร่วมกันบนฐานข้อมูลกลางคลาวด์
          </p>
        </div>
        <div className="flex gap-2">
          {activeSheet && activeItems.length > 0 && (
            <Button
              onClick={handlePrint}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-5 px-5 rounded-xl flex items-center gap-1.5 border-none shadow-md shadow-amber-600/10 cursor-pointer"
            >
              <Printer className="size-4" />
              พิมพ์รายการเตรียมของ
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Sheet & Template lists (Hidden on print) */}
        <div className="space-y-6 lg:col-span-1 print:hidden">
          
          {/* Prep Sheet Select and Add Card */}
          <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 p-6 shadow-md shadow-amber-100/5 space-y-4">
            <h3 className="font-bold text-sm text-amber-950 dark:text-amber-100 flex items-center gap-2 border-b border-amber-100 dark:border-amber-950/40 pb-2">
              <FileText className="size-4 text-amber-600 dark:text-amber-500" />
              1. เลือกใบเตรียมงานพิธี
            </h3>
            
            {/* Sheet Dropdown */}
            {prepSheets.length > 0 ? (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-amber-900/60 dark:text-amber-400/60">ใบจัดเตรียมงานที่เปิดอยู่</label>
                <select
                  value={selectedSheetId}
                  onChange={(e) => handleSelectSheet(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-amber-250 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 cursor-pointer outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  {prepSheets.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({Array.isArray(s.items) ? s.items.length : 0} รายการ)
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-[11px] text-amber-800/40 italic text-center">ยังไม่มีใบเตรียมงานในระบบ กรุณาสร้างที่ช่องด้านล่าง</p>
            )}

            {/* Create Sheet Form */}
            <form onSubmit={handleCreateSheet} className="pt-3 border-t border-amber-100 dark:border-amber-950/20 space-y-3">
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">+ สร้างใบจัดเตรียมงานใหม่</h4>
              <div className="space-y-1">
                <input
                  type="text"
                  required
                  value={newSheetName}
                  onChange={(e) => setNewSheetName(e.target.value)}
                  placeholder="ระบุชื่องาน เช่น สวดศพคุณแม่สมศรี"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none"
                />
              </div>
              <div className="space-y-1">
                <select
                  value={selectedTemplateForNewSheet}
                  onChange={(e) => setSelectedTemplateForNewSheet(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-250 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 cursor-pointer outline-none"
                >
                  <option value="">-- ไม่ใช้แม่แบบ (สร้างใบเปล่า) --</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>
                      ดึงของจากแม่แบบ: {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2 rounded-lg cursor-pointer"
              >
                สร้างใบจัดเตรียมงาน
              </Button>
            </form>
          </div>

          {/* Templates list card */}
          <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 p-6 shadow-md shadow-amber-100/5">
            <div className="flex justify-between items-center mb-4 border-b border-amber-100 dark:border-amber-950/40 pb-2">
              <h3 className="font-bold text-sm text-amber-950 dark:text-amber-100 flex items-center gap-2">
                <BookOpen className="size-4 text-amber-600 dark:text-amber-500" />
                แม่แบบศาสนพิธีของวัด
              </h3>
              {activeSheet && activeItems.length > 0 && (
                <button
                  onClick={() => setIsCreatingTemplate(!isCreatingTemplate)}
                  className="text-xs font-bold text-amber-600 hover:underline cursor-pointer border-none bg-transparent"
                >
                  {isCreatingTemplate ? 'ปิดร่าง' : '+ เซฟใบปัจจุบันเป็นแม่แบบ'}
                </button>
              )}
            </div>

            {/* Template Creation Form */}
            {isCreatingTemplate && activeSheet && (
              <form onSubmit={handleCreateTemplate} className="mb-5 p-4 bg-amber-50/20 dark:bg-amber-950/10 rounded-xl border border-amber-150/40 dark:border-amber-950/50 space-y-3 animate-fade-in">
                <p className="text-[10px] text-amber-800/70 dark:text-amber-400/70 font-sans">
                  คัดลอก {activeItems.length} รายการของใบ "{activeSheet.name}" มาจัดตั้งเป็นชุดแม่แบบ
                </p>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-amber-900/80 dark:text-amber-300">ชื่อแม่แบบพิธี</label>
                  <input
                    type="text"
                    required
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="เช่น แม่แบบสวดบ้าน, พิธีเทศน์มหาชาติ"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-amber-900/80 dark:text-amber-300">รายละเอียดคำอธิบาย</label>
                  <textarea
                    value={newTemplateDesc}
                    onChange={(e) => setNewTemplateDesc(e.target.value)}
                    placeholder="ระบุสิ่งของหลัก เช่น อาสนะ 9 ผืน พัดยศ ขันน้ำมนต์"
                    rows={2}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] py-2 rounded-lg cursor-pointer"
                  >
                    บันทึกแม่แบบ
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setIsCreatingTemplate(false)}
                    variant="outline"
                    className="flex-1 text-[10px] py-2 rounded-lg border-amber-200"
                  >
                    ยกเลิก
                  </Button>
                </div>
              </form>
            )}

            {/* Template lists */}
            {templates.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-amber-200/20 rounded-xl">
                <p className="text-xs text-amber-800/40">ยังไม่มีการบันทึกแม่แบบในระบบฐานข้อมูล</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-1">
                {templates.map(tpl => (
                  <div
                    key={tpl.id}
                    className="flex justify-between items-center p-3 rounded-xl border border-amber-100 dark:border-amber-950/60 bg-amber-50/5 hover:bg-amber-500/5 transition-colors"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="font-bold text-xs text-amber-950 dark:text-amber-250 truncate">
                        {tpl.name}
                      </div>
                      <div className="text-[9px] text-amber-800/60 dark:text-amber-500/40 line-clamp-1 font-sans">
                        {tpl.description || 'ไม่มีรายละเอียด'} • {Array.isArray(tpl.items) ? tpl.items.length : 0} ชิ้น
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {activeSheet && (
                        <button
                          onClick={() => handleApplyTemplateToSheet(tpl)}
                          className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-bold cursor-pointer border-none"
                        >
                          ดึงใช้
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteTemplate(tpl.id, tpl.name)}
                        className="p-1 rounded text-amber-800/30 hover:text-red-500 cursor-pointer border-none bg-transparent"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center/Right Column: Active Checklist Table */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Active sheet checklist */}
          {activeSheet ? (
            <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 p-6 shadow-md shadow-amber-100/5 print:border-none print:shadow-none print:p-0">
              
              {/* Screen Header Controls (Hidden on print) */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-amber-100 dark:border-amber-950/40 pb-4 print:hidden">
                <div>
                  <h3 className="font-extrabold text-lg text-amber-950 dark:text-amber-100 flex items-center gap-2">
                    <ListTodo className="size-5 text-amber-600 dark:text-amber-500 animate-bounce" />
                    ตารางจัดเตรียม: <span className="text-amber-600">{activeSheet.name}</span>
                  </h3>
                  <p className="text-[10px] text-amber-800/60 dark:text-amber-500/40 mt-0.5 font-sans">
                    จัดการสิ่งของเครื่องใช้ และอัปเดตสถานะการเตรียม-เก็บในวัด
                  </p>
                </div>
                <button
                  onClick={handleDeleteSheet}
                  className="text-xs font-bold text-red-500 hover:text-red-650 hover:underline cursor-pointer border-none bg-transparent shrink-0"
                >
                  ลบใบเตรียมงานนี้ทิ้ง
                </button>
              </div>

              {/* Print Only Header (Visible only on print) */}
              <div className="hidden print:block mb-8 text-center">
                <h1 className="text-2xl font-bold text-black font-heading mb-1.5">ใบตรวจสอบรายการเตรียมของศาสนพิธี</h1>
                <p className="text-sm text-gray-600">
                  {settings?.templeName || 'วัด'} • ชื่องานพิธี: <strong>{activeSheet.name}</strong> • วันที่จัดทำเอกสาร: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <div className="h-0.5 bg-black my-4" />
              </div>

              {/* Progress bar */}
              <div className="w-full bg-amber-50/50 dark:bg-amber-950/10 p-3 rounded-xl border border-amber-100 dark:border-amber-950/20 mb-6 flex flex-col sm:flex-row justify-between items-center gap-3 print:hidden print-none">
                <span className="text-xs font-bold text-amber-950 dark:text-amber-200">
                  ความคืบหน้าการจัดเตรียมและจัดเก็บสิ่งของ:
                </span>
                <div className="w-full sm:w-64 space-y-1 shrink-0">
                  <div className="flex justify-between text-[10px] font-bold text-amber-900 dark:text-amber-300">
                    <span>สถานะความสมบูรณ์</span>
                    <span>{progressPercent}% ({completedItems}/{totalItems})</span>
                  </div>
                  <div className="w-full bg-amber-200/20 dark:bg-amber-950/20 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Add Item Inline Form (Hidden on print) */}
              <form onSubmit={handleAddItem} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 bg-amber-50/20 dark:bg-amber-950/5 p-3 rounded-xl border border-amber-100 dark:border-amber-950/30 mb-6 print:hidden print-none">
                <div className="sm:col-span-6 space-y-1">
                  <label className="text-[10px] font-bold text-amber-850 dark:text-amber-350">ชื่อของ/เครื่องประกอบพิธี (พิมพ์เองหรือดึงจากคลัง)</label>
                  <input
                    type="text"
                    required
                    list="inventory-list"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="พิมพ์ค้นหาหรือเลือกจากคลัง..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none"
                  />
                  <datalist id="inventory-list">
                    {inventoryItems.map(item => (
                      <option key={item.id} value={item.name}>
                        {item.category ? `${item.category} • ` : ''}คงเหลือในคลัง: {item.available_qty} ชิ้น
                      </option>
                    ))}
                  </datalist>
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-amber-850 dark:text-amber-350">จำนวน (ชุด/ชิ้น)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none"
                  />
                </div>
                <div className="sm:col-span-3 space-y-1">
                  <label className="text-[10px] font-bold text-amber-850 dark:text-amber-350">หมายเหตุ</label>
                  <input
                    type="text"
                    value={newItemNotes}
                    onChange={(e) => setNewItemNotes(e.target.value)}
                    placeholder="ระบุคำกำกับเพิ่มเติม"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none"
                  />
                </div>
                <div className="sm:col-span-1 flex items-end justify-end">
                  <Button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2 px-2.5 rounded-lg flex items-center justify-center gap-1 border-none shadow-md shadow-amber-500/10 cursor-pointer h-[32px]"
                  >
                    <Plus className="size-4 shrink-0" />
                  </Button>
                </div>
              </form>

              {/* Checklist Table */}
              {activeItems.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-amber-200/20 rounded-xl bg-amber-50/5">
                  <ClipboardList className="size-12 mx-auto text-amber-200 dark:text-amber-900/35 mb-2.5 animate-pulse" />
                  <p className="text-xs text-amber-800/45">ยังไม่มีรายการสิ่งของที่จัดเตรียมสำหรับใบงานนี้</p>
                  <p className="text-[10px] text-amber-800/30 mt-1 print:hidden">ป้อนรายชื่อเครื่องประกอบพิธีด้านบนเพื่อเริ่มบันทึกฐานข้อมูล</p>
                </div>
              ) : (
                <div className="overflow-x-auto print:overflow-visible">
                  <table className="w-full text-left text-xs border-collapse border border-amber-200/30 dark:border-amber-950/30 print:border-black print:text-black">
                    <thead>
                      <tr className="bg-amber-50/50 dark:bg-amber-950/15 border-b border-amber-200/30 dark:border-amber-950/30 text-amber-800/60 dark:text-amber-500/65 font-bold print:bg-gray-150 print:text-black print:border-black">
                        <th className="py-3 px-2 text-center w-12 border-r border-amber-200/30 dark:border-amber-950/30 print:border-black">ลำดับ</th>
                        <th className="py-3 px-3 border-r border-amber-200/30 dark:border-amber-950/30 print:border-black">ชื่อสิ่งของเครื่องใช้</th>
                        <th className="py-3 px-3 text-center w-20 border-r border-amber-200/30 dark:border-amber-950/30 print:border-black">จำนวน</th>
                        <th className="py-3 px-3 text-center w-24 border-r border-amber-200/30 dark:border-amber-950/30 print:border-black">เตรียมแล้ว</th>
                        <th className="py-3 px-3 text-center w-24 border-r border-amber-200/30 dark:border-amber-950/30 print:border-black">เก็บมาแล้ว</th>
                        <th className="py-3 px-3">หมายเหตุ</th>
                        <th className="py-3 px-2 text-center w-12 print:hidden">ลบ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100/40 dark:divide-amber-950/20 print:divide-black">
                      {activeItems.map((item, idx) => (
                        <tr 
                          key={item.id} 
                          className={`hover:bg-amber-50/5 dark:hover:bg-amber-950/5 transition-colors print:hover:bg-transparent ${
                            item.prepared && item.collected ? 'opacity-65 bg-amber-500/2 dark:bg-amber-950/2' : ''
                          }`}
                        >
                          {/* 1. ลำดับ */}
                          <td className="py-3 px-2 text-center font-bold text-amber-900 dark:text-amber-400 border-r border-amber-100/50 dark:border-amber-950/30 print:border-black print:text-black">
                            {item.order || idx + 1}
                          </td>
                          
                          {/* 2. ชื่อของ */}
                          <td className="py-2.5 px-3 border-r border-amber-100/50 dark:border-amber-950/30 print:border-black">
                            <div className="flex flex-col">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => handleUpdateField(item.id, 'name', e.target.value)}
                                className="w-full bg-transparent border-none text-amber-950 dark:text-amber-100 font-semibold focus:outline-none focus:bg-amber-500/10 p-1 rounded font-sans print:p-0 print:font-normal print:text-black print:hidden animate-fade-in"
                              />
                              <span className="hidden print:inline">{item.name}</span>
                              {(() => {
                                const invItem = inventoryItems.find(inv => inv.name.trim().toLowerCase() === item.name.trim().toLowerCase());
                                if (!invItem) return null;
                                const isShortage = item.qty > invItem.available_qty;
                                return isShortage ? (
                                  <span className="text-[9px] bg-rose-100 dark:bg-rose-950/45 text-rose-800 dark:text-rose-350 px-1.5 py-0.5 rounded font-bold w-fit mt-1 print:hidden">
                                    ⚠️ ในคลังมีจำกัด (เหลือ {invItem.available_qty} ชิ้น)
                                  </span>
                                ) : (
                                  <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/45 text-emerald-800 dark:text-emerald-355 px-1.5 py-0.5 rounded font-bold w-fit mt-1 print:hidden">
                                    📦 มีในคลัง (คงเหลือ {invItem.available_qty} ชิ้น)
                                  </span>
                                );
                              })()}
                            </div>
                          </td>
                          
                          {/* 3. จำนวน */}
                          <td className="py-2.5 px-3 text-center border-r border-amber-100/50 dark:border-amber-950/30 print:border-black font-extrabold">
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => handleUpdateField(item.id, 'qty', Number(e.target.value))}
                              className="w-14 bg-transparent border-none text-center text-amber-950 dark:text-amber-100 font-extrabold focus:outline-none focus:bg-amber-500/10 p-1 rounded print:hidden"
                            />
                            <span className="hidden print:inline">{item.qty}</span>
                          </td>
                          
                          {/* 4. เตรียมแล้ว */}
                          <td className="py-2.5 px-3 text-center border-r border-amber-100/50 dark:border-amber-950/30 print:border-black">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(item.id, 'prepared')}
                              className="size-5 rounded-md border border-amber-400 dark:border-amber-600 flex items-center justify-center mx-auto bg-transparent hover:bg-amber-500/5 cursor-pointer print:hidden"
                            >
                              {item.prepared && <div className="size-3 rounded-[3px] bg-amber-500 animate-scale-up" />}
                            </button>
                            {/* Print Checkbox Box */}
                            <div className="hidden print:block size-4 border border-black mx-auto">
                              {item.prepared && <span className="text-[10px] leading-[14px] block text-center font-bold">✓</span>}
                            </div>
                          </td>
                          
                          {/* 5. เก็บมาแล้ว */}
                          <td className="py-2.5 px-3 text-center border-r border-amber-100/50 dark:border-amber-950/30 print:border-black">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(item.id, 'collected')}
                              className="size-5 rounded-md border border-amber-400 dark:border-amber-600 flex items-center justify-center mx-auto bg-transparent hover:bg-amber-500/5 cursor-pointer print:hidden"
                            >
                              {item.collected && <div className="size-3 rounded-[3px] bg-emerald-500 animate-scale-up" />}
                            </button>
                            {/* Print Checkbox Box */}
                            <div className="hidden print:block size-4 border border-black mx-auto">
                              {item.collected && <span className="text-[10px] leading-[14px] block text-center font-bold">✓</span>}
                            </div>
                          </td>
                          
                          {/* 6. หมายเหตุ */}
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={item.notes}
                              onChange={(e) => handleUpdateField(item.id, 'notes', e.target.value)}
                              placeholder="พิมพ์หมายเหตุ..."
                              className="w-full bg-transparent border-none text-amber-900/70 dark:text-amber-400 focus:outline-none focus:bg-amber-500/10 p-1 rounded text-xs print:p-0 print:text-black print:hidden"
                            />
                            <span className="hidden print:inline text-gray-700">{item.notes}</span>
                          </td>
                          
                          {/* Action delete (Hidden on print) */}
                          <td className="py-2.5 px-2 text-center print:hidden">
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-1 rounded text-amber-800/35 dark:text-amber-500/30 hover:text-red-500 cursor-pointer border-none bg-transparent"
                              title="ลบแถว"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 p-12 text-center shadow-md shadow-amber-100/5">
              <ClipboardList className="size-16 mx-auto text-amber-200 dark:text-amber-900/10 mb-4 animate-pulse" />
              <h3 className="font-bold text-amber-900 dark:text-amber-200 text-lg mb-2">ยังไม่ได้เลือกใบเตรียมงานพิธี</h3>
              <p className="text-xs text-amber-850/50 max-w-sm mx-auto leading-relaxed font-sans">
                คุณสามารถเลือกใบจัดเตรียมงานเดิมที่เก็บบันทึกไว้ในฐานข้อมูลวัด หรือกรอกชื่องานแล้วคลิกปุ่ม **"สร้างใบจัดเตรียมงานใหม่"** ด้านซ้ายมือเพื่อเริ่มต้นทำงานร่วมกัน
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
