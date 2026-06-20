'use client';

import { useState, useEffect } from 'react';
import { db, InventoryItem, BorrowRecord } from '@/lib/db';

export function useInventoryController() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'borrow'>('inventory');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [borrowRecords, setBorrowRecords] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<InventoryItem> | null>(null);

  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
  const [currentBorrow, setCurrentBorrow] = useState<Partial<BorrowRecord> | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);

  const [alertState, setAlertState] = useState<{
    show: boolean;
    variant: 'success' | 'destructive' | 'warning';
    title: string;
    description: string;
  } | null>(null);

  const [confirmState, setConfirmState] = useState<{
    show: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [invList, borrowList] = await Promise.all([
        db.inventory.list(),
        db.borrow.list()
      ]);
      setInventory(invList);
      setBorrowRecords(borrowList);
    } catch (err) {
      console.error('Failed to load inventory data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Item Form Methods
  const handleOpenAddItemModal = () => {
    setCurrentItem({
      id: `i-${Date.now()}`,
      name: '',
      total_qty: 1,
      available_qty: 1,
      category: 'อุปกรณ์จัดงาน',
      condition: 'excellent'
    });
    setIsItemModalOpen(true);
  };

  const handleOpenEditItemModal = (item: InventoryItem) => {
    setCurrentItem({ ...item });
    setIsItemModalOpen(true);
  };

  const handleDeleteItem = (id: string) => {
    setConfirmState({
      show: true,
      title: 'ยืนยันการลบครุภัณฑ์',
      description: 'คุณแน่ใจว่าต้องการลบครุภัณฑ์ชิ้นนี้ออกจากระบบ? การดำเนินการนี้ไม่สามารถย้อนกลับได้',
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await db.inventory.delete(id);
          loadData();
          setAlertState({
            show: true,
            variant: 'success',
            title: 'ลบครุภัณฑ์สำเร็จ',
            description: 'ลบข้อมูลครุภัณฑ์เรียบร้อยแล้ว'
          });
          setTimeout(() => setAlertState(null), 4000);
        } catch (err) {
          setAlertState({
            show: true,
            variant: 'destructive',
            title: 'เกิดข้อผิดพลาดในการลบ',
            description: 'ไม่สามารถลบข้อมูลครุภัณฑ์รายการนี้ได้'
          });
        }
      }
    });
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem || !currentItem.name || currentItem.total_qty === undefined) return;

    setIsSaving(true);
    try {
      // For new item or adjustments, sync available qty
      const updated = {
        ...currentItem,
        available_qty: currentItem.available_qty === undefined ? currentItem.total_qty : currentItem.available_qty
      } as InventoryItem;
      
      await db.inventory.save(updated);
      setIsItemModalOpen(false);
      setCurrentItem(null);
      loadData();
      setAlertState({
        show: true,
        variant: 'success',
        title: 'บันทึกครุภัณฑ์สำเร็จ',
        description: 'บันทึกข้อมูลครุภัณฑ์เรียบร้อยแล้ว'
      });
      setTimeout(() => setAlertState(null), 4000);
    } catch (err) {
      setAlertState({
        show: true,
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาดในการบันทึกครุภัณฑ์',
        description: 'ไม่สามารถบันทึกข้อมูลครุภัณฑ์รายการนี้ได้'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Borrow Form Methods
  const handleOpenAddBorrowModal = () => {
    setCurrentBorrow({
      id: `b-${Date.now()}`,
      item_id: '',
      item_name: '',
      borrower_name: '',
      borrower_phone: '',
      borrow_qty: 1,
      borrow_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days default
      return_date: null,
      status: 'borrowed'
    });
    setIsBorrowModalOpen(true);
  };

  const handleReturnItem = (record: BorrowRecord) => {
    setConfirmState({
      show: true,
      title: 'ยืนยันการรับคืนของ',
      description: `คุณต้องการยืนยันการรับคืนของจาก "${record.borrower_name}" ใช่หรือไม่?`,
      onConfirm: async () => {
        setConfirmState(null);
        try {
          const updatedRecord: BorrowRecord = {
            ...record,
            return_date: new Date().toISOString().split('T')[0],
            status: 'returned'
          };
          await db.borrow.save(updatedRecord);
          loadData();
          setAlertState({
            show: true,
            variant: 'success',
            title: 'คืนของสำเร็จ',
            description: 'บันทึกการรับคืนของเรียบร้อยแล้ว'
          });
          setTimeout(() => setAlertState(null), 4000);
        } catch (err) {
          setAlertState({
            show: true,
            variant: 'destructive',
            title: 'เกิดข้อผิดพลาดในการคืนของ',
            description: 'ไม่สามารถดำเนินการรับคืนของรายการนี้ได้'
          });
        }
      }
    });
  };

  const handleSaveBorrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBorrow || !currentBorrow.borrower_name || !currentBorrow.item_id || !currentBorrow.borrow_qty) return;

    // Check available stock
    const targetItem = inventory.find(i => i.id === currentBorrow.item_id);
    if (!targetItem) return;

    if (currentBorrow.borrow_qty > targetItem.available_qty) {
      setAlertState({
        show: true,
        variant: 'warning',
        title: 'ครุภัณฑ์ไม่เพียงพอ',
        description: `ปัจจุบัน "${targetItem.name}" ในคลังเหลือให้ยืมเพียง ${targetItem.available_qty} ชิ้นเท่านั้น`
      });
      return;
    }

    setIsSaving(true);
    try {
      const selectedItemName = targetItem.name;
      const updatedBorrow = {
        ...currentBorrow,
        item_name: selectedItemName
      } as BorrowRecord;

      await db.borrow.save(updatedBorrow);
      setIsBorrowModalOpen(false);
      setCurrentBorrow(null);
      loadData();
      setAlertState({
        show: true,
        variant: 'success',
        title: 'ยืมครุภัณฑ์สำเร็จ',
        description: 'บันทึกการยืมครุภัณฑ์และปรับจำนวนในคลังเรียบร้อยแล้ว'
      });
      setTimeout(() => setAlertState(null), 4000);
    } catch (err) {
      setAlertState({
        show: true,
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาดในการบันทึกการยืม',
        description: 'ไม่สามารถบันทึกข้อมูลการยืมรายการนี้ได้'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBorrow = (id: string) => {
    setConfirmState({
      show: true,
      title: 'ยืนยันการลบประวัติการยืม',
      description: 'ต้องการลบข้อมูลประวัติการยืมนี้ออกใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้',
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await db.borrow.delete(id);
          loadData();
          setAlertState({
            show: true,
            variant: 'success',
            title: 'ลบประวัติสำเร็จ',
            description: 'ลบประวัติการยืมครุภัณฑ์เรียบร้อยแล้ว'
          });
          setTimeout(() => setAlertState(null), 4000);
        } catch (err) {
          setAlertState({
            show: true,
            variant: 'destructive',
            title: 'เกิดข้อผิดพลาดในการลบ',
            description: 'ไม่สามารถลบประวัติการยืมนี้ได้'
          });
        }
      }
    });
  };

  const updateItemFormFields = <K extends keyof InventoryItem>(field: K, value: InventoryItem[K]) => {
    if (!currentItem) return;
    setCurrentItem((prev) => ({ ...prev, [field]: value }));
  };

  const updateBorrowFormFields = <K extends keyof BorrowRecord>(field: K, value: BorrowRecord[K]) => {
    if (!currentBorrow) return;
    setCurrentBorrow((prev) => ({ ...prev, [field]: value }));
  };

  // Filter & Search
  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  const filteredBorrows = borrowRecords.filter(b =>
    b.borrower_name.toLowerCase().includes(search.toLowerCase()) ||
    b.item_name.toLowerCase().includes(search.toLowerCase()) ||
    b.borrower_phone.includes(search)
  );

  return {
    activeTab,
    setActiveTab,
    inventory,
    borrowRecords,
    loading,
    search,
    setSearch,
    isItemModalOpen,
    setIsItemModalOpen,
    currentItem,
    isBorrowModalOpen,
    setIsBorrowModalOpen,
    currentBorrow,
    isSaving,
    alertState,
    confirmState,
    setConfirmState,
    handleOpenAddItemModal,
    handleOpenEditItemModal,
    handleDeleteItem,
    handleSaveItem,
    handleOpenAddBorrowModal,
    handleReturnItem,
    handleSaveBorrow,
    handleDeleteBorrow,
    updateItemFormFields,
    updateBorrowFormFields,
    filteredInventory,
    filteredBorrows
  };
}
