'use client';

import { useState, useEffect } from 'react';
import { db, MenuItem } from '@/lib/db';

export function useMenuManagerController() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Save State
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

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<MenuItem> | null>(null);

  const sortMenusList = (items: MenuItem[]) => {
    // Separate parents and submenus
    const parents = items.filter(m => !m.parentId).sort((a, b) => a.order - b.order);
    const submenus = items.filter(m => m.parentId);
    
    const result: MenuItem[] = [];
    parents.forEach(parent => {
      result.push(parent);
      const parentSubs = submenus
        .filter(s => s.parentId === parent.id)
        .sort((a, b) => a.order - b.order);
      result.push(...parentSubs);
    });

    // Add any orphaned submenus at the end
    const orphaned = submenus.filter(s => !parents.some(p => p.id === s.parentId));
    result.push(...orphaned);

    return result;
  };

  // Load Menus
  const loadMenus = async () => {
    setLoading(true);
    try {
      const list = await db.menus.list();
      setMenus(sortMenusList(list));
    } catch (err) {
      console.error('Failed to load menu list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenus();
  }, []);

  // Enable/Disable toggle
  const handleToggleActive = (id: string) => {
    const updated = menus.map(item => {
      if (item.id === id) {
        if (item.href === '/dashboard/menu-manager') {
          setAlertState({
            show: true,
            variant: 'warning',
            title: 'คำเตือนระบบ',
            description: 'ไม่แนะนำให้ปิดการใช้งานเมนูนี้ เนื่องจากจะทำให้เข้าสู่หน้าควบคุมจัดการเมนูระบบไม่ได้ในภายหลัง'
          });
          setTimeout(() => setAlertState(null), 6000);
        }
        return { ...item, isActive: !item.isActive };
      }
      return item;
    });
    setMenus(updated);
  };


  // Reorder sorting up/down (within the same parent level)
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const current = menus[index];
    const isSub = !!current.parentId;
    
    // Find neighbors with same parentId context
    const itemsSameContext = menus.filter(m => isSub ? m.parentId === current.parentId : !m.parentId);
    const inContextIndex = itemsSameContext.findIndex(m => m.id === current.id);
    
    if (direction === 'up' && inContextIndex === 0) return; // already at top of its category
    if (direction === 'down' && inContextIndex === itemsSameContext.length - 1) return; // already at bottom

    const targetInContextIndex = direction === 'up' ? inContextIndex - 1 : inContextIndex + 1;
    const targetItem = itemsSameContext[targetInContextIndex];

    // Swap orders
    const newMenus = menus.map(m => {
      if (m.id === current.id) {
        return { ...m, order: targetItem.order };
      }
      if (m.id === targetItem.id) {
        return { ...m, order: current.order };
      }
      return m;
    });

    setMenus(sortMenusList(newMenus));
  };

  const handleOpenAddModal = () => {
    // Default values
    setCurrentItem({
      id: `menu-${Date.now()}`,
      name: '',
      href: '',
      iconName: 'Settings',
      isActive: true,
      order: menus.length + 1,
      parentId: null,
      roleAccess: 'admin,editor,staff,member'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: MenuItem) => {
    setCurrentItem({ ...item });
    setIsModalOpen(true);
  };

  const handleDeleteItem = (id: string) => {
    const target = menus.find(m => m.id === id);
    if (!target) return;

    if (target.href === '/dashboard/menu-manager') {
      setAlertState({
        show: true,
        variant: 'destructive',
        title: 'ระบบไม่สามารถดำเนินการได้',
        description: 'ไม่สามารถลบเมนู "จัดการเมนูระบบ" ได้เนื่องจากเป็นระบบควบคุมหลัก'
      });
      return;
    }

    const message = target.href === '#'
      ? 'หากลบเมนูหลักนี้ เมนูย่อยทั้งหมดภายใต้เมนูนี้จะถูกลบไปด้วย คุณต้องการลบใช่หรือไม่?'
      : 'คุณต้องการลบเมนูนี้ออกจากระบบใช่หรือไม่?';

    setConfirmState({
      show: true,
      title: 'ยืนยันการลบเมนู',
      description: message,
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await db.menus.delete(id);
          
          // Refresh sidebar and local state
          window.dispatchEvent(new CustomEvent('temple_menu_changed'));
          loadMenus();
          setAlertState({
            show: true,
            variant: 'success',
            title: 'ลบเมนูสำเร็จ',
            description: 'ระบบดำเนินการลบเมนูและเมนูย่อยเรียบร้อยแล้ว'
          });
          setTimeout(() => setAlertState(null), 4000);
        } catch (err) {
          setAlertState({
            show: true,
            variant: 'destructive',
            title: 'เกิดข้อผิดพลาดในการลบ',
            description: 'ไม่สามารถดำเนินการลบเมนูนี้ได้'
          });
        }
      }
    });
  };

  const handleSaveItemModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem || !currentItem.name || !currentItem.href) return;

    setIsSaving(true);
    try {
      // Correct empty string to null parentId
      const toSave = {
        ...currentItem,
        parentId: currentItem.parentId === '' ? null : currentItem.parentId
      } as MenuItem;

      await db.menus.save(toSave);
      
      // Auto sorting orders when saving
      const updatedList = await db.menus.list();
      const sorted = sortMenusList(updatedList);
      await db.menus.saveAll(sorted);
      
      setIsModalOpen(false);
      setCurrentItem(null);
      
      // Reload & Sync layout sidebar
      window.dispatchEvent(new CustomEvent('temple_menu_changed'));
      loadMenus();
      setAlertState({
        show: true,
        variant: 'success',
        title: 'บันทึกเมนูสำเร็จ',
        description: 'จัดเก็บข้อมูลโครงสร้างเมนูเรียบร้อยแล้ว'
      });
      setTimeout(() => setAlertState(null), 4000);
    } catch (err) {
      setAlertState({
        show: true,
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาดในการบันทึกเมนู',
        description: 'ไม่สามารถบันทึกการเปลี่ยนแปลงโครงสร้างเมนูได้'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAllGrid = async () => {
    setIsSaving(true);
    setAlertState(null);
    try {
      await db.menus.saveAll(menus);
      setAlertState({
        show: true,
        variant: 'success',
        title: 'บันทึกโครงสร้างเมนูสำเร็จ',
        description: 'จัดเก็บการตั้งค่าโครงสร้างเมนูย่อยและจัดเรียงเรียบร้อยแล้ว แถบนำทางด้านข้างได้รับการอัปเดตแบบเรียลไทม์'
      });
      window.dispatchEvent(new CustomEvent('temple_menu_changed'));
      setTimeout(() => setAlertState(null), 4000);
    } catch (err) {
      setAlertState({
        show: true,
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาดในการบันทึก',
        description: 'ไม่สามารถบันทึกการจัดเรียงลำดับเมนูได้'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setConfirmState({
      show: true,
      title: 'รีเซ็ตโครงสร้างเมนู',
      description: 'คุณต้องการรีเซ็ตโครงสร้างเมนู และชื่อเมนูทั้งหมดกลับเป็นค่าเริ่มต้นจากทางระบบใช่หรือไม่? การตั้งค่าโครงสร้างเดิมที่บันทึกไว้จะสูญหาย',
      onConfirm: async () => {
        setConfirmState(null);
        setLoading(true);
        try {
          const list = await db.menus.reset();
          setMenus(sortMenusList(list));
          window.dispatchEvent(new CustomEvent('temple_menu_changed'));
          setAlertState({
            show: true,
            variant: 'success',
            title: 'รีเซ็ตโครงสร้างเมนูสำเร็จ',
            description: 'โครงสร้างแถบนำทางและลำดับเมนูถูกกู้คืนเป็นค่าเริ่มต้นเรียบร้อยแล้ว'
          });
          setTimeout(() => setAlertState(null), 4000);
        } catch (err) {
          setAlertState({
            show: true,
            variant: 'destructive',
            title: 'เกิดข้อผิดพลาดในการรีเซ็ต',
            description: 'ไม่สามารถรีเซ็ตโครงสร้างเมนูกลับเป็นค่าเริ่มต้นได้'
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const updateFormFields = <K extends keyof MenuItem>(field: K, value: MenuItem[K]) => {
    if (!currentItem) return;
    setCurrentItem((prev) => ({ ...prev, [field]: value }));
  };

  // Separate parents for select dropdown
  const parentCandidates = menus.filter(m => !m.parentId && m.href === '#');

  return {
    menus,
    setMenus,
    loading,
    isSaving,
    alertState,
    confirmState,
    setConfirmState,
    isModalOpen,
    setIsModalOpen,
    currentItem,
    handleToggleActive,
    handleMove,
    handleOpenAddModal,
    handleOpenEditModal,
    handleDeleteItem,
    handleSaveItemModal,
    handleSaveAllGrid,
    handleReset,
    updateFormFields,
    parentCandidates
  };
}
