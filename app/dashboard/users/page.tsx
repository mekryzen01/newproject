'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Plus,
  Edit,
  Trash,
  X,
  Loader2,
  Shield,
  Mail,
  Phone,
  Calendar,
  Lock,
  Search,
  ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUsersController } from '@/app/Controllers/useUsersController';
import { CustomDialog } from '@/components/ui/custom-dialog';
import { usePermission } from '@/lib/usePermission';

export default function UsersManagement() {
  const router = useRouter();
  const { permissions, loaded } = usePermission();
  const {
    users,
    loading,
    isModalOpen,
    setIsModalOpen,
    currentUser,
    isSaving,
    alertState,
    confirmState,
    setConfirmState,
    handleOpenAddModal,
    handleOpenEditModal,
    handleDeleteUser,
    handleSaveUser,
    updateFormFields
  } = useUsersController();

  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery))
  );

  if (!loaded) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="size-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!permissions.canViewUsers) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center animate-fade-in">
        <div className="bg-white dark:bg-[#15110a] border border-amber-200/40 dark:border-amber-950/30 p-8 rounded-2xl max-w-md text-center shadow-xl">
          <ShieldAlert className="size-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-amber-950 dark:text-amber-100 font-heading mb-2">เข้าถึงข้อมูลถูกปฏิเสธ</h3>
          <p className="text-xs text-amber-800/60 dark:text-amber-400/50 leading-relaxed mb-6">
            คุณไม่มีสิทธิ์ในการเข้าถึงหน้าจัดการผู้ใช้งานระบบ เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถเข้าถึงส่วนนี้ได้
          </p>
          <Button onClick={() => router.push('/dashboard')} className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2.5 px-6 rounded-xl border-none">
            กลับหน้าหลักแดชบอร์ด
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading text-amber-900 dark:text-amber-200 flex items-center gap-2">
            <User className="size-7 text-amber-600 dark:text-amber-500" />
            จัดการผู้ใช้งานระบบ
          </h2>
          <p className="text-xs text-amber-700/50 dark:text-amber-400/50">
            บริหารจัดการบัญชีผู้ใช้งาน สิทธิ์การเข้าถึง และการทำงานในฐานข้อมูลระบบวัด
          </p>
        </div>
        {permissions.canEditUsers && (
          <Button
            onClick={handleOpenAddModal}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-5 px-5 rounded-xl flex items-center gap-1.5 border-none shadow-md shadow-amber-500/10 cursor-pointer transition-all"
          >
            <Plus className="size-4" />
            เพิ่มผู้ใช้งานใหม่
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
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-700/40 dark:text-amber-500/30">
            <Search className="size-4" />
          </div>
          <input
            type="text"
            placeholder="ค้นหาตามชื่อ-นามสกุล, อีเมล, เบอร์โทร..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-amber-200/60 dark:border-amber-950 bg-amber-50/10 dark:bg-[#1a150e] text-amber-950 dark:text-amber-100 placeholder-amber-700/30 dark:placeholder-amber-500/20 text-xs outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
        </div>
      </div>

      {/* Users grid display */}
      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center animate-pulse-subtle">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="size-8 text-amber-500 animate-spin" />
            <p className="text-xs font-bold text-amber-700/60 dark:text-amber-500/60">กำลังดึงข้อมูล...</p>
          </div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#15110a] rounded-xl border border-amber-200/40 dark:border-amber-950/30 animate-fade-in">
          <User className="size-12 mx-auto text-amber-200 dark:text-amber-950/50 mb-3" />
          <p className="text-sm text-amber-800/50 dark:text-amber-500/40">ไม่พบรายชื่อผู้ใช้งานตามเงื่อนไขที่ระบุ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 p-6 shadow-md shadow-amber-100/5 flex flex-col justify-between hover:translate-y-[-2px] hover:shadow-lg transition-all duration-300 relative overflow-hidden"
            >
              {/* Corner Role Badge */}
              <div className="absolute top-0 right-0">
                <span className={`text-[9px] font-bold px-3 py-1 rounded-bl-xl border-l border-b border-amber-200/30 dark:border-amber-950/40 ${
                  user.role === 'admin'
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    : user.role === 'editor'
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-500'
                    : 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                }`}>
                  {user.role === 'admin' ? 'ผู้ดูแลระบบ' : user.role === 'editor' ? 'ผู้แก้ไขข้อมูล' : 'เจ้าหน้าที่'}
                </span>
              </div>

              {/* User Content */}
              <div>
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-500/10 to-amber-600/10 border border-amber-500/20 flex items-center justify-center font-bold text-amber-800 dark:text-amber-400 text-base">
                    {user.fullName[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-amber-950 dark:text-amber-100 font-heading">
                      {user.fullName}
                    </h3>
                    <p className="text-[10px] text-amber-700/60 dark:text-amber-400/60">
                      ID: {user.id}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mt-4 pt-4 border-t border-amber-100/50 dark:border-amber-950/40 text-xs">
                  <div className="flex items-center gap-2.5 text-amber-800/80 dark:text-amber-400/80">
                    <Mail className="size-4 text-amber-600 dark:text-amber-500 shrink-0" />
                    <span className="truncate">อีเมล: <strong className="font-semibold text-amber-950 dark:text-amber-200">{user.email}</strong></span>
                  </div>
                  <div className="flex items-center gap-2.5 text-amber-800/80 dark:text-amber-400/80">
                    <Phone className="size-4 text-amber-600 dark:text-amber-500 shrink-0" />
                    <span>เบอร์โทร: <strong className="font-semibold text-amber-950 dark:text-amber-200">{user.phone || 'ไม่ระบุ'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2.5 text-amber-800/80 dark:text-amber-400/80">
                    <Calendar className="size-4 text-amber-600 dark:text-amber-500 shrink-0" />
                    <span>สร้างบัญชีเมื่อ: <strong className="font-semibold text-amber-950 dark:text-amber-200">{user.created_at}</strong></span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              {permissions.canEditUsers && (
                <div className="flex gap-2 mt-6 pt-3 border-t border-amber-100/50 dark:border-amber-950/40">
                  <Button
                    variant="outline"
                    onClick={() => handleOpenEditModal(user)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 border-amber-200 dark:border-amber-950/80 hover:bg-amber-500/10 text-amber-800 dark:text-amber-300 dark:hover:text-amber-200 text-xs font-bold cursor-pointer transition-colors"
                  >
                    <Edit className="size-3.5" />
                    แก้ไขข้อมูล
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteUser(user.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold cursor-pointer"
                  >
                    <Trash className="size-3.5" />
                    ลบผู้ใช้งาน
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit User Dialog Modal */}
      {isModalOpen && currentUser && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/50 dark:border-amber-950/40 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up flex flex-col">
            
            {/* Modal Ribbon Accent */}
            <div className="h-1.5 bg-gradient-to-r from-amber-400 to-amber-600" />

            {/* Modal Header */}
            <div className="p-6 border-b border-amber-100 dark:border-amber-950 flex justify-between items-center bg-amber-50/20 dark:bg-amber-950/5 shrink-0">
              <h3 className="font-bold text-lg text-amber-900 dark:text-amber-200 font-heading">
                {currentUser.fullName ? 'แก้ไขข้อมูลผู้ใช้งาน' : 'เพิ่มบัญชีผู้ใช้งานใหม่'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-amber-800 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveUser} className="flex flex-col space-y-4 p-6">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">
                  ชื่อ-นามสกุลจริง *
                </label>
                <input
                  type="text"
                  required
                  value={currentUser.fullName || ''}
                  onChange={(e) => updateFormFields('fullName', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  placeholder="นายสมเกียรติ ใจซื่อ"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">
                  อีเมลผู้ใช้งาน (ใช้ในการเข้าสู่ระบบ) *
                </label>
                <input
                  type="email"
                  required
                  value={currentUser.email || ''}
                  onChange={(e) => updateFormFields('email', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  placeholder="somkiat@temple.mail.go.th"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">
                  กำหนดรหัสผ่านเข้าใช้งาน *
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={currentUser.password || ''}
                    onChange={(e) => updateFormFields('password', e.target.value)}
                    className="w-full pl-3 pr-8 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    placeholder="รหัสผ่านอย่างน้อย 6 ตัวอักษร"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-amber-700/40">
                    <Lock className="size-3.5" />
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">
                  เบอร์โทรศัพท์ติดต่อ
                </label>
                <input
                  type="text"
                  value={currentUser.phone || ''}
                  onChange={(e) => updateFormFields('phone', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  placeholder="08X-XXX-XXXX"
                />
              </div>

              {/* Role Select */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">
                  สิทธิ์การเข้าใช้งานระบบ *
                </label>
                <select
                  value={currentUser.role || 'staff'}
                  onChange={(e) => updateFormFields('role', e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                >
                  <option value="admin">ผู้ดูแลระบบ (Admin) - จัดการข้อมูลได้ทุกส่วน</option>
                  <option value="editor">ผู้แก้ไขข้อมูล (Editor) - แก้ไขบันทึก แต่เปลี่ยนการตั้งค่าบางส่วนไม่ได้</option>
                  <option value="staff">เจ้าหน้าที่วัด (Staff) - บันทึกข้อมูลและดูรายการได้อย่างเดียว</option>
                </select>
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
