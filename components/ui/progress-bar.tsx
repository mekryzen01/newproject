'use client';

import React from 'react';
import { UploadCloud, FileCheck, Terminal } from 'lucide-react';

interface UploadProgressBarProps {
  isOpen: boolean;
  progress: number;
  title?: string;
  subtitle?: string;
  logs?: string[];
}

export function UploadProgressBar({
  isOpen,
  progress,
  title = 'กำลังอัปโหลดไฟล์และประมวลผล...',
  subtitle = 'โปรดรอสักครู่ ระบบกำลังจัดเก็บไฟล์และสแกนอ่านข้อมูล',
  logs = []
}: UploadProgressBarProps) {
  if (!isOpen) return null;

  const boundedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white dark:bg-[#1a150e] border border-amber-200 dark:border-amber-950 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4 animate-scale-up text-center">
        {/* Animated Icon */}
        <div className="w-14 h-14 rounded-full bg-linear-to-tr from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-amber-500/20 animate-bounce">
          {boundedProgress >= 100 ? (
            <FileCheck className="size-7" />
          ) : (
            <UploadCloud className="size-7 animate-pulse" />
          )}
        </div>

        {/* Status Title & Subtitle */}
        <div className="space-y-1">
          <h3 className="font-extrabold text-sm text-amber-950 dark:text-amber-100 font-heading">
            {boundedProgress >= 100 ? 'การอัปโหลดและประมวลผลเสร็จสิ้น!' : title}
          </h3>
          <p className="text-[11px] text-amber-800/70 dark:text-amber-400/70">
            {subtitle}
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="space-y-1.5">
          <div className="w-full h-3 bg-amber-100 dark:bg-amber-950/60 rounded-full overflow-hidden p-0.5 border border-amber-200/50">
            <div
              className="h-full bg-linear-to-r from-amber-400 via-amber-500 to-amber-600 rounded-full transition-all duration-300 ease-out shadow-sm"
              style={{ width: `${boundedProgress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono font-bold text-amber-800/70 dark:text-amber-400/70 px-1">
            <span>{boundedProgress < 100 ? 'PROCESSING' : 'COMPLETED'}</span>
            <span>{boundedProgress}%</span>
          </div>
        </div>

        {/* Live Activity Logger Console */}
        {logs.length > 0 && (
          <div className="bg-amber-950/90 dark:bg-black/80 rounded-xl p-3 text-left font-mono text-[10px] space-y-1 border border-amber-800/30 max-h-28 overflow-y-auto shadow-inner">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold border-b border-amber-800/40 pb-1 mb-1">
              <Terminal className="size-3" />
              <span>LIVE PROCESS LOGS:</span>
            </div>
            {logs.map((log, idx) => (
              <div key={idx} className="text-amber-200/90 flex items-start gap-1">
                <span className="text-amber-500 shrink-0">›</span>
                <span className="break-all">{log}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Top Global Navigation & Loading Progress Bar
 */
export function TopLoadingBar({ isLoading }: { isLoading: boolean }) {
  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[999999] h-1.5 bg-amber-200/30 overflow-hidden pointer-events-none">
      <div className="h-full bg-linear-to-r from-amber-400 via-amber-500 to-amber-600 animate-pulse transition-all duration-300 w-full" />
    </div>
  );
}
