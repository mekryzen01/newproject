import { db } from '@/lib/db';

const OFFLINE_QUEUE_KEY = 'watdongos_offline_action_queue';

export type OfflineEntityType = 'finance' | 'funeral' | 'event' | 'monk' | 'sala_booking' | 'inventory' | 'ashes' | 'monk_duty';

export interface PendingOfflineAction {
  id: string;
  type: OfflineEntityType;
  action: 'create' | 'update' | 'delete';
  data: any;
  label: string;
  created_at: string;
}

export const offlineSyncManager = {
  // Get list of pending offline actions
  getPendingActions(): PendingOfflineAction[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to read offline action queue:', e);
      return [];
    }
  },

  // Queue any form data/action when offline
  queueAction(
    type: OfflineEntityType,
    action: 'create' | 'update' | 'delete',
    data: any,
    label: string
  ): PendingOfflineAction {
    const list = this.getPendingActions();
    const item: PendingOfflineAction = {
      id: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      action,
      data,
      label: label || 'รายการจัดเก็บออฟไลน์',
      created_at: new Date().toISOString()
    };
    list.push(item);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(list));
    console.log('[OfflineSync] Action queued for sync:', item);
    return item;
  },

  // Clear offline action queue
  clearQueue(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  },

  // Sync queued items to Supabase when back online
  async syncPendingItems(): Promise<{ success: number; failed: number; syncedLabels: string[] }> {
    const list = this.getPendingActions();
    if (list.length === 0) return { success: 0, failed: 0, syncedLabels: [] };

    let successCount = 0;
    let failedCount = 0;
    const syncedLabels: string[] = [];
    const remaining: PendingOfflineAction[] = [];

    for (const item of list) {
      try {
        if (item.action === 'delete') {
          const targetId = typeof item.data === 'string' ? item.data : item.data.id;
          if (item.type === 'finance') await db.finance.delete(targetId);
          else if (item.type === 'event') await db.events.delete(targetId);
          else if (item.type === 'monk') await db.monks.delete(targetId);
          else if (item.type === 'sala_booking') await db.salaBookings.delete(targetId);
          else if (item.type === 'funeral') await db.funeralArrangements.delete(targetId);
          else if (item.type === 'inventory') await db.inventory.delete(targetId);
          else if (item.type === 'ashes') await db.ashes.delete(targetId);
          else if (item.type === 'monk_duty') await db.monkDuties.delete(targetId);
        } else {
          // Save (Create/Update)
          if (item.type === 'finance') await db.finance.save(item.data);
          else if (item.type === 'event') await db.events.save(item.data);
          else if (item.type === 'monk') await db.monks.save(item.data);
          else if (item.type === 'sala_booking') await db.salaBookings.save(item.data);
          else if (item.type === 'funeral') await db.funeralArrangements.save(item.data);
          else if (item.type === 'inventory') await db.inventory.save(item.data);
          else if (item.type === 'ashes') await db.ashes.save(item.data);
          else if (item.type === 'monk_duty') await db.monkDuties.save(item.data);
        }
        successCount++;
        syncedLabels.push(item.label);
        console.log('[OfflineSync] Successfully synced:', item.label);
      } catch (err) {
        console.error('[OfflineSync] Failed to sync item:', item.label, err);
        failedCount++;
        remaining.push(item);
      }
    }

    if (remaining.length > 0) {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
    } else {
      localStorage.removeItem(OFFLINE_QUEUE_KEY);
    }

    return { success: successCount, failed: failedCount, syncedLabels };
  }
};
