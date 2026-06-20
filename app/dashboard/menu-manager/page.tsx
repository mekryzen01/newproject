'use client';

import React from 'react';
import {
  Settings,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  Loader2,
  Home,
  Users,
  DollarSign,
  Calendar,
  Package,
  Archive,
  Plus,
  Edit,
  Trash,
  X,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMenuManagerController } from '@/app/Controllers/useMenuManagerController';
import { CustomDialog } from '@/components/ui/custom-dialog';

export default function MenuManager() {
  const {
    menus,
    loading,
    isSaving,
    alertState,
    confirmState,
    setConfirmState,
    isModalOpen,
    setIsModalOpen,
    currentItem,
    handleToggleActive,
    handleMove,
    handleOpenAddModal,
    handleOpenEditModal,
    handleDeleteItem,
    handleSaveItemModal,
    handleSaveAllGrid,
    handleReset,
    updateFormFields,
    parentCandidates
  } = useMenuManagerController();

  const getIconComponent = (name: string) => {
    switch (name) {
      case 'Home': return Home;
      case 'Users': return Users;
      case 'DollarSign': return DollarSign;
      case 'Calendar': return Calendar;
      case 'Package': return Package;
      case 'Archive': return Archive;
      case 'Settings': return Settings;
      default: return Settings;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading text-amber-900 dark:text-amber-200">
            ระบบจัดการเมนูและโครงสร้างแบบย่อย (Menu & Submenu Builder)
          </h2>
          <p className="text-xs text-amber-700/50 dark:text-amber-400/50">
            สร้าง ปรับเปลี่ยน ลบ หรือโยกย้ายเมนูหลักและเมนูย่อยของระบบวัดอัจฉริยะ (Temple OS) ได้ตามโครงสร้างต้องการ
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button
            onClick={handleReset}
            variant="outline"
            className="border-amber-200 hover:bg-amber-500/10 text-amber-800 dark:text-amber-450 text-xs font-bold py-5 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="size-4" />
            รีเซ็ตค่าเริ่มต้น
          </Button>
          <Button
            onClick={handleOpenAddModal}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-5 px-5 rounded-xl flex items-center gap-1.5 border-none shadow-md shadow-amber-600/10 cursor-pointer"
          >
            <Plus className="size-4" />
            สร้างเมนูใหม่
          </Button>
          <Button
            onClick={handleSaveAllGrid}
            disabled={isSaving}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-5 px-5 rounded-xl flex items-center gap-1.5 border-none shadow-md shadow-amber-500/10 cursor-pointer"
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            บันทึกการจัดเรียงเมนู
          </Button>
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

      {/* Center Confirm Deletion/Action Modal */}
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

      {/* Grid of Menus table control */}
      {loading ? (
        <div className="p-12 text-center bg-white dark:bg-[#15110a] rounded-xl border border-amber-200/40 dark:border-amber-950/30 animate-pulse-subtle">
          <Loader2 className="size-8 text-amber-500 animate-spin mx-auto mb-2" />
          <p className="text-xs font-bold text-amber-700/65">กำลังดึงข้อมูลสารบบเมนู...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 p-6 shadow-md shadow-amber-100/5 overflow-x-auto animate-fade-in">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-amber-200/30 dark:border-amber-950/30 text-amber-800/60 dark:text-amber-500/65 font-bold">
                <th className="py-3.5 px-3 text-center">จัดเรียง</th>
                <th className="py-3.5 px-3">ประเภทเมนู</th>
                <th className="py-3.5 px-3">ไอคอน</th>
                <th className="py-3.5 px-3">ชื่อปุ่มเมนู</th>
                <th className="py-3.5 px-3">ลิงก์ภายในระบบ</th>
                <th className="py-3.5 px-3 text-center">การแสดงผล</th>
                <th className="py-3.5 px-3 text-right">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100/40 dark:divide-amber-950/20">
              {menus.map((item, index) => {
                const IconComponent = getIconComponent(item.iconName);
                const isSubmenu = !!item.parentId;
                
                // Get siblings within the same parent
                const siblings = menus.filter(m => m.parentId === item.parentId);
                const siblingIndex = siblings.findIndex(m => m.id === item.id);

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-amber-50/10 dark:hover:bg-amber-950/5 transition-colors ${
                      isSubmenu ? 'bg-amber-500/2 dark:bg-amber-950/1' : ''
                    } ${!item.isActive ? 'opacity-55' : ''}`}
                  >
                    {/* Sort buttons inside level */}
                    <td className="py-3.5 px-3 whitespace-nowrap text-center">
                      <div className="flex justify-center gap-1">
                        <button
                          disabled={siblingIndex === 0}
                          onClick={() => handleMove(index, 'up')}
                          className="p-1 rounded hover:bg-amber-500/10 text-amber-800 dark:text-amber-400 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                        >
                          <ArrowUp className="size-3.5" />
                        </button>
                        <button
                          disabled={siblingIndex === siblings.length - 1}
                          onClick={() => handleMove(index, 'down')}
                          className="p-1 rounded hover:bg-amber-500/10 text-amber-800 dark:text-amber-400 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                        >
                          <ArrowDown className="size-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Menu Type status */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {isSubmenu ? (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-700/60 dark:text-amber-500/60 pl-4">
                          <ChevronRight className="size-3" /> เมนูย่อย
                        </span>
                      ) : item.href === '#' ? (
                        <span className="text-[10px] font-bold bg-amber-500/15 text-amber-950 px-2 py-0.5 rounded">
                          หัวข้อหลัก (Collapsible)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-amber-900/10 text-amber-900 px-2 py-0.5 rounded">
                          เมนูหลักปกติ
                        </span>
                      )}
                    </td>

                    {/* Icon */}
                    <td className="py-3.5 px-3">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-700 dark:text-amber-400 border border-amber-500/15">
                        <IconComponent className="size-3.5" />
                      </div>
                    </td>

                    {/* Name */}
                    <td className={`py-3.5 px-3 font-bold text-amber-950 dark:text-amber-100 ${isSubmenu ? 'pl-6 font-medium text-xs' : ''}`}>
                      {item.name}
                    </td>

                    {/* Href link */}
                    <td className="py-3.5 px-3 font-mono text-[10px] text-amber-700/60 dark:text-amber-500/50">
                      {item.href === '#' ? '(ไม่มี - ขยายเมนูย่อย)' : item.href}
                    </td>

                    {/* Active toggle status */}
                    <td className="py-3.5 px-3 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleToggleActive(item.id)}
                        className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold flex items-center gap-1 mx-auto cursor-pointer ${
                          item.isActive
                            ? 'bg-emerald-500/10 text-emerald-650'
                            : 'bg-red-500/10 text-red-650'
                        }`}
                        title="คลิกเพื่อเปิด-ปิดการใช้งานเมนู"
                      >
                        {item.isActive ? (
                          <>
                            <Eye className="size-3" />
                            เปิดใช้งาน
                          </>
                        ) : (
                          <>
                            <EyeOff className="size-3" />
                            ซ่อนไว้
                          </>
                        )}
                      </button>
                    </td>

                    {/* Operations */}
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleOpenEditModal(item)}
                          className="py-1 px-2.5 border-amber-200 hover:bg-amber-500/10 text-amber-800 dark:text-amber-300 text-[10px] font-bold cursor-pointer"
                        >
                          <Edit className="size-3" />
                          แก้ไข
                        </Button>
                        <Button
                          size="xs"
                          variant="destructive"
                          onClick={() => handleDeleteItem(item.id)}
                          className="py-1 px-2.5 text-[10px] font-bold cursor-pointer"
                        >
                          <Trash className="size-3" />
                          ลบ
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Menu Dialog Modal */}
      {isModalOpen && currentItem && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/50 dark:border-amber-950/40 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="h-1.5 bg-gradient-to-r from-amber-400 to-amber-600" />
            <div className="p-6 border-b border-amber-100 dark:border-amber-950 flex justify-between items-center bg-amber-50/20 dark:bg-amber-950/5">
              <h3 className="font-bold text-base text-amber-900 dark:text-amber-200 font-heading">
                {menus.some(m => m.id === currentItem.id) ? 'แก้ไขข้อมูลเมนู' : 'สร้างรายการเมนูใหม่'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-amber-800 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItemModal} className="p-6 space-y-4">
              
              {/* Menu Label Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ชื่อเมนู (ภาษาไทย)</label>
                <input
                  type="text"
                  required
                  value={currentItem.name || ''}
                  onChange={(e) => updateFormFields('name', e.target.value)}
                  placeholder="เช่น ประวัติศาลาวัด, บันทึกบวชชีพราหมณ์"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* Submenu relation Parent selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">เมนูย่อยของ (ระบุหากต้องการทำเป็น Submenu)</label>
                <select
                  value={currentItem.parentId || ''}
                  onChange={(e) => updateFormFields('parentId', e.target.value || null)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                >
                  <option value="">-- ไม่เป็นเมนูย่อย (เป็นเมนูหลัก) --</option>
                  {parentCandidates
                    .filter(p => p.id !== currentItem.id) // Cannot be a child of itself
                    .map(parent => (
                      <option key={parent.id} value={parent.id}>
                        {parent.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Href Route link */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">
                  เส้นทางระบบ (URL Path)
                </label>
                <div className="flex gap-2.5 items-center">
                  <input
                    type="text"
                    required
                    disabled={currentItem.href === '#'}
                    value={currentItem.href || ''}
                    onChange={(e) => updateFormFields('href', e.target.value)}
                    placeholder="เช่น /dashboard/monks"
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 disabled:opacity-50"
                  />
                  {!currentItem.parentId && (
                    <label className="flex items-center gap-1.5 text-xs text-amber-900 dark:text-amber-200 shrink-0 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentItem.href === '#'}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          updateFormFields('href', isChecked ? '#' : '/dashboard/');
                        }}
                        className="accent-amber-500 size-3.5"
                      />
                      หัวข้อหลักขยายได้
                    </label>
                  )}
                </div>
                <p className="text-[9px] text-amber-700/50 dark:text-amber-500/40">
                  * หมายเหตุ: หากทำเป็นเมนูหลักแบบหัวข้อขยาย (Collapsible) เพื่อครอบเมนูย่อย ให้เลือกติ๊ก "หัวข้อหลักขยายได้"
                </p>
              </div>

              {/* Icon Name selection */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ไอคอนเมนู (Lucide Icon)</label>
                <select
                  value={currentItem.iconName || 'Settings'}
                  onChange={(e) => updateFormFields('iconName', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                >
                  <option value="Home">Home (รูปบ้าน - หน้าหลัก)</option>
                  <option value="Users">Users (รูปพระ/คน - ทำเนียบพระ)</option>
                  <option value="DollarSign">DollarSign (รูปเงิน - การเงิน)</option>
                  <option value="Calendar">Calendar (รูปปฏิทิน - งานนิมนต์)</option>
                  <option value="Package">Package (รูปกล่อง - พัสดุครุภัณฑ์)</option>
                  <option value="Archive">Archive (รูปหีบ/กล่องเอกสาร - อัฐิ)</option>
                  <option value="Settings">Settings (รูปเกียร์ - การตั้งค่า)</option>
                </select>
              </div>

              {/* Modal footer actions */}
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
