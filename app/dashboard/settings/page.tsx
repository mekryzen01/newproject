'use client';

import React from 'react';
import {
  Compass,
  Activity,
  Award,
  BookOpen,
  Save,
  RotateCcw,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSettingsController } from '@/app/Controllers/useSettingsController';
import { CustomDialog } from '@/components/ui/custom-dialog';
import { usePermission } from '@/lib/usePermission';

export default function SettingsPage() {
  const { permissions } = usePermission();
  const [origin, setOrigin] = React.useState('https://your-domain.com');
  const [isUploadingLogo, setIsUploadingLogo] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const {
    settings,
    loading,
    isSaving,
    alertState,
    confirmState,
    setConfirmState,
    handleSave,
    handleReset,
    updateSettingField
  } = useSettingsController();

  // Icon listing helper
  const icons = [
    { name: 'Compass', icon: Compass, desc: 'เข็มทิศธรรมะ' },
    { name: 'Activity', icon: Activity, desc: 'งานกุศลเคลื่อนไหว' },
    { name: 'Award', icon: Award, desc: 'รางวัลสมณศักดิ์' },
    { name: 'BookOpen', icon: BookOpen, desc: 'พระไตรปิฎก/การศึกษา' }
  ];

  // Theme color choices helper
  const colors = [
    { name: 'amber', class: 'bg-amber-500 ring-amber-500/30', label: 'ทองจีวร (Amber)' },
    { name: 'emerald', class: 'bg-emerald-500 ring-emerald-500/30', label: 'เขียวมรกต (Emerald)' },
    { name: 'indigo', class: 'bg-indigo-500 ring-indigo-500/30', label: 'ครามน้ำเงิน (Indigo)' },
    { name: 'rose', class: 'bg-rose-500 ring-rose-500/30', label: 'กุหลาบแดง (Rose)' },
    { name: 'slate', class: 'bg-slate-700 ring-slate-700/30', label: 'เทาโมเดิร์น (Slate)' }
  ];

  if (loading) {
    return (
      <div className="p-12 text-center animate-pulse-subtle">
        <Loader2 className="size-8 text-amber-500 animate-spin mx-auto mb-2" />
        <p className="text-xs font-bold text-amber-700/65">กำลังโหลดการตั้งค่าระบบ...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading text-amber-900 dark:text-amber-200">
            ตั้งค่าระบบวัดอัจฉริยะ (System Settings)
          </h2>
          <p className="text-xs text-amber-700/50 dark:text-amber-400/50">
            ปรับแต่งชื่อวัด ตราสัญลักษณ์แสดง และสีสันของระบบตามเอกลักษณ์ของแต่ละวัด
          </p>
        </div>
        {permissions.canEditSettings && (
          <div className="flex gap-2">
            <Button
              onClick={handleReset}
              variant="outline"
              className="border-amber-200 hover:bg-amber-500/10 text-amber-800 dark:text-amber-400 text-xs font-bold py-5 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="size-4" />
              คืนค่าเริ่มต้น
            </Button>
            <Button
              onClick={() => handleSave()}
              disabled={isSaving}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-5 px-5 rounded-xl flex items-center gap-1.5 border-none shadow-md shadow-amber-500/10 cursor-pointer"
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              บันทึกการตั้งค่า
            </Button>
          </div>
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


      {/* Settings Form Layout */}
      <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 p-6 shadow-md shadow-amber-100/5">
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Temple Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ชื่อวัด (สำหรับแสดงผลที่หัวแถบข้างและบอร์ดหลัก)</label>
            <input
              type="text"
              required
              disabled={!permissions.canEditSettings}
              value={settings.templeName}
              onChange={(e) => updateSettingField('templeName', e.target.value)}
              placeholder="ระบุชื่อเต็มของวัด เช่น วัดสุทัศนเทพวราราม"
              className="w-full px-4 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* Abbreviation abbreviation */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ตัวย่อระบบ / ข้อความย่อคำบรรยาย</label>
            <input
              type="text"
              required
              disabled={!permissions.canEditSettings}
              value={settings.abbr}
              onChange={(e) => updateSettingField('abbr', e.target.value)}
              placeholder="เช่น TEMPLE OS หรือ ว.ศ."
              className="w-full px-4 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* Logo Image URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ตราโลโก้วัด (รองรับ JPG, PNG, WEBP)</label>
            <div className="flex items-center gap-4">
              {/* Logo Preview */}
              <div className="w-16 h-16 rounded-xl border-2 border-amber-200 dark:border-amber-950 bg-amber-50/30 dark:bg-amber-950/10 overflow-hidden flex items-center justify-center shrink-0 text-amber-300 dark:text-amber-700">
                {isUploadingLogo ? (
                  <Loader2 className="size-6 animate-spin text-amber-500" />
                ) : settings.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    className="w-full h-full object-cover"
                    alt="logo preview"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <span className="text-2xl font-bold font-heading">{settings.abbr || settings.templeName?.[0] || 'วัด'}</span>
                )}
              </div>

              {/* Controls */}
              <div className="flex-1 space-y-1.5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    disabled={!permissions.canEditSettings || isUploadingLogo}
                    value={settings.logoUrl || ''}
                    onChange={(e) => updateSettingField('logoUrl', e.target.value)}
                    placeholder="ป้อนลิงก์รูปภาพ หรือกดปุ่มอัปโหลดขวา"
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  
                  {permissions.canEditSettings && (
                    <>
                      <label
                        htmlFor="logo-upload"
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-amber-400 dark:border-amber-700 bg-amber-50/20 dark:bg-amber-950/10 text-xs font-bold text-amber-700 dark:text-amber-400 cursor-pointer hover:bg-amber-500/10 transition-colors shrink-0 ${
                          isUploadingLogo ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                        <span>{isUploadingLogo ? 'กำลังอัปโหลด...' : 'อัปโหลดภาพ'}</span>
                      </label>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploadingLogo}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          setIsUploadingLogo(true);
                          try {
                            const formData = new FormData();
                            formData.append('file', file);

                            const res = await fetch('/api/upload/drive', {
                              method: 'POST',
                              body: formData
                            });

                            const data = await res.json();
                            if (data.success && data.path) {
                              updateSettingField('logoUrl', data.path);
                            } else {
                              alert(data.error || 'ไม่สามารถอัปโหลดโลโก้ได้');
                            }
                          } catch (err: any) {
                            console.error('Upload logo error:', err);
                            alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์เพื่ออัปโหลดโลโก้');
                          } finally {
                            setIsUploadingLogo(false);
                          }
                        }}
                      />
                    </>
                  )}
                </div>
                {settings.logoUrl && (
                  <button
                    type="button"
                    disabled={isUploadingLogo || !permissions.canEditSettings}
                    onClick={() => updateSettingField('logoUrl', '')}
                    className="text-[10px] text-red-500 hover:underline cursor-pointer block disabled:opacity-50"
                  >
                    ลบรูปภาพออก
                  </button>
                )}
                <p className="text-[10px] text-amber-600/50 dark:text-amber-500/40">รองรับไฟล์รูปภาพประเภท JPG, PNG และ WEBP โดยไฟล์จะอัปโหลดขึ้น Google Drive ของระบบ</p>
              </div>
            </div>
          </div>

          {/* LINE Official Account (Messaging API) Configuration */}
          <div className="space-y-4 border-t border-amber-100 dark:border-amber-950/40 pt-6">
            <h4 className="font-extrabold text-sm text-amber-950 dark:text-amber-200 flex items-center gap-1.5 font-heading">
              💬 ตั้งค่าการแจ้งเตือนผ่าน LINE Official Account (Messaging API)
            </h4>
            
            {/* Channel Access Token */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">
                Channel Access Token (Long-lived)
              </label>
              <input
                type="text"
                disabled={!permissions.canEditSettings}
                value={settings.lineChannelAccessToken || ''}
                onChange={(e) => updateSettingField('lineChannelAccessToken', e.target.value)}
                placeholder="กรอก Channel Access Token จาก LINE Developers Console..."
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 disabled:opacity-60 disabled:cursor-not-allowed font-mono"
              />
            </div>

            {/* Group ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">
                LINE Group ID / Chat ID (ไอดีกลุ่มแชทที่ต้องการรับข้อความ)
              </label>
              <input
                type="text"
                disabled={!permissions.canEditSettings}
                value={settings.lineGroupId || ''}
                onChange={(e) => updateSettingField('lineGroupId', e.target.value)}
                placeholder="กรอก Group ID เช่น Ca5f... (ระบบจะบันทึกให้อัตโนมัติเมื่อเชิญบอทเข้ากลุ่ม)"
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 disabled:opacity-60 disabled:cursor-not-allowed font-mono"
              />
              <p className="text-[10px] text-amber-800/40 dark:text-amber-500/40 leading-normal">
                * <strong>ตั้งค่าอัตโนมัติ:</strong> เพียงนำบอทของ LINE OA นี้เชิญเข้าร่วมกลุ่มแชทวัด ระบบจะทำการดักจับและอัปเดตไอดีกลุ่มแชทลงในช่องนี้ให้โดยอัตโนมัติ!
              </p>
            </div>

            {/* Webhook Configuration Guide */}
            <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl space-y-2 text-[11px] text-amber-900/80 dark:text-amber-400">
              <p className="font-extrabold">🔗 ลิงก์สำหรับตั้งค่า Webhook (ใน LINE Developers):</p>
              <div className="flex gap-2">
                <code className="bg-amber-100/50 dark:bg-amber-950/40 p-2 rounded text-xs select-all break-all flex-1 border border-amber-200/30">
                  {origin}/api/line/webhook
                </code>
              </div>
              <p className="leading-normal">
                * <strong>ขั้นตอนการตั้งค่า:</strong> เข้าเว็บ <a href="https://developers.line.biz/" target="_blank" rel="noopener noreferrer" className="underline text-amber-600 hover:text-amber-700 font-bold">LINE Developers</a> &gt; เลือก Channel ของคุณ &gt; แท็บ <strong>Messaging API</strong> &gt; เปิดใช้งาน <strong>Use webhook</strong> &gt; วางลิงก์ Webhook URL ด้านบนนี้ลงไปแล้วกด Verify
              </p>
            </div>
          </div>

          {/* Logo Icon selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300 block">
              สัญลักษณ์โลโก้วัด (ตราธรรมจักร/สัญลักษณ์ไอคอน):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {icons.map((item) => {
                const ItemIcon = item.icon;
                const isSelected = settings.logoIcon === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    disabled={!permissions.canEditSettings}
                    onClick={() => updateSettingField('logoIcon', item.name)}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/5 text-amber-950 dark:text-amber-200 ring-2 ring-amber-500/20'
                        : 'border-amber-200/50 bg-transparent text-amber-800/60 hover:bg-amber-500/5'
                    }`}
                  >
                    <ItemIcon className="size-6" />
                    <span className="text-[10px] font-bold">{item.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color theme selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300 block">
              โทนสีธีมของระบบวัด (Color Scheme Theme):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
              {colors.map((color) => {
                const isSelected = settings.themeColor === color.name;
                return (
                  <button
                    key={color.name}
                    type="button"
                    disabled={!permissions.canEditSettings}
                    onClick={() => updateSettingField('themeColor', color.name as any)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20'
                        : 'border-amber-200/50 bg-transparent hover:bg-amber-500/5'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full ${color.class} ${
                      isSelected ? 'ring-4' : ''
                    }`} />
                    <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200">{color.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </form>
      </div>

    </div>
  );
}
