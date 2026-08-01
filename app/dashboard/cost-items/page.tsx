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
  ArrowUpDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomDialog } from '@/components/ui/custom-dialog';
import { usePermission } from '@/lib/usePermission';
import { db, CostItem } from '@/lib/db';

export default function CostItemsManagement() {
  const { permissions } = usePermission();
  const [items, setItems] = useState<CostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<CostItem>>({});
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

  const showAlert = (title: string, description: string, variant: 'success' | 'destructive' | 'warning' | 'info' = 'info') => {
    setAlertState({
      show: true,
      title,
      description,
      variant
    });
  };

  // Load items from Supabase
  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await db.costItems.list();
      setItems(data);
    } catch (err: any) {
      showAlert('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถโหลดรายการค่าใช้จ่ายได้', 'destructive');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleOpenAddModal = () => {
    setCurrentItem({
      id: '',
      name: '',
      amount: 0,
      category: 'optional',
      description: '',
      is_active: true,
      sort_order: items.length > 0 ? Math.max(...items.map(i => i.sort_order || 0)) + 10 : 10
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: CostItem) => {
    setCurrentItem({ ...item });
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem.name?.trim()) {
      showAlert('ข้อมูลไม่ครบถ้วน', 'กรุณาระบุชื่อรายการค่าใช้จ่าย', 'warning');
      return;
    }
    if (currentItem.amount === undefined || currentItem.amount < 0) {
      showAlert('ข้อมูลไม่ถูกต้อง', 'กรุณาระบุจำนวนเงินให้ถูกต้อง', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const itemToSave: CostItem = {
        id: currentItem.id || `ci-${Date.now()}`,
        name: currentItem.name,
        amount: Number(currentItem.amount),
        category: currentItem.category as 'required' | 'optional',
        description: currentItem.description || '',
        is_active: currentItem.is_active !== false,
        sort_order: Number(currentItem.sort_order || 0)
      };

      await db.costItems.save(itemToSave);
      setIsModalOpen(false);
      showAlert('สำเร็จ', 'บันทึกรายการค่าใช้จ่ายเรียบร้อยแล้ว', 'success');
      loadItems();
    } catch (err: any) {
      showAlert('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถบันทึกรายการได้', 'destructive');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = (id: string) => {
    setConfirmState({
      show: true,
      title: 'ยืนยันการลบรายการ',
      description: 'คุณต้องการลบรายการค่าใช้จ่ายนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้',
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await db.costItems.delete(id);
          showAlert('สำเร็จ', 'ลบรายการค่าใช้จ่ายเรียบร้อยแล้ว', 'success');
          loadItems();
        } catch (err: any) {
          showAlert('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถลบรายการได้', 'destructive');
        }
      }
    });
  };

  const handleToggleActive = async (item: CostItem) => {
    try {
      const updatedItem = {
        ...item,
        is_active: !item.is_active
      };
      await db.costItems.save(updatedItem);
      loadItems();
    } catch (err: any) {
      showAlert('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถเปลี่ยนสถานะได้', 'destructive');
    }
  };

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
    
    if (categoryFilter === 'all') return matchesSearch;
    return matchesSearch && item.category === categoryFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading text-amber-900 dark:text-amber-200">
            จัดการรายการค่าใช้จ่ายมาตรฐาน
          </h2>
          <p className="text-xs text-amber-700/50 dark:text-amber-400/50">
            ตั้งค่าหมวดหมู่และราคาค่าใช้จ่ายเริ่มต้นสำหรับการออกใบเสนอราคา
          </p>
        </div>
        {permissions.canCreate && (
          <Button
            onClick={handleOpenAddModal}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-5 px-5 rounded-xl flex items-center gap-1.5 border-none shadow-md shadow-amber-500/10 cursor-pointer"
          >
            <Plus className="size-4" />
            เพิ่มรายการใหม่
          </Button>
        )}
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
          confirmText="ยืนยันการลบ"
          cancelText="ยกเลิก"
        />
      )}

      {/* Toolbar Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-[#15110a] p-4 rounded-xl border border-amber-200/40 dark:border-amber-950/30">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-700/40 dark:text-amber-500/30">
            <Search className="size-4" />
          </div>
          <input
            type="text"
            placeholder="ค้นหาชื่อรายการ, คำอธิบาย..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-amber-200/60 dark:border-amber-950 bg-amber-50/10 dark:bg-[#1a150e] text-amber-950 dark:text-amber-100 placeholder-amber-700/30 dark:placeholder-amber-500/20 text-xs outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-amber-800/70 dark:text-amber-400/70 shrink-0">หมวดหมู่:</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="py-2 px-3 rounded-lg border border-amber-200/60 dark:border-amber-950 bg-amber-50/10 dark:bg-[#1a150e] text-amber-950 dark:text-amber-100 text-xs outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
          >
            <option value="all">ทั้งหมด</option>
            <option value="required">รายการจำเป็น (Required)</option>
            <option value="optional">รายการเสริม (Optional)</option>
          </select>
        </div>
      </div>

      {/* Main Table Content */}
      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="size-8 text-amber-500 animate-spin" />
            <p className="text-xs font-bold text-amber-700/60 dark:text-amber-500/60">กำลังดึงข้อมูลค่าใช้จ่าย...</p>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#15110a] rounded-xl border border-amber-200/40 dark:border-amber-950/30">
          <AlertTriangle className="size-12 mx-auto text-amber-200 dark:text-amber-950/50 mb-3" />
          <p className="text-sm text-amber-800/50 dark:text-amber-500/40">ไม่พบข้อมูลตามเงื่อนไขที่ระบุ</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 overflow-hidden shadow-md shadow-amber-100/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-amber-500/10 border-b border-amber-200/30 dark:border-amber-950/30 text-amber-900 dark:text-amber-300 font-bold">
                  <th className="p-4 w-16 text-center">ลำดับ</th>
                  <th className="p-4">รายการค่าใช้จ่าย</th>
                  <th className="p-4 w-40 text-right">ราคาต่อหน่วย</th>
                  <th className="p-4 w-36 text-center">หมวดหมู่</th>
                  <th className="p-4 w-32 text-center">สถานะใช้งาน</th>
                  <th className="p-4 w-28 text-center">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100/50 dark:divide-amber-950/20">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-amber-50/20 dark:hover:bg-amber-950/10 transition-colors">
                    <td className="p-4 text-center font-semibold text-amber-800 dark:text-amber-400">
                      {item.sort_order}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-amber-950 dark:text-amber-100">{item.name}</div>
                      {item.description && (
                        <div className="text-[10px] text-amber-700/60 dark:text-amber-400/50 mt-0.5">{item.description}</div>
                      )}
                    </td>
                    <td className="p-4 text-right font-bold text-amber-950 dark:text-amber-100 text-sm">
                      ฿{item.amount.toLocaleString('th-TH')}
                    </td>
                    <td className="p-4 text-center">
                      {item.category === 'required' ? (
                        <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                          รายการจำเป็น
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          รายการเสริม
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggleActive(item)}
                        disabled={!permissions.canEdit}
                        className={`mx-auto w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${
                          item.is_active ? 'bg-emerald-500 justify-end' : 'bg-gray-300 dark:bg-zinc-800 justify-start'
                        } ${!permissions.canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span className="bg-white w-4 h-4 rounded-full shadow-md flex items-center justify-center">
                          {item.is_active && <Check className="size-3 text-emerald-600 font-bold" />}
                        </span>
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-1.5">
                        {permissions.canEdit && (
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 rounded-lg border border-amber-200/50 dark:border-amber-950 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 cursor-pointer"
                          >
                            <Edit className="size-4" />
                          </button>
                        )}
                        {permissions.canDelete && (
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 rounded-lg border border-rose-200/50 dark:border-rose-950 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 cursor-pointer"
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

      {/* Add / Edit Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/50 dark:border-amber-950/40 shadow-2xl w-full max-w-md overflow-hidden relative">
            {/* Modal Title Banner */}
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-sm font-heading">
                {currentItem.id ? 'แก้ไขรายการค่าใช้จ่าย' : 'เพิ่มรายการค่าใช้จ่ายใหม่'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white hover:text-amber-100 cursor-pointer p-1"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ชื่อรายการค่าใช้จ่าย *</label>
                <input
                  type="text"
                  required
                  value={currentItem.name || ''}
                  onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
                  placeholder="เช่น ค่าจัดดอกไม้หน้าศพ, ค่าเจ้าหน้าที่ศาลา"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* Amount */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ราคาต่อหน่วย (บาท) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={currentItem.amount === undefined ? '' : currentItem.amount}
                  onChange={(e) => setCurrentItem({ ...currentItem, amount: Number(e.target.value) })}
                  placeholder="0"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">หมวดหมู่ *</label>
                <select
                  value={currentItem.category || 'optional'}
                  onChange={(e) => setCurrentItem({ ...currentItem, category: e.target.value as 'required' | 'optional' })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                >
                  <option value="required">รายการจำเป็น (Required - รวมใบเสนอราคาตั้งต้น)</option>
                  <option value="optional">รายการเสริม (Optional - สามารถเลือกเพิ่มทีหลัง)</option>
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">คำอธิบายเพิ่มเติม</label>
                <textarea
                  value={currentItem.description || ''}
                  onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
                  placeholder="รายละเอียดเพิ่มเติมของราคานี้..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
                />
              </div>

              {/* Sort Order */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ลำดับการแสดงผล</label>
                <input
                  type="number"
                  value={currentItem.sort_order === undefined ? '' : currentItem.sort_order}
                  onChange={(e) => setCurrentItem({ ...currentItem, sort_order: Number(e.target.value) })}
                  placeholder="10"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 border-amber-200 text-amber-950 hover:bg-amber-50/50 dark:border-amber-950/80 dark:text-amber-350 dark:hover:bg-amber-950/20 py-5 text-xs font-bold cursor-pointer"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-5 text-xs font-bold border-none shadow-md shadow-amber-500/10 cursor-pointer"
                >
                  {isSaving ? (
                    <div className="flex items-center justify-center gap-1">
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>กำลังบันทึก...</span>
                    </div>
                  ) : (
                    'บันทึกข้อมูล'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
