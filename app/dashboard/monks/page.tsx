'use client';

import React from 'react';
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash,
  X,
  Phone,
  Calendar as CalendarIcon,
  Shield,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  MapPin,
  Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMonksController } from '@/app/Controllers/useMonksController';
import { CustomDialog } from '@/components/ui/custom-dialog';
import { usePermission } from '@/lib/usePermission';

export default function MonksManagement() {
  const { permissions } = usePermission();
  const [detailedMonk, setDetailedMonk] = React.useState<any>(null);
  const [expandedMonkIds, setExpandedMonkIds] = React.useState<Record<string, boolean>>({});
  const [personTypeFilter, setPersonTypeFilter] = React.useState<string>('all');

  const toggleExpandMonk = (id: string) => {
    setExpandedMonkIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const {
    ranks,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    loading,
    isModalOpen,
    setIsModalOpen,
    currentMonk,
    isSaving,
    alertState,
    confirmState,
    setConfirmState,
    handleOpenAddModal,
    handleOpenEditModal,
    handleDeleteMonk,
    handleSaveMonk,
    updateFormFields,
    filteredMonks
  } = useMonksController();

  const displayedMonks = filteredMonks.filter(monk => {
    if (personTypeFilter === 'all') return true;
    const monkRank = ranks.find(r => r.name === monk.rank);
    const type = monkRank?.person_type || 'monk';
    return type === personTypeFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading text-amber-900 dark:text-amber-200">
            ระบบทะเบียนทำเนียบศาสนบุคลากร
          </h2>
          <p className="text-xs text-amber-700/50 dark:text-amber-400/50">
            ระบบจัดการทะเบียน รายชื่อ ตำแหน่ง สถานภาพ และข้อมูลติดต่อของพระภิกษุ สามเณร และศิษย์วัด
          </p>
        </div>
        {permissions.canCreate && (
          <Button
            onClick={handleOpenAddModal}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-5 px-5 rounded-xl flex items-center gap-1.5 border-none shadow-md shadow-amber-500/10 cursor-pointer"
          >
            <Plus className="size-4" />
            เพิ่มบุคลากรใหม่
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

      {/* Control filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-[#15110a] p-4 rounded-xl border border-amber-200/40 dark:border-amber-950/30">
        {/* Search input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-700/40 dark:text-amber-500/30">
            <Search className="size-4" />
          </div>
          <input
            type="text"
            placeholder="ค้นหาตามชื่อ, ฉายา, เบอร์โทร..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-amber-200/60 dark:border-amber-950 bg-amber-50/10 dark:bg-[#1a150e] text-amber-950 dark:text-amber-100 placeholder-amber-700/30 dark:placeholder-amber-500/20 text-xs outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
        </div>

        {/* Filter Person Type */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-amber-800/70 dark:text-amber-400/70 shrink-0">ประเภทบุคลากร:</label>
          <select
            value={personTypeFilter}
            onChange={(e) => setPersonTypeFilter(e.target.value)}
            className="py-2 px-3 rounded-lg border border-amber-200/60 dark:border-amber-950 bg-amber-50/10 dark:bg-[#1a150e] text-amber-950 dark:text-amber-100 text-xs outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
          >
            <option value="all">ทั้งหมด</option>
            <option value="monk">พระภิกษุ</option>
            <option value="novice">สามเณร</option>
            <option value="disciple">ศิษย์วัด</option>
          </select>
        </div>

        {/* Filter status */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-amber-800/70 dark:text-amber-400/70 shrink-0">สถานะปฏิบัติศาสนกิจ:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 rounded-lg border border-amber-200/60 dark:border-amber-950 bg-amber-50/10 dark:bg-[#1a150e] text-amber-950 dark:text-amber-100 text-xs outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
          >
            <option value="all">ทั้งหมด</option>
            <option value="active">อยู่จำพรรษาที่วัด</option>
            <option value="away">จาริก/ไปวัดอื่น</option>
            <option value="retired">ลาสิกขา/สึก/พ้นสภาพ</option>
          </select>
        </div>
      </div>

      {/* Monks Grid/Table */}
      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center animate-pulse-subtle">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="size-8 text-amber-500 animate-spin" />
            <p className="text-xs font-bold text-amber-700/60 dark:text-amber-500/60">กำลังดึงทำเนียบพระ...</p>
          </div>
        </div>
      ) : displayedMonks.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#15110a] rounded-xl border border-amber-200/40 dark:border-amber-950/30 animate-fade-in">
          <Users className="size-12 mx-auto text-amber-200 dark:text-amber-950/50 mb-3" />
          <p className="text-sm text-amber-800/50 dark:text-amber-500/40">ไม่พบรายชื่อบุคลากรตามเงื่อนไขที่ระบุ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
          {displayedMonks.map((monk) => {
            const isExpanded = expandedMonkIds[monk.id];
            return (
              <div
                key={monk.id}
                className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 p-6 shadow-md shadow-amber-100/5 flex flex-col justify-between hover:translate-y-[-2px] hover:shadow-lg transition-all duration-300 relative overflow-hidden"
              >
                {/* Corner Banner status */}
                <div className="absolute top-0 right-0">
                  <span className={`text-[9px] font-bold px-3 py-1 rounded-bl-xl block ${
                    monk.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : monk.status === 'away'
                      ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-500'
                  }`}>
                    {monk.status === 'active' ? 'อยู่จำพรรษา' : monk.status === 'away' ? 'จาริก/ปฏิบัติธรรม' : 'ลาสิกขาแล้ว'}
                  </span>
                </div>

                {/* Monk Content */}
                <div>
                  <div className="flex items-center gap-3.5 mb-4">
                    {monk.image_url && (
                      <img
                        src={monk.image_url}
                        className="w-12 h-12 rounded-full object-cover border border-amber-500/20 shadow-sm"
                        alt={monk.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    {!monk.image_url && (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500/10 to-amber-600/10 border border-amber-500/20 flex items-center justify-center font-bold text-amber-800 dark:text-amber-400 text-lg">
                        {monk.chaya && monk.chaya !== '-' ? monk.chaya[0] : monk.name?.[0] ?? '?'}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-base text-amber-950 dark:text-amber-100 flex items-center gap-1.5 font-heading">
                        {monk.name}234234
                      </h3>
                      {monk.chaya !== '-' && (
                        <p className="text-xs text-amber-700/60 dark:text-amber-400/60 italic font-semibold">
                          ฉายา: {monk.chaya}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mt-4 pt-4 border-t border-amber-100/50 dark:border-amber-950/40 text-xs">
                    <div className="flex items-center gap-2.5 text-amber-800/80 dark:text-amber-400/80">
                      <Shield className="size-4 text-amber-600 dark:text-amber-500" />
                      <span>ตำแหน่ง: <strong className="font-semibold text-amber-950 dark:text-amber-200">{monk.rank}</strong></span>
                    </div>
                    {ranks.find(r => r.name === monk.rank)?.person_type !== 'disciple' && (
                      <div className="flex items-center gap-2.5 text-amber-800/80 dark:text-amber-400/80">
                        <CalendarIcon className="size-4 text-amber-600 dark:text-amber-500" />
                        <span>
                          {ranks.find(r => r.name === monk.rank)?.person_type === 'novice' ? 'วันบรรพชา' : 'วันอุปสมบท'}:{' '}
                          <strong className="font-semibold text-amber-950 dark:text-amber-200">{monk.ordination_date}</strong>
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2.5 text-amber-800/80 dark:text-amber-400/80">
                      <Phone className="size-4 text-amber-600 dark:text-amber-500" />
                      <span>เบอร์โทร: <strong className="font-semibold text-amber-950 dark:text-amber-200">{monk.phone || 'ไม่ระบุ'}</strong></span>
                    </div>
                  </div>

                  {/* Expandable Details Section */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-dashed border-amber-200/40 dark:border-amber-950/30 space-y-2 animate-fade-in text-[11px]">
                      {/* Father/Mother info */}
                      <div className="flex items-start gap-2.5 text-amber-800/85 dark:text-amber-400/85">
                        <Heart className="size-4 text-amber-600/80 dark:text-amber-500/85 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-bold text-amber-900/90 dark:text-amber-305">ข้อมูลบิดา-มารดา:</span>
                          <p className="text-amber-950 dark:text-amber-200">
                            บิดา: {monk.father_name || 'ไม่ระบุ'} <br />
                            มารดา: {monk.mother_name || 'ไม่ระบุ'}
                          </p>
                        </div>
                      </div>

                      {/* Domicile address */}
                      <div className="flex items-start gap-2.5 text-amber-800/85 dark:text-amber-400/85">
                        <MapPin className="size-4 text-amber-600/80 dark:text-amber-500/85 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-bold text-amber-900/90 dark:text-amber-305">ภูมิลำเนาเดิม:</span>
                          <p className="text-amber-950 dark:text-amber-200 leading-relaxed">
                            {monk.domicile_address || 'ไม่ระบุ'}
                          </p>
                        </div>
                      </div>

                      {/* Novice Ordination Date (if monk and has it) */}
                      {ranks.find(r => r.name === monk.rank)?.person_type === 'monk' && (
                        <div className="flex items-start gap-2.5 text-amber-800/85 dark:text-amber-400/85">
                          <CalendarIcon className="size-4 text-amber-600/80 dark:text-amber-500/85 mt-0.5 shrink-0" />
                          <div>
                            <span className="font-bold text-amber-900/90 dark:text-amber-305">วันที่บรรพชา (สามเณร):</span>
                            <p className="text-amber-950 dark:text-amber-200">
                              {monk.novice_ordination_date || 'ไม่ระบุ/อุปสมบทตรง'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Emergency contacts */}
                      {(monk.emergency_contact || monk.emergency_phone) && (
                        <div className="flex items-start gap-2.5 text-amber-800/85 dark:text-amber-400/85">
                          <Phone className="size-4 text-amber-600/80 dark:text-amber-500/85 mt-0.5 shrink-0" />
                          <div>
                            <span className="font-bold text-amber-900/90 dark:text-amber-305">ติดต่อฉุกเฉิน:</span>
                            <p className="text-amber-950 dark:text-amber-200">
                              {monk.emergency_contact || 'ไม่ระบุ'} {monk.emergency_phone ? `(${monk.emergency_phone})` : ''}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* View details toggle button */}
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => toggleExpandMonk(monk.id)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border-amber-200 dark:border-amber-950 hover:bg-amber-500/10 text-amber-850 dark:text-amber-350 text-xs font-bold cursor-pointer transition-all"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="size-3.5" />
                        ซ่อนรายละเอียดประวัติ
                      </>
                    ) : (
                      <>
                        <ChevronDown className="size-3.5" />
                        ดูรายละเอียดประวัติ
                      </>
                    )}
                  </Button>
                </div>

                {/* Action buttons */}
                {(permissions.canEdit || permissions.canDelete) && (
                  <div className="flex gap-2 mt-2 pt-2 border-t border-amber-100/50 dark:border-amber-950/40">
                    {permissions.canEdit && (
                      <Button
                        variant="outline"
                        onClick={() => handleOpenEditModal(monk)}
                        className="flex-1 flex items-center justify-center gap-1 py-2 px-3 border-amber-200 dark:border-amber-950/80 hover:bg-amber-500/10 text-amber-800 dark:text-amber-300 dark:hover:text-amber-200 text-xs font-bold cursor-pointer"
                      >
                        <Edit className="size-3.5" />
                        แก้ไขข้อมูล
                      </Button>
                    )}
                    {permissions.canDelete && (
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteMonk(monk.id)}
                        className="flex-1 flex items-center justify-center gap-1 py-2 px-3 text-xs font-bold cursor-pointer"
                      >
                        <Trash className="size-3.5" />
                        ลบข้อมูล
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Monk Dialog Modal */}
      {isModalOpen && currentMonk && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/50 dark:border-amber-950/40 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
            
            {/* Modal Ribbon Accent */}
            <div className="h-1.5 bg-gradient-to-r from-amber-400 to-amber-600" />

            {/* Modal Header */}
            <div className="p-6 border-b border-amber-100 dark:border-amber-950 flex justify-between items-center bg-amber-50/20 dark:bg-amber-950/5 shrink-0">
              <h3 className="font-bold text-lg text-amber-900 dark:text-amber-200 font-heading">
                {currentMonk.name ? 'แก้ไขข้อมูลศาสนบุคลากร' : 'เพิ่มทะเบียนศาสนบุคลากรใหม่'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-amber-800 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveMonk} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 pr-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ชื่อ (เช่น พระมหาสมชาย)</label>
                    <input
                      type="text"
                      required
                      value={currentMonk.name || ''}
                      onChange={(e) => updateFormFields('name', e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      placeholder="พระสมบัติ"
                    />
                  </div>

                  {/* Rank / Duty */}
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">สมณศักดิ์ / หน้าที่ / บทบาทวัด *</label>
                    <select
                      value={currentMonk.rank || ''}
                      onChange={(e) => {
                        const selectedRankName = e.target.value;
                        updateFormFields('rank', selectedRankName);
                        const selectedRank = ranks.find(r => r.name === selectedRankName);
                        if (selectedRank?.person_type === 'novice') {
                          updateFormFields('chaya', '-');
                          if (currentMonk.ordination_date === '-') {
                            updateFormFields('ordination_date', '');
                          }
                        } else if (selectedRank?.person_type === 'disciple') {
                          updateFormFields('chaya', '-');
                          updateFormFields('ordination_date', '-');
                        } else {
                          if (currentMonk.chaya === '-') {
                            updateFormFields('chaya', '');
                          }
                          if (currentMonk.ordination_date === '-') {
                            updateFormFields('ordination_date', '');
                          }
                        }
                      }}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                    >
                      <option value="" disabled>-- เลือกสมณศักดิ์ / หน้าที่ --</option>
                      {ranks.map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name} ({r.person_type === 'novice' ? 'สามเณร' : r.person_type === 'disciple' ? 'ศิษย์วัด' : 'พระภิกษุ'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Chaya */}
                  {ranks.find(r => r.name === currentMonk.rank)?.person_type === 'monk' && (
                    <div className="col-span-2 space-y-1 animate-fade-in">
                      <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ฉายาบาลี *</label>
                      <input
                        type="text"
                        required
                        value={currentMonk.chaya || ''}
                        onChange={(e) => updateFormFields('chaya', e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                        placeholder="อาภาธโร"
                      />
                    </div>
                  )}

                  {/* Status */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">สถานภาพ</label>
                    <select
                      value={currentMonk.status || 'active'}
                      onChange={(e) => updateFormFields('status', e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                    >
                      <option value="active">จำพรรษาที่วัด</option>
                      <option value="away">จาริก/ไปวัดอื่น</option>
                      <option value="retired">ลาสิกขา (สึก)</option>
                    </select>
                  </div>

                  {/* Ordination Date */}
                  {ranks.find(r => r.name === currentMonk.rank)?.person_type !== 'disciple' && (
                    <div className="space-y-1 animate-fade-in">
                      <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">
                        {ranks.find(r => r.name === currentMonk.rank)?.person_type === 'novice' ? 'วันที่บรรพชา (เป็นสามเณร) *' : 'วันที่อุปสมบท (เป็นพระภิกษุ) *'}
                      </label>
                      <input
                        type="date"
                        required
                        value={currentMonk.ordination_date || ''}
                        onChange={(e) => updateFormFields('ordination_date', e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                    </div>
                  )}

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">เบอร์โทรศัพท์ติดต่อ</label>
                    <input
                      type="text"
                      value={currentMonk.phone || ''}
                      onChange={(e) => updateFormFields('phone', e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      placeholder="08X-XXX-XXXX"
                    />
                  </div>

                  {/* Profile Photo — file upload to base64 */}
                  <div className="col-span-2 space-y-2">
                    <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">\u0e23\u0e39\u0e1b\u0e16\u0e48\u0e32\u0e22\u0e1b\u0e23\u0e30\u0e08\u0e33\u0e15\u0e31\u0e27 (Profile Image)</label>
                    <div className="flex items-center gap-4">
                      {/* Preview */}
                      <div className="w-16 h-16 rounded-xl border-2 border-amber-200 dark:border-amber-950 bg-amber-50/30 dark:bg-amber-950/10 overflow-hidden flex items-center justify-center shrink-0 text-amber-300 dark:text-amber-700">
                        {currentMonk.image_url ? (
                          <img src={currentMonk.image_url} className="w-full h-full object-cover" alt="preview" />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="size-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        )}
                      </div>
                      {/* Controls */}
                      <div className="flex-1 space-y-1.5">
                        <label
                          htmlFor="monk-photo-upload"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-amber-400 dark:border-amber-700 bg-amber-50/20 dark:bg-amber-950/10 text-xs font-bold text-amber-700 dark:text-amber-400 cursor-pointer hover:bg-amber-500/10 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                          <span>\u0e40\u0e25\u0e37\u0e2d\u0e01\u0e44\u0e1f\u0e25\u0e4c\u0e23\u0e39\u0e1b\u0e20\u0e32\u0e1e...</span>
                        </label>
                        <input
                          id="monk-photo-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              updateFormFields('image_url', ev.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                        {currentMonk.image_url && (
                          <button
                            type="button"
                            onClick={() => updateFormFields('image_url', '')}
                            className="text-[10px] text-red-500 hover:underline cursor-pointer block"
                          >
                            \u0e25\u0e1a\u0e23\u0e39\u0e1b\u0e2d\u0e2d\u0e01
                          </button>
                        )}
                        <p className="text-[10px] text-amber-600/50 dark:text-amber-500/40">\u0e23\u0e2d\u0e07\u0e23\u0e31\u0e1a JPG, PNG, WEBP \u2014 \u0e40\u0e01\u0e47\u0e1a\u0e40\u0e1b\u0e47\u0e19 base64 \u0e43\u0e19\u0e40\u0e04\u0e23\u0e37\u0e48\u0e2d\u0e07</p>
                      </div>
                    </div>
                  </div>

                  {/* Novice Ordination Date */}
                  {ranks.find(r => r.name === currentMonk.rank)?.person_type === 'monk' ? (
                    <div className="space-y-1 animate-fade-in">
                      <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">วันที่บรรพชา (เป็นสามเณร) (ระบุถ้ามี)</label>
                      <input
                        type="date"
                        value={currentMonk.novice_ordination_date || ''}
                        onChange={(e) => updateFormFields('novice_ordination_date', e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                    </div>
                  ) : (
                    <div className="hidden sm:block" />
                  )}

                  {/* Father Info */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ชื่อบิดา (ระบุถ้ามี)</label>
                    <input
                      type="text"
                      value={currentMonk.father_name || ''}
                      onChange={(e) => updateFormFields('father_name', e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      placeholder="ชื่อ-นามสกุลบิดา"
                    />
                  </div>

                  {/* Mother Info */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ชื่อมารดา (ระบุถ้ามี)</label>
                    <input
                      type="text"
                      value={currentMonk.mother_name || ''}
                      onChange={(e) => updateFormFields('mother_name', e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      placeholder="ชื่อ-นามสกุลมารดา"
                    />
                  </div>

                  {/* Emergency Contact */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ผู้ติดต่อฉุกเฉิน (ชื่อ-ความสัมพันธ์)</label>
                    <input
                      type="text"
                      value={currentMonk.emergency_contact || ''}
                      onChange={(e) => updateFormFields('emergency_contact', e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      placeholder="เช่น นายสมใจ (พี่ชาย)"
                    />
                  </div>

                  {/* Emergency Phone */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-900/80 dark:text-amber-350">เบอร์โทรศัพท์ฉุกเฉิน</label>
                    <input
                      type="text"
                      value={currentMonk.emergency_phone || ''}
                      onChange={(e) => updateFormFields('emergency_phone', e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      placeholder="08X-XXX-XXXX"
                    />
                  </div>

                  {/* Domicile Address */}
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ที่อยู่ตามภูมิลำเนาเดิม</label>
                    <textarea
                      value={currentMonk.domicile_address || ''}
                      onChange={(e) => updateFormFields('domicile_address', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
                      placeholder="ระบุบ้านเลขที่ หมู่ ตำบล อำเภอ จังหวัด รหัสไปรษณีย์..."
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-2.5 p-6 border-t border-amber-100 dark:border-amber-950 bg-amber-50/10 dark:bg-amber-950/5 shrink-0">
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

      {/* Detailed Monk Info Modal */}
      {detailedMonk && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/50 dark:border-amber-950/40 shadow-2xl w-full max-w-xl overflow-hidden animate-scale-up">
            {/* Modal Ribbon Accent */}
            <div className="h-1.5 bg-gradient-to-r from-amber-400 to-amber-600" />

            {/* Modal Header */}
            <div className="p-6 border-b border-amber-100 dark:border-amber-950 flex justify-between items-center bg-amber-50/20 dark:bg-amber-950/5">
              <h3 className="font-bold text-lg text-amber-900 dark:text-amber-200 font-heading">
                ประวัติทำเนียบศาสนบุคลากรโดยละเอียด
              </h3>
              <button
                onClick={() => setDetailedMonk(null)}
                className="p-1.5 rounded-lg text-amber-800 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
              {/* Header profile info */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pb-4 border-b border-amber-100/50 dark:border-amber-950/40">
                {detailedMonk.image_url ? (
                  <img src={detailedMonk.image_url} className="w-20 h-20 rounded-full object-cover border-2 border-amber-500 shadow-md" alt={detailedMonk.name} />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 border-2 border-amber-500/30 flex items-center justify-center font-bold text-white text-3xl">
                    {detailedMonk.chaya === '-' ? 'ณ' : detailedMonk.chaya[0]}
                  </div>
                )}
                <div className="text-center sm:text-left">
                  <h4 className="font-extrabold text-xl text-amber-950 dark:text-amber-100 font-heading">{detailedMonk.name}</h4>
                  {detailedMonk.chaya !== '-' && (
                    <p className="text-sm text-amber-700 dark:text-amber-455 italic font-semibold">ฉายา: {detailedMonk.chaya}</p>
                  )}
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-900 dark:text-amber-400 border border-amber-500/20">
                      {detailedMonk.rank}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      detailedMonk.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : detailedMonk.status === 'away'
                        ? 'bg-sky-500/10 text-sky-600'
                        : 'bg-amber-500/10 text-amber-700'
                    }`}>
                      {detailedMonk.status === 'active' ? 'จำพรรษาที่วัด' : detailedMonk.status === 'away' ? 'จาริก/ไปวัดอื่น' : 'ลาสิกขาแล้ว'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Domicile & Family Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Ordination Dates */}
                {ranks.find(r => r.name === detailedMonk.rank)?.person_type !== 'disciple' && (
                  <div className="bg-amber-50/10 dark:bg-amber-950/5 p-4 rounded-xl border border-amber-200/30 dark:border-amber-950/20 space-y-2 animate-fade-in">
                    <h5 className="font-bold text-amber-900 dark:text-amber-300 border-b border-amber-200/30 pb-1">วันบรรพชา / อุปสมบท</h5>
                    <p className="text-amber-800 dark:text-amber-400">
                      วันที่บรรพชา (สามเณร): <strong className="text-amber-950 dark:text-amber-200">{detailedMonk.novice_ordination_date || 'ไม่ระบุ/อุปสมบทตรง'}</strong>
                    </p>
                    <p className="text-amber-800 dark:text-amber-400">
                      วันที่อุปสมบท (พระสงฆ์): <strong className="text-amber-950 dark:text-amber-200">{detailedMonk.ordination_date || 'ไม่ระบุ/เป็นสามเณร'}</strong>
                    </p>
                  </div>
                )}

                {/* Contact */}
                <div className="bg-amber-50/10 dark:bg-amber-950/5 p-4 rounded-xl border border-amber-200/30 dark:border-amber-950/20 space-y-2">
                  <h5 className="font-bold text-amber-900 dark:text-amber-300 border-b border-amber-200/30 pb-1">การติดต่อ</h5>
                  <p className="text-amber-800 dark:text-amber-400">
                    เบอร์โทรศัพท์: <strong className="text-amber-950 dark:text-amber-200">{detailedMonk.phone || 'ไม่ระบุ'}</strong>
                  </p>
                </div>

                {/* Parents Info */}
                <div className="bg-amber-50/10 dark:bg-amber-950/5 p-4 rounded-xl border border-amber-200/30 dark:border-amber-950/20 space-y-2">
                  <h5 className="font-bold text-amber-900 dark:text-amber-300 border-b border-amber-200/30 pb-1">ข้อมูลบิดา - มารดา</h5>
                  <p className="text-amber-800 dark:text-amber-400">
                    ชื่อบิดา: <strong className="text-amber-950 dark:text-amber-200">{detailedMonk.father_name || 'ไม่ระบุ'}</strong>
                  </p>
                  <p className="text-amber-800 dark:text-amber-400">
                    ชื่อมารดา: <strong className="text-amber-950 dark:text-amber-200">{detailedMonk.mother_name || 'ไม่ระบุ'}</strong>
                  </p>
                </div>

                {/* Emergency Contact */}
                <div className="bg-amber-50/10 dark:bg-amber-950/5 p-4 rounded-xl border border-amber-200/30 dark:border-amber-950/20 space-y-2">
                  <h5 className="font-bold text-amber-900 dark:text-amber-300 border-b border-amber-200/30 pb-1">ผู้ติดต่อฉุกเฉิน</h5>
                  <p className="text-amber-800 dark:text-amber-400">
                    ผู้ติดต่อ: <strong className="text-amber-950 dark:text-amber-200">{detailedMonk.emergency_contact || 'ไม่ระบุ'}</strong>
                  </p>
                  <p className="text-amber-800 dark:text-amber-400">
                    เบอร์โทรติดต่อ: <strong className="text-amber-950 dark:text-amber-200">{detailedMonk.emergency_phone || 'ไม่ระบุ'}</strong>
                  </p>
                </div>

                {/* Domicile Address */}
                <div className="col-span-1 md:col-span-2 bg-amber-50/10 dark:bg-amber-950/5 p-4 rounded-xl border border-amber-200/30 dark:border-amber-950/20 space-y-2">
                  <h5 className="font-bold text-amber-900 dark:text-amber-300 border-b border-amber-200/30 pb-1">ที่อยู่ตามภูมิลำเนาเดิม</h5>
                  <p className="text-amber-800 dark:text-amber-400 leading-relaxed">
                    {detailedMonk.domicile_address || 'ไม่มีข้อมูลที่อยู่ตามภูมิลำเนา'}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <div className="pt-4 border-t border-amber-100 dark:border-amber-950 text-right">
                <Button
                  onClick={() => setDetailedMonk(null)}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2.5 px-6 rounded-xl border-none shadow-md shadow-amber-500/10 cursor-pointer"
                >
                  ปิดหน้าต่าง
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
