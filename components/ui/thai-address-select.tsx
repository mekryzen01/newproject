'use client';

import React, { useState, useEffect, useMemo } from 'react';

interface ThaiAddressSelectProps {
  province?: string;
  amphoe?: string;
  tambon?: string;
  onProvinceChange?: (value: string) => void;
  onAmphoeChange?: (value: string) => void;
  onTambonChange?: (value: string) => void;
  disabled?: boolean;
}

export function ThaiAddressSelect({
  province = '',
  amphoe = '',
  tambon = '',
  onProvinceChange,
  onAmphoeChange,
  onTambonChange,
  disabled = false,
}: ThaiAddressSelectProps) {
  const [thaiProvinces, setThaiProvinces] = useState<any[]>([]);

  useEffect(() => {
    // Dynamically import address data to optimize initial bundle size
    import('@/lib/thai-address-data').then((mod) => {
      setThaiProvinces(mod.THAI_PROVINCES);
    });
  }, []);

  const selectedProvince = useMemo(
    () => thaiProvinces.find(p => p.name === province),
    [thaiProvinces, province]
  );

  const selectedDistrict = useMemo(
    () => selectedProvince?.districts.find((d: any) => d.name === amphoe),
    [selectedProvince, amphoe]
  );

  const selectClass = "w-full px-3 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="grid grid-cols-3 gap-3">
      {/* จังหวัด */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-amber-900/80 dark:text-amber-350">จังหวัด</label>
        <select
          value={province}
          onChange={(e) => {
            onProvinceChange?.(e.target.value);
            onAmphoeChange?.('');
            onTambonChange?.('');
          }}
          disabled={disabled || thaiProvinces.length === 0}
          className={selectClass}
        >
          <option value="">{thaiProvinces.length === 0 ? 'กำลังโหลดข้อมูล...' : '-- เลือกจังหวัด --'}</option>
          {thaiProvinces.map(p => (
            <option key={p.name} value={p.name}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* อำเภอ */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-amber-900/80 dark:text-amber-350">อำเภอ</label>
        <select
          value={amphoe}
          onChange={(e) => {
            onAmphoeChange?.(e.target.value);
            onTambonChange?.('');
          }}
          disabled={disabled || !province || thaiProvinces.length === 0}
          className={selectClass}
        >
          <option value="">-- เลือกอำเภอ --</option>
          {selectedProvince?.districts.map((d: any) => (
            <option key={d.name} value={d.name}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* ตำบล */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-amber-900/80 dark:text-amber-350">ตำบล</label>
        <select
          value={tambon}
          onChange={(e) => onTambonChange?.(e.target.value)}
          disabled={disabled || !amphoe || thaiProvinces.length === 0}
          className={selectClass}
        >
          <option value="">-- เลือกตำบล --</option>
          {selectedDistrict?.subdistricts.map((s: string) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
