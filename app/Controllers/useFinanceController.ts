'use client';

import { useState, useEffect } from 'react';
import { db, FinancialTransaction } from '@/lib/db';

export function useFinanceController() {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTx, setCurrentTx] = useState<Partial<FinancialTransaction> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Receipt Preview State
  const [printTx, setPrintTx] = useState<FinancialTransaction | null>(null);

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
  const loadTransactions = async () => {
    setLoading(true);
    try {
      const list = await db.finance.list();
      setTransactions(list);
    } catch (err) {
      console.error('Failed to load transaction data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleOpenAddModal = (type: 'income' | 'expense') => {
    setCurrentTx({
      id: `t-${Date.now()}`,
      type,
      amount: 0,
      category: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      donor_name: '',
      receipt_no: type === 'income' ? `RE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}` : undefined
    });
    setIsModalOpen(true);
  };

  const handleDeleteTx = (id: string) => {
    setConfirmState({
      show: true,
      title: 'ยืนยันการลบรายการ',
      description: 'คุณต้องการลบรายการบัญชีนี้ออกใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้',
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await db.finance.delete(id);
          loadTransactions();
          setAlertState({
            show: true,
            variant: 'success',
            title: 'ลบรายการสำเร็จ',
            description: 'ลบรายการธุรกรรมการเงินเรียบร้อยแล้ว'
          });
          setTimeout(() => setAlertState(null), 4000);
        } catch (err) {
          setAlertState({
            show: true,
            variant: 'destructive',
            title: 'เกิดข้อผิดพลาดในการลบรายการ',
            description: 'ไม่สามารถดำเนินการลบรายการธุรกรรมนี้ได้'
          });
        }
      }
    });
  };

  const handleSaveTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTx || !currentTx.amount || !currentTx.category) return;

    setIsSaving(true);
    try {
      await db.finance.save(currentTx as FinancialTransaction);
      setIsModalOpen(false);
      setCurrentTx(null);
      loadTransactions();
      setAlertState({
        show: true,
        variant: 'success',
        title: 'บันทึกรายการสำเร็จ',
        description: 'บันทึกรายการรายรับ-รายจ่ายเรียบร้อยแล้ว'
      });
      setTimeout(() => setAlertState(null), 4000);
    } catch (err) {
      setAlertState({
        show: true,
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาดในการบันทึกรายการ',
        description: 'ไม่สามารถบันทึกรายการธุรกรรมการเงินนี้ได้'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateFormFields = <K extends keyof FinancialTransaction>(field: K, value: FinancialTransaction[K]) => {
    if (!currentTx) return;
    setCurrentTx((prev) => ({ ...prev, [field]: value }));
  };

  const triggerPrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Stats calculation
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // Filter & Search
  const filteredTxs = transactions.filter(t => {
    const matchesSearch = 
      t.category.toLowerCase().includes(search.toLowerCase()) || 
      (t.donor_name && t.donor_name.toLowerCase().includes(search.toLowerCase())) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      (t.receipt_no && t.receipt_no.toLowerCase().includes(search.toLowerCase()));
    
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Thai Number translation for receipt
  const thaiBahtText = (num: number): string => {
    return `${num.toLocaleString('th-TH')} บาทถ้วน`;
  };

  return {
    transactions,
    loading,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    isModalOpen,
    setIsModalOpen,
    currentTx,
    setCurrentTx,
    isSaving,
    printTx,
    setPrintTx,
    alertState,
    confirmState,
    setConfirmState,
    handleOpenAddModal,
    handleDeleteTx,
    handleSaveTx,
    updateFormFields,
    triggerPrint,
    totalIncome,
    totalExpense,
    netBalance,
    filteredTxs,
    thaiBahtText
  };
}
