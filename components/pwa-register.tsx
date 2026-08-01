'use client';

import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { offlineSyncManager } from '@/lib/offlineSync';

export function PwaRegister() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [showToast, setShowToast] = useState<boolean>(false);

  useEffect(() => {
    // 1. Initial state
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const pending = offlineSyncManager.getPendingActions();
      setPendingCount(pending.length);

      // Register Service Worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => console.log('[PWA] Service Worker registered with scope:', reg.scope))
          .catch((err) => console.warn('[PWA] Service Worker registration failed:', err));
      }
    }

    // 2. Online / Offline listeners
    const handleOnline = async () => {
      setIsOnline(true);
      setShowToast(true);
      
      // Auto sync pending items
      const pending = offlineSyncManager.getPendingActions();
      if (pending.length > 0) {
        setSyncStatus('syncing');
        const res = await offlineSyncManager.syncPendingItems();
        setSyncStatus('synced');
        setPendingCount(0);
        setTimeout(() => setSyncStatus('idle'), 4000);
      } else {
        setTimeout(() => setShowToast(false), 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowToast(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showToast && isOnline && pendingCount === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-bounce-subtle pointer-events-auto no-print">
      {!isOnline ? (
        <div className="bg-amber-900/90 dark:bg-amber-950/95 backdrop-blur-md text-amber-100 px-4 py-2.5 rounded-2xl border border-amber-500/30 shadow-2xl flex items-center gap-3 text-xs font-bold">
          <div className="w-7 h-7 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <WifiOff className="size-4 animate-pulse" />
          </div>
          <div>
            <div>กำลังทำงานในโหมดออฟไลน์ (No Internet)</div>
            <div className="text-[10px] text-amber-300/80 font-normal">
              {pendingCount > 0 
                ? `มีรายการรอซิงค์ ${pendingCount} รายการ (จะซิงค์ให้อัตโนมัติเมื่อเน็ตกลับมา)`
                : 'สามารถเรียกดูตารางงานและข้อมูลที่แคชไว้ได้'}
            </div>
          </div>
        </div>
      ) : syncStatus === 'syncing' ? (
        <div className="bg-emerald-900/90 backdrop-blur-md text-emerald-100 px-4 py-2.5 rounded-2xl border border-emerald-500/30 shadow-2xl flex items-center gap-3 text-xs font-bold">
          <RefreshCw className="size-4 text-emerald-400 animate-spin" />
          <span>เน็ตกลับมาแล้ว! กำลังซิงค์ข้อมูลออฟไลน์...</span>
        </div>
      ) : syncStatus === 'synced' ? (
        <div className="bg-emerald-800/90 backdrop-blur-md text-emerald-100 px-4 py-2.5 rounded-2xl border border-emerald-500/30 shadow-2xl flex items-center gap-3 text-xs font-bold">
          <CheckCircle2 className="size-4 text-emerald-300" />
          <span>ซิงค์ข้อมูลออฟไลน์เรียบร้อยแล้ว!</span>
        </div>
      ) : (
        <div className="bg-emerald-950/90 backdrop-blur-md text-emerald-100 px-4 py-2 rounded-xl border border-emerald-500/30 shadow-lg flex items-center gap-2 text-xs font-semibold">
          <Wifi className="size-3.5 text-emerald-400" />
          <span>เชื่อมต่ออินเทอร์เน็ตแล้ว</span>
        </div>
      )}
    </div>
  );
}
