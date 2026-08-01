'use client';

import { useState, useEffect } from 'react';
import { db, TempleSettings } from '@/lib/db';

export function useSettingsController() {
  const [settings, setSettings] = useState<TempleSettings>({
    templeName: '',
    abbr: '',
    logoIcon: 'Compass',
    themeColor: 'amber',
    address: '',
    googleMapUrl: ''
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [alertState, setAlertState] = useState<{
    show: boolean;
    variant: 'success' | 'destructive' | 'warning';
    title: string;
    description: string;
  } | null>(null);

  // Load Settings
  const loadSettings = async () => {
    setLoading(true);
    try {
      const config = await db.settings.get();
      setSettings(config);
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!settings.templeName || !settings.abbr) {
      setAlertState({
        show: true,
        variant: 'destructive',
        title: 'ข้อมูลไม่ครบถ้วน',
        description: 'กรุณากรอกชื่อวัด และ อักษรย่อให้ครบทุกช่องทางการกรอกข้อมูล'
      });
      return;
    }

    setIsSaving(true);
    setAlertState(null);
    try {
      await db.settings.save(settings);
      
      // Dispatch custom event to notify layout layout state changes
      window.dispatchEvent(new CustomEvent('temple_settings_changed'));
      
      // Show Shadcn Alert
      setAlertState({
        show: true,
        variant: 'success',
        title: 'บันทึกการตั้งค่าสำเร็จ',
        description: 'ข้อมูลการตั้งค่าชื่อวัด โลโก้ และโทนสีได้รับการจัดเก็บและปรับแต่งระบบเรียบร้อยแล้ว'
      });

      // Clear success alert after 4 seconds
      setTimeout(() => {
        setAlertState(null);
      }, 4000);
    } catch (err) {
      setAlertState({
        show: true,
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาด',
        description: 'เกิดข้อขัดข้องในการบันทึกค่าลงในคลังข้อมูล'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const [confirmState, setConfirmState] = useState<{
    show: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  const handleReset = () => {
    setConfirmState({
      show: true,
      title: 'คืนค่าเริ่มต้นระบบ',
      description: 'ต้องการคืนค่าการตั้งค่าชื่อวัดและสีธีมกลับเป็นค่าเริ่มต้นระบบใช่หรือไม่? ข้อมูลการตั้งค่าปัจจุบันจะถูกเขียนทับ',
      onConfirm: async () => {
        setConfirmState(null);
        const defaultSettings: TempleSettings = {
          templeName: 'วัด',
          abbr: 'TEMPLE OS',
          logoIcon: 'Compass',
          themeColor: 'amber'
        };
        setSettings(defaultSettings);
        try {
          await db.settings.save(defaultSettings);
          window.dispatchEvent(new CustomEvent('temple_settings_changed'));
          setAlertState({
            show: true,
            variant: 'warning',
            title: 'รีเซ็ตค่ากลับเป็นเริ่มต้น',
            description: 'คืนค่าระบบกลับเป็นค่าเริ่มต้นดั้งเดิมเรียบร้อยแล้ว'
          });
        } catch (err) {
          setAlertState({
            show: true,
            variant: 'destructive',
            title: 'เกิดข้อผิดพลาดในการรีเซ็ต',
            description: 'ไม่สามารถกู้คืนค่าตั้งค่าเริ่มต้นระบบวัดได้สำเร็จ'
          });
        }
      }
    });
  };

  const updateSettingField = <K extends keyof TempleSettings>(field: K, value: TempleSettings[K]) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  return {
    settings,
    loading,
    isSaving,
    alertState,
    confirmState,
    setConfirmState,
    handleSave,
    handleReset,
    updateSettingField,
    setAlertState
  };
}
