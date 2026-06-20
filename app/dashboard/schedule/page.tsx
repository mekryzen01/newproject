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
  CheckCircle2,
  AlertTriangle,
  Info,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useScheduleController } from '@/app/Controllers/useScheduleController';
import { CustomDialog } from '@/components/ui/custom-dialog';
import { usePermission } from '@/lib/usePermission';

export default function ScheduleManagement() {
  const { permissions } = usePermission();
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

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading text-amber-900 dark:text-amber-200">
            ระบบตารางงานนิมนต์และศาสนพิธี
          </h2>
          <p className="text-xs text-amber-700/50 dark:text-amber-400/50">
            จัดเตรียมวันทำบุญงานเลี้ยงพระนอกวัด งานฌาปนกิจ ตลอดจนตารางเวรดูแลงานพิธีของพระคุณเจ้า
          </p>
        </div>
        {permissions.canCreate && (
          <Button
            onClick={handleOpenAddModal}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-5 px-5 rounded-xl flex items-center gap-1.5 border-none shadow-md shadow-amber-500/10 cursor-pointer"
          >
            <Plus className="size-4" />
            จัดงานนิมนต์ใหม่
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

      {/* Events List Grid */}
      {loading ? (
        <div className="p-12 text-center animate-pulse-subtle">
          <Loader2 className="size-8 text-amber-500 animate-spin mx-auto mb-2" />
          <p className="text-xs font-bold text-amber-700/65">กำลังโหลดตารางจัดงานนิมนต์...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-amber-200/25 rounded-xl bg-white dark:bg-[#15110a] animate-fade-in">
          <CalendarIcon className="size-12 mx-auto text-amber-200 dark:text-amber-900/35 mb-2.5" />
          <p className="text-sm text-amber-800/50 dark:text-amber-500/40">ไม่พบตารางงานนิมนต์ที่ระบุ</p>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          {filteredEvents.map((event) => {
            // Find monk details assigned to this event
            const assignedMonksDetails = monks.filter(m => event.assigned_monks.includes(m.id));

            return (
              <div
                key={event.id}
                className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 p-6 shadow-md shadow-amber-100/5 flex flex-col lg:flex-row justify-between gap-6 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
              >
                {/* Event Summary Details */}
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
                className="p-1.5 rounded-lg text-amber-800 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer"
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
