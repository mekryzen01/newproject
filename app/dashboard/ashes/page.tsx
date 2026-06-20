'use client';

import React from 'react';
import {
  Archive,
  Search,
  Plus,
  Edit,
  Trash,
  X,
  User,
  Phone,
  Calendar,
  FileText,
  Loader2,
  Lock,
  Bookmark
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAshesController } from '@/app/Controllers/useAshesController';
import { CustomDialog } from '@/components/ui/custom-dialog';
import { usePermission } from '@/lib/usePermission';

export default function AshesManagement() {
  const { permissions } = usePermission();
  const {
    loading,
    search,
    setSearch,
    isModalOpen,
    setIsModalOpen,
    currentRecord,
    isSaving,
    alertState,
    confirmState,
    setConfirmState,
    handleOpenAddModal,
    handleOpenEditModal,
    handleDeleteRecord,
    handleSaveRecord,
    updateFormFields,
    filteredRecords
  } = useAshesController();

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading text-amber-900 dark:text-amber-200">
            ระบบทะเบียนฝากกระดูกและสถิตอัฐิ
          </h2>
          <p className="text-xs text-amber-700/50 dark:text-amber-400/50">
            จัดการตู้/ล็อกที่บรรจุอัฐิ ข้อมูลผู้วายชนม์ รายนามญาติผู้ติดต่อประสานงาน และรายละเอียดทำบุญอุทิศกุศลประจำปี
          </p>
        </div>
        {permissions.canCreate && (
          <Button
            onClick={handleOpenAddModal}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-5 px-5 rounded-xl flex items-center gap-1.5 border-none shadow-md shadow-amber-500/10 cursor-pointer"
          >
            <Plus className="size-4" />
            บันทึกฝากกระดูกใหม่
          </Button>
        )}
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

      {/* Search filter */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-[#15110a] p-4 rounded-xl border border-amber-200/40 dark:border-amber-950/30">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-700/40 dark:text-amber-500/30">
            <Search className="size-4" />
          </div>
          <input
            type="text"
            placeholder="ค้นชื่อผู้วายชนม์, ญาติผู้ฝาก, ตู้ที่/ล็อกที่..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-amber-200/60 dark:border-amber-950 bg-amber-50/10 dark:bg-[#1a150e] text-amber-950 dark:text-amber-100 placeholder-amber-700/30 dark:placeholder-amber-500/20 text-xs outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
        </div>
      </div>

      {/* Grid of relics */}
      {loading ? (
        <div className="p-12 text-center animate-pulse-subtle">
          <Loader2 className="size-8 text-amber-500 animate-spin mx-auto mb-2" />
          <p className="text-xs font-bold text-amber-700/65">กำลังดึงข้อมูลสารบบทะเบียนอัฐิ...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-amber-200/20 rounded-xl bg-white dark:bg-[#15110a] animate-fade-in">
          <Archive className="size-12 mx-auto text-amber-200 dark:text-amber-900/35 mb-2.5" />
          <p className="text-sm text-amber-800/50 dark:text-amber-500/40">ไม่พบทะเบียนฝากอัฐิตามเงื่อนไข</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
          {filteredRecords.map((record) => (
            <div
              key={record.id}
              className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 p-6 shadow-md shadow-amber-100/5 hover:translate-y-[-2px] transition-all duration-300 relative overflow-hidden"
            >
              {/* Corner Badge — ตู้ที่/ล็อกที่ */}
              <div className="absolute top-0 right-0">
                <span className="text-[10px] font-extrabold px-3.5 py-1.5 rounded-bl-xl bg-amber-500 text-white block shadow-sm">
                  {record.niche_code}
                </span>
              </div>

              {/* Card Details */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/25 text-amber-700 dark:text-amber-400 font-bold shrink-0 text-xs">
                    อัฐิ
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-amber-950 dark:text-amber-100 font-heading">
                      {record.deceased_name}
                    </h3>
                    <p className="text-[10px] text-amber-700/50 dark:text-amber-500/40 mt-0.5">
                      เสียชีวิตเมื่อ: {record.death_date}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mt-4 pt-4 border-t border-amber-100/50 dark:border-amber-950/40 text-xs">
                  <div className="flex items-center gap-2.5 text-amber-800/80 dark:text-amber-400">
                    <Lock className="size-4 text-amber-600 dark:text-amber-500 shrink-0" />
                    <span>ตู้ที่/ล็อกที่: <strong className="font-semibold text-amber-950 dark:text-amber-200">{record.niche_code}</strong></span>
                  </div>
                  <div className="flex items-center gap-2.5 text-amber-800/80 dark:text-amber-400">
                    <Calendar className="size-4 text-amber-600 dark:text-amber-500 shrink-0" />
                    <span>วันที่ฝากอัฐิ: <strong className="font-semibold text-amber-950 dark:text-amber-200">{record.deposit_date}</strong></span>
                  </div>
                  <div className="flex items-start gap-2.5 text-amber-800/80 dark:text-amber-400">
                    <User className="size-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="block">ญาติผู้ดูแลติดต่อ: <strong className="font-semibold text-amber-950 dark:text-amber-200">{record.relative_name}</strong></span>
                      <span className="text-[10px] text-amber-700/60 dark:text-amber-500/50 flex items-center gap-1 mt-0.5">
                        <Phone className="size-3" /> {record.relative_phone}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 text-amber-800/80 dark:text-amber-400">
                    <Bookmark className="size-4 text-amber-600 dark:text-amber-500 shrink-0" />
                    <span>ผู้รับฝาก: <strong className="font-semibold text-amber-950 dark:text-amber-200">{record.deposited_by || '-'}</strong></span>
                  </div>
                  {record.notes && (
                    <div className="flex items-start gap-2.5 text-amber-800/70 dark:text-amber-450 mt-2 bg-amber-50/10 p-2.5 rounded-lg border border-amber-100/50 dark:border-amber-950">
                      <FileText className="size-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-[10px] leading-relaxed">{record.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              {(permissions.canEdit || permissions.canDelete) && (
                <div className="flex gap-2 mt-6 pt-4 border-t border-amber-100/50 dark:border-amber-950/40">
                  {permissions.canEdit && (
                    <Button
                      variant="outline"
                      onClick={() => handleOpenEditModal(record)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 border-amber-200 hover:bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs font-bold cursor-pointer"
                    >
                      <Edit className="size-3.5" />
                      แก้ไขข้อมูล
                    </Button>
                  )}
                  {permissions.canDelete && (
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteRecord(record.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold cursor-pointer"
                    >
                      <Trash className="size-3.5" />
                      ลบข้อมูล
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Ashes Record Modal */}
      {isModalOpen && currentRecord && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/50 dark:border-amber-950/40 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
            <div className="h-1.5 bg-gradient-to-r from-amber-400 to-amber-600 shrink-0" />
            <div className="p-6 border-b border-amber-100 dark:border-amber-950 flex justify-between items-center bg-amber-50/20 dark:bg-amber-950/5 shrink-0">
              <h3 className="font-bold text-base text-amber-900 dark:text-amber-200 font-heading">
                {currentRecord.deceased_name ? 'แก้ไขข้อมูลฝากอัฐิ' : 'บันทึกข้อมูลฝากกระดูกและสถิตอัฐิใหม่'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-amber-800 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecord} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                
                {/* Deceased Name */}
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ชื่อผู้วายชนม์ (ผู้ล่วงลับ) *</label>
                  <input
                    type="text"
                    required
                    value={currentRecord.deceased_name || ''}
                    onChange={(e) => updateFormFields('deceased_name', e.target.value)}
                    placeholder="ระบุชื่อผู้วายชนม์"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {/* Date of Death */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">วันที่เสียชีวิต *</label>
                  <input
                    type="date"
                    required
                    value={currentRecord.death_date || ''}
                    onChange={(e) => updateFormFields('death_date', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {/* Deposit Date */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">วันที่ประดิษฐาน/บรรจุ *</label>
                  <input
                    type="date"
                    required
                    value={currentRecord.deposit_date || ''}
                    onChange={(e) => updateFormFields('deposit_date', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {/* Niche Code — ตู้ที่ / ล็อกที่ (2 inputs) */}
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">
                    ตู้ที่ / ล็อกที่ *
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 space-y-0.5">
                      <p className="text-[10px] text-amber-700/60 dark:text-amber-500/50 font-medium">ตู้ที่</p>
                      <input
                        type="number"
                        required
                        min="1"
                        value={currentRecord.niche_code?.split('/')[0] || ''}
                        onChange={(e) => {
                          const locker = currentRecord.niche_code?.split('/')[1] || '';
                          updateFormFields('niche_code', e.target.value + '/' + locker);
                        }}
                        placeholder="1"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-center font-bold tracking-widest"
                      />
                    </div>
                    <span className="text-xl font-bold text-amber-400 dark:text-amber-600 mt-4 select-none">/</span>
                    <div className="flex-1 space-y-0.5">
                      <p className="text-[10px] text-amber-700/60 dark:text-amber-500/50 font-medium">ล็อกที่</p>
                      <input
                        type="number"
                        required
                        min="1"
                        value={currentRecord.niche_code?.split('/')[1] || ''}
                        onChange={(e) => {
                          const cabinet = currentRecord.niche_code?.split('/')[0] || '';
                          updateFormFields('niche_code', cabinet + '/' + e.target.value);
                        }}
                        placeholder="12"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-center font-bold tracking-widest"
                      />
                    </div>
                  </div>
                </div>

                {/* Relative Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ชื่อญาติผู้ฝาก (ผู้ติดต่อหลัก) *</label>
                  <input
                    type="text"
                    required
                    value={currentRecord.relative_name || ''}
                    onChange={(e) => updateFormFields('relative_name', e.target.value)}
                    placeholder="เช่น นายกวี รุ่งเรือง"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {/* Relative Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">เบอร์โทรติดต่อญาติ *</label>
                  <input
                    type="text"
                    required
                    value={currentRecord.relative_phone || ''}
                    onChange={(e) => updateFormFields('relative_phone', e.target.value)}
                    placeholder="08X-XXX-XXXX"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {/* Deposited By — auto from session, read-only */}
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">พระ/เจ้าหน้าที่ผู้รับฝาก</label>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-200/60 dark:border-amber-950/60 bg-amber-50/30 dark:bg-amber-950/10">
                    <Bookmark className="size-3.5 text-amber-500 shrink-0" />
                    <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                      {currentRecord.deposited_by || '(ไม่พบข้อมูลผู้ใช้งาน)'}
                    </span>
                    <span className="ml-auto text-[10px] text-amber-600/50 dark:text-amber-500/40">เติมอัตโนมัติจาก session</span>
                  </div>
                </div>

                {/* Notes */}
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">หมายเหตุ / รายละเอียดเพิ่มเติม</label>
                  <textarea
                    value={currentRecord.notes || ''}
                    onChange={(e) => updateFormFields('notes', e.target.value)}
                    placeholder="เช่น ความปรารถนาของเจ้าภาพ, ตารางสวดทำบุญร้อยวัน..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 h-16 resize-none"
                  />
                </div>

              </div>

              {/* Form buttons */}
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
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2.5 px-5 rounded-lg flex items-center gap-1.5 border-none shadow-md shadow-amber-500/10 cursor-pointer"
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
