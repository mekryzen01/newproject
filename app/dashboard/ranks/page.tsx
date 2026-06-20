'use client';

import React from 'react';
import {
  Award,
  Plus,
  Edit,
  Trash,
  X,
  Loader2,
  Shield,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRanksController } from '@/app/Controllers/useRanksController';
import { CustomDialog } from '@/components/ui/custom-dialog';
import { usePermission } from '@/lib/usePermission';

export default function RanksManagement() {
  const { permissions } = usePermission();
  const {
    ranks,
    loading,
    isModalOpen,
    setIsModalOpen,
    currentRank,
    isSaving,
    alertState,
    confirmState,
    setConfirmState,
    handleOpenAddModal,
    handleOpenEditModal,
    handleDeleteRank,
    handleSaveRank,
    updateFormFields
  } = useRanksController();

  const [searchQuery, setSearchQuery] = React.useState('');

  // Sort ranks by order
  const sortedRanks = [...ranks]
    .filter((rank) => rank.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading text-amber-900 dark:text-amber-200 flex items-center gap-2">
            <Award className="size-7 text-amber-600 dark:text-amber-500" />
            จัดการระบบสมณศักดิ์ / หน้าที่
          </h2>
          <p className="text-xs text-amber-700/50 dark:text-amber-400/50">
            ตั้งค่าสมณศักดิ์และหน้าที่ความรับผิดชอบของพระภิกษุสามเณร เพื่อเชื่อมโยงไปใช้ในขั้นตอนการลงทะเบียนข้อมูลทะเบียนวัด
          </p>
        </div>
        {permissions.canCreate && (
          <Button
            onClick={handleOpenAddModal}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-5 px-5 rounded-xl flex items-center gap-1.5 border-none shadow-md shadow-amber-500/10 cursor-pointer transition-all"
          >
            <Plus className="size-4" />
            เพิ่มสมณศักดิ์/หน้าที่ใหม่
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

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-[#15110a] p-4 rounded-xl border border-amber-200/40 dark:border-amber-950/30">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-700/40 dark:text-amber-500/30">
            <Search className="size-4" />
          </div>
          <input
            type="text"
            placeholder="ค้นหาตามชื่อสมณศักดิ์ / หน้าที่..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-amber-200/60 dark:border-amber-950 bg-amber-50/10 dark:bg-[#1a150e] text-amber-950 dark:text-amber-100 placeholder-amber-700/30 dark:placeholder-amber-500/20 text-xs outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
        </div>
      </div>

      {/* Ranks list view */}
      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center animate-pulse-subtle">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="size-8 text-amber-500 animate-spin" />
            <p className="text-xs font-bold text-amber-700/60 dark:text-amber-500/60">กำลังดึงข้อมูล...</p>
          </div>
        </div>
      ) : sortedRanks.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#15110a] rounded-xl border border-amber-200/40 dark:border-amber-950/30 animate-fade-in">
          <Award className="size-12 mx-auto text-amber-200 dark:text-amber-950/50 mb-3" />
          <p className="text-sm text-amber-800/50 dark:text-amber-500/40">ไม่พบข้อมูลสมณศักดิ์หรือหน้าที่ตามเงื่อนไขที่ระบุ</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 shadow-md shadow-amber-100/5 overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-amber-50/40 dark:bg-amber-950/10 border-b border-amber-200/30 dark:border-amber-950/40 text-amber-900 dark:text-amber-300 font-bold">
                  <th className="p-4 w-20 text-center">ลำดับที่</th>
                  <th className="p-4">สมณศักดิ์ / หน้าที่</th>
                  <th className="p-4 w-40 text-center">ประเภทบุคคลากร</th>
                  {(permissions.canEdit || permissions.canDelete) && <th className="p-4 w-40 text-center">จัดการ</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100/30 dark:divide-amber-950/20">
                {sortedRanks.map((rank) => (
                  <tr
                    key={rank.id}
                    className="hover:bg-amber-50/20 dark:hover:bg-amber-950/5 text-amber-950 dark:text-amber-100 transition-colors"
                  >
                    <td className="p-4 text-center font-semibold text-amber-700 dark:text-amber-500">
                      {rank.order}
                    </td>
                    <td className="p-4 font-bold text-sm">
                      <div className="flex items-center gap-2">
                        <Shield className="size-4 text-amber-500/70" />
                        {rank.name}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        rank.person_type === 'novice'
                          ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
                          : rank.person_type === 'disciple'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-850 dark:text-amber-400 border-amber-500/20'
                      }`}>
                        {rank.person_type === 'novice' ? 'สามเณร' : rank.person_type === 'disciple' ? 'ศิษย์วัด' : 'พระภิกษุ'}
                      </span>
                    </td>
                    {(permissions.canEdit || permissions.canDelete) && (
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          {permissions.canEdit && (
                            <Button
                              variant="outline"
                              onClick={() => handleOpenEditModal(rank)}
                              className="flex items-center justify-center p-2 border-amber-200 dark:border-amber-950/80 hover:bg-amber-500/10 text-amber-800 dark:text-amber-300 dark:hover:text-amber-200 text-xs font-bold cursor-pointer size-8"
                              title="แก้ไขข้อมูล"
                            >
                              <Edit className="size-3.5" />
                            </Button>
                          )}
                          {permissions.canDelete && (
                            <Button
                              variant="destructive"
                              onClick={() => handleDeleteRank(rank.id)}
                              className="flex items-center justify-center p-2 text-xs font-bold cursor-pointer size-8"
                              title="ลบข้อมูล"
                            >
                              <Trash className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Rank Dialog Modal */}
      {isModalOpen && currentRank && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/50 dark:border-amber-950/40 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up flex flex-col">
            
            {/* Modal Ribbon Accent */}
            <div className="h-1.5 bg-linear-to-r from-amber-400 to-amber-600" />

            {/* Modal Header */}
            <div className="p-6 border-b border-amber-100 dark:border-amber-950 flex justify-between items-center bg-amber-50/20 dark:bg-amber-950/5 shrink-0">
              <h3 className="font-bold text-lg text-amber-900 dark:text-amber-200 font-heading">
                {currentRank.name ? 'แก้ไขสมณศักดิ์ / หน้าที่' : 'เพิ่มสมณศักดิ์ / หน้าที่ใหม่'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-amber-800 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveRank} className="flex flex-col space-y-4 p-6">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">
                  ชื่อสมณศักดิ์ / หน้าที่ *
                </label>
                <input
                  type="text"
                  required
                  value={currentRank.name || ''}
                  onChange={(e) => updateFormFields('name', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  placeholder="เช่น พระลูกวัด, พระเลขานุการ, รองเจ้าอาวาส"
                />
              </div>

              {/* Person Type */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300 block mb-1">
                  ประเภทบุคลากร *
                </label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-xs text-amber-950 dark:text-amber-100 cursor-pointer">
                    <input
                      type="radio"
                      name="person_type"
                      checked={currentRank.person_type === 'monk'}
                      onChange={() => {
                        updateFormFields('person_type', 'monk');
                        updateFormFields('is_novice', false);
                      }}
                      className="accent-amber-500 size-4 cursor-pointer"
                    />
                    พระภิกษุ (มีฉายาบาลี และ วันอุปสมบท)
                  </label>
                  <label className="flex items-center gap-2 text-xs text-amber-950 dark:text-amber-100 cursor-pointer">
                    <input
                      type="radio"
                      name="person_type"
                      checked={currentRank.person_type === 'novice'}
                      onChange={() => {
                        updateFormFields('person_type', 'novice');
                        updateFormFields('is_novice', true);
                      }}
                      className="accent-amber-500 size-4 cursor-pointer"
                    />
                    สามเณร (ไม่มีฉายา มีวันบรรพชา)
                  </label>
                  <label className="flex items-center gap-2 text-xs text-amber-950 dark:text-amber-100 cursor-pointer">
                    <input
                      type="radio"
                      name="person_type"
                      checked={currentRank.person_type === 'disciple'}
                      onChange={() => {
                        updateFormFields('person_type', 'disciple');
                        updateFormFields('is_novice', false);
                      }}
                      className="accent-amber-500 size-4 cursor-pointer"
                    />
                    ศิษย์วัด (ไม่มีฉายา ไม่มีวันอุปสมบท/บรรพชา)
                  </label>
                </div>
              </div>

              {/* Order */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">
                  ลำดับการแสดงผล (ตัวเลข)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={currentRank.order || ''}
                  onChange={(e) => updateFormFields('order', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  placeholder="เช่น 1, 2, 3"
                />
                <p className="text-[10px] text-amber-700/50 dark:text-amber-500/40">
                  ใช้เรียงลำดับในหน้าทำเนียบและหน้าเพิ่มข้อมูล
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-4 border-t border-amber-100 dark:border-amber-950 bg-amber-50/10 dark:bg-amber-950/5 shrink-0 -mx-6 -mb-6 p-6 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 border-amber-200 text-amber-800 text-xs font-bold py-5 cursor-pointer"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-5 border-none shadow-md shadow-amber-500/10 cursor-pointer"
                >
                  {isSaving ? <Loader2 className="size-4 animate-spin mx-auto" /> : 'บันทึกข้อมูล'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
