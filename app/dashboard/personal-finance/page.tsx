'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Loader2,
  Trash,
  X,
  AlertCircle,
  User,
  CheckCircle2,
  Info,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { db, FinancialTransaction, Monk } from '@/lib/db';
import { formatThaiDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { ThaiDatePicker } from '@/components/ui/thai-date-picker';
import { ImageLightbox } from '@/components/ui/image-lightbox';

export default function PersonalFinancePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [monks, setMonks] = useState<Monk[]>([]);
  const [selectedMonkId, setSelectedMonkId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formType, setFormType] = useState<'income' | 'expense'>('income');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');
  const [donorName, setDonorName] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);

  const [receiptImage, setReceiptImage] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchTxsAndMonks = () => {
    setLoading(true);
    Promise.all([db.finance.list(), db.monks.list()])
      .then(([txs, monksList]) => {
        setTransactions(txs);
        setMonks(monksList);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // 1. Get user session
    const sessionStr = localStorage.getItem('temple_session');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        setCurrentUser(session.user);
      } catch (e) {
        console.error(e);
      }
    }
    fetchTxsAndMonks();
  }, []);

  // 2. Auto link to monk profile
  useEffect(() => {
    if (!currentUser || monks.length === 0) return;

    if (currentUser.monk_id) {
      setSelectedMonkId(currentUser.monk_id);
      return;
    }

    const matched = monks.find(m => {
      const uName = currentUser.fullName || currentUser.name || '';
      const cleanUser = uName.replace(/\s+/g, '').replace(/(พระ|สามเณร|นาย)/g, '');
      const cleanMonk = m.name.replace(/\s+/g, '').replace(/(พระ|สามเณร|นาย)/g, '');
      return cleanUser.includes(cleanMonk) || cleanMonk.includes(cleanUser) || (currentUser.phone && m.phone && currentUser.phone === m.phone);
    });

    if (matched) {
      setSelectedMonkId(matched.id);
    } else if (currentUser.role === 'member' && monks.length > 0) {
      setSelectedMonkId(monks[0].id);
    }
  }, [currentUser, monks]);

  const activeMonk = monks.find(m => m.id === selectedMonkId);

  // Filter transactions
  const myTransactions = transactions.filter(tx => {
    const isMine = tx.monk_id === selectedMonkId;
    if (!isMine) return false;

    // Search query matches
    const matchesSearch =
      (tx.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.donor_name && tx.donor_name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Type filter matches
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;

    return matchesSearch && matchesType;
  });

  // Calculate totals
  const totalIncome = myTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = myTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  const handleOpenAddModal = (type: 'income' | 'expense') => {
    setFormType(type);
    setAmount('');
    setCategory(type === 'income' ? 'รับปัจจัยจากงานนิมนต์' : 'ของใช้ส่วนตัว');
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setDonorName('');
    setReceiptImage('');
    setEditingTxId(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tx: FinancialTransaction) => {
    setFormType(tx.type);
    setAmount(tx.amount.toString());
    setCategory(tx.category);
    setDate(tx.date);
    setDescription(tx.description);
    setDonorName(tx.donor_name || '');
    setReceiptImage(tx.receipt_image || '');
    setEditingTxId(tx.id);
    setIsModalOpen(true);
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      showNotification('โปรดกรอกจำนวนเงินที่ถูกต้อง', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const txData: FinancialTransaction = {
        id: editingTxId || `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: formType,
        amount: Number(amount),
        category: category,
        date: date,
        description: description,
        donor_name: formType === 'income' ? donorName : undefined,
        monk_id: selectedMonkId,
        receipt_image: receiptImage
      };

      await db.finance.save(txData);
      showNotification('บันทึกรายการบัญชีสำเร็จ', 'success');
      setIsModalOpen(false);
      fetchTxsAndMonks();
    } catch (err) {
      console.error(err);
      showNotification('ไม่สามารถบันทึกรายการได้', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? (การลบจะเป็นแบบซอฟต์ดีลีต)')) return;
    try {
      await db.finance.delete(id);
      showNotification('ลบรายการบัญชีสำเร็จ', 'success');
      fetchTxsAndMonks();
    } catch (err) {
      console.error(err);
      showNotification('ไม่สามารถลบรายการได้', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-amber-600 animate-spin" />
          <p className="text-sm font-semibold text-amber-700/60 dark:text-amber-500/60">กำลังดึงข้อมูลบัญชีส่วนตัว...</p>
        </div>
      </div>
    );
  }

  const isPrivileged = currentUser?.role === 'admin' || currentUser?.role === 'abbot' || currentUser?.role === 'editor' || currentUser?.role === 'staff';

  return (
    <div className="space-y-6 animate-fade-in select-none">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading text-amber-900 dark:text-amber-200">
            บัญชีรายรับ-รายจ่ายรายบุคคล
          </h2>
          <p className="text-xs text-amber-700/50 dark:text-amber-400/50 mt-0.5">
            บันทึกการรับปัจจัยส่วนตัว ทุนการศึกษา ค่านิตยภัต และค่าใช้จ่ายส่วนตัวของพระสงฆ์รายรูป
          </p>
        </div>
        {selectedMonkId && (
          <div className="flex gap-2">
            <Button
              onClick={() => handleOpenAddModal('income')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-5 px-5 rounded-xl flex items-center gap-1.5 border-none shadow-md shadow-emerald-600/10 cursor-pointer"
            >
              <Plus className="size-4" />
              บันทึกรายรับส่วนตัว
            </Button>
            <Button
              onClick={() => handleOpenAddModal('expense')}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-5 px-5 rounded-xl flex items-center gap-1.5 border-none shadow-md shadow-rose-600/10 cursor-pointer"
            >
              <Plus className="size-4" />
              บันทึกรายจ่ายส่วนตัว
            </Button>
          </div>
        )}
      </div>

      {/* Alert Notification Toast */}
      {notification && (
        <div className={`fixed top-5 right-5 z-55 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold animate-fade-in ${
          notification.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
            : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Profile link section */}
      <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 p-5 shadow-md shadow-amber-100/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-700 dark:text-amber-400 font-bold shrink-0 text-xl border border-amber-500/20">
            {activeMonk?.name ? (activeMonk.chaya === '-' ? 'ณ' : activeMonk.chaya[0]) : <User />}
          </div>
          <div>
            <h3 className="font-bold text-sm text-amber-950 dark:text-amber-150">
              {activeMonk ? `${activeMonk.name} (${activeMonk.chaya || '-'})` : 'ไม่พบข้อมูลโปรไฟล์ที่เชื่อมโยง'}
            </h3>
            <p className="text-[11px] text-amber-800/60 dark:text-amber-400/60 mt-0.5">
              สมณศักดิ์/ตำแหน่ง: {activeMonk?.rank || '-'} • เบอร์โทร: {activeMonk?.phone || '-'}
            </p>
          </div>
        </div>

        {/* Admin/Staff can switch preview profile */}
        {isPrivileged && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-800/65 dark:text-amber-500/65 whitespace-nowrap">ดูบัญชีของรูปอื่น:</span>
            <select
              value={selectedMonkId}
              onChange={(e) => setSelectedMonkId(e.target.value)}
              className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/40 dark:border-amber-900/30 text-amber-950 dark:text-amber-150 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="" disabled>-- เลือกพระคุณเจ้า --</option>
              {monks.map(m => (
                <option key={m.id} value={m.id} className="dark:bg-[#15110a]">{m.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Finance Stats Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#15110a] p-6 rounded-2xl border border-amber-200/40 dark:border-amber-950/30 shadow-md shadow-amber-100/5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-amber-800/60 dark:text-amber-500/50 uppercase tracking-wider">รายรับปัจจัยสะสม</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="size-4.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-heading">
              {totalIncome.toLocaleString('th-TH')}
            </span>
            <span className="text-xs font-bold text-emerald-700/60 dark:text-emerald-500/65">บาท</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#15110a] p-6 rounded-2xl border border-amber-200/40 dark:border-amber-950/30 shadow-md shadow-amber-100/5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-amber-800/60 dark:text-amber-500/50 uppercase tracking-wider">รายจ่ายส่วนตัวสะสม</span>
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-455">
              <TrendingDown className="size-4.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-heading">
              {totalExpense.toLocaleString('th-TH')}
            </span>
            <span className="text-xs font-bold text-rose-700/60 dark:text-rose-500/65">บาท</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#15110a] p-6 rounded-2xl border border-amber-200/40 dark:border-amber-950/30 shadow-md shadow-amber-100/5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-amber-800/60 dark:text-amber-500/50 uppercase tracking-wider">ปัจจัยคงเหลือสุทธิ</span>
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <DollarSign className="size-4.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-amber-950 dark:text-amber-150 font-heading">
              {netBalance.toLocaleString('th-TH')}
            </span>
            <span className="text-xs font-bold text-amber-800/60 dark:text-amber-500/65">บาท</span>
          </div>
        </div>
      </div>

      {/* Filter controls */}
      <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 p-4 shadow-md shadow-amber-100/5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-amber-800/45 dark:text-amber-500/40 pointer-events-none" />
          <input
            type="text"
            placeholder="ค้นหาตามหมวดหมู่ หรือ รายละเอียด..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-amber-500/3 border border-amber-200/40 dark:border-amber-900/30 text-amber-950 dark:text-amber-100 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder-amber-800/35"
          />
        </div>
        <div className="flex gap-2.5">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/40 dark:border-amber-900/30 text-amber-950 dark:text-amber-150 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="all">ประเภททั้งหมด</option>
            <option value="income">รายรับ (ปัจจัยถวาย)</option>
            <option value="expense">รายจ่ายส่วนตัว</option>
          </select>
        </div>
      </div>

      {/* Transaction List Grid/Table */}
      {!selectedMonkId ? (
        <div className="p-8 text-center bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 shadow-md">
          <AlertCircle className="size-8 text-amber-600 dark:text-amber-500 mx-auto mb-2" />
          <p className="text-xs font-bold text-amber-800/60 dark:text-amber-400/65">
            โปรดเชื่อมโยงรายชื่อพระภิกษุก่อนแสดงบัญชีการเงิน
          </p>
        </div>
      ) : myTransactions.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 shadow-md shadow-amber-100/5">
          <DollarSign className="size-10 text-amber-500/40 dark:text-amber-500/20 mx-auto mb-3" />
          <h4 className="font-bold text-sm text-amber-900 dark:text-amber-300">ยังไม่มีรายการบัญชีใดๆ</h4>
          <p className="text-xs text-amber-700/50 dark:text-amber-500/40 mt-1 max-w-sm mx-auto">
            ท่านสามารถกดปุ่ม บันทึกรายรับ หรือ รายจ่าย เพื่อเริ่มต้นลงตารางบันทึกการเงินส่วนตัวของท่าน
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 p-6 shadow-md shadow-amber-100/5 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-amber-200/30 dark:border-amber-950/30 text-amber-800/60 dark:text-amber-500/65 font-bold">
                <th className="py-3.5 px-3">วันที่</th>
                <th className="py-3.5 px-3">ประเภท</th>
                <th className="py-3.5 px-3">หมวดหมู่</th>
                <th className="py-3.5 px-3">รายละเอียด/หมายเหตุ</th>
                <th className="py-3.5 px-3">จาก (เจ้าภาพ)</th>
                <th className="py-3.5 px-3 text-right">จำนวนเงิน</th>
                <th className="py-3.5 px-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100/40 dark:divide-amber-950/20">
              {myTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-amber-500/2 dark:hover:bg-amber-950/5 transition-colors">
                  <td className="py-3.5 px-3 whitespace-nowrap font-medium text-amber-900 dark:text-amber-300">
                    {formatThaiDate(tx.date)}
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold ${
                      tx.type === 'income'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-500/20'
                    }`}>
                      {tx.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 max-w-[250px] truncate">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-semibold text-amber-950 dark:text-amber-150">{tx.category}</span>
                      {tx.receipt_image && (
                        tx.receipt_image.toLowerCase().endsWith('.pdf') ? (
                          <a
                            href={tx.receipt_image}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 px-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[8px] font-bold cursor-pointer"
                            title="ดูใบเสร็จ / บิลแนบ"
                          >
                            <FileText className="size-2.5" />
                            <span>บิล (PDF)</span>
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setLightboxImage(tx.receipt_image || null)}
                            className="inline-flex items-center gap-0.5 px-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[8px] font-bold cursor-pointer border-none"
                            title="คลิกเพื่อขยายดูบิล"
                          >
                            <FileText className="size-2.5" />
                            <span>บิล</span>
                          </button>
                        )
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-amber-800/80 dark:text-amber-400 max-w-[200px] truncate" title={tx.description}>
                    {tx.description || '-'}
                  </td>
                  <td className="py-3.5 px-3 text-amber-800/80 dark:text-amber-400 truncate">
                    {tx.donor_name || '-'}
                  </td>
                  <td className={`py-3.5 px-3 text-right font-bold text-sm whitespace-nowrap ${
                    tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString('th-TH')} บาท
                  </td>
                  <td className="py-3.5 px-3 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        onClick={() => handleOpenEditModal(tx)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400 cursor-pointer"
                      >
                        แก้ไข
                      </Button>
                      <Button
                        onClick={() => handleDelete(tx.id)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 text-rose-600 hover:bg-rose-500/10 dark:text-rose-400 cursor-pointer"
                      >
                        <Trash className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Transaction Modal (Add/Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#15110a] border border-amber-200/40 dark:border-amber-950/30 rounded-2xl p-6 w-full max-w-md shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-amber-500/10 text-amber-800 dark:text-amber-400 cursor-pointer"
            >
              <X className="size-4.5" />
            </button>

            <h3 className="font-bold text-lg text-amber-900 dark:text-amber-200 font-heading mb-4 flex items-center gap-1.5">
              <DollarSign className="size-5" />
              {editingTxId ? 'แก้ไขรายการบันทึกการเงิน' : formType === 'income' ? 'เพิ่มรายการรายรับส่วนตัว' : 'เพิ่มรายการรายจ่ายส่วนตัว'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-amber-800/60 dark:text-amber-500/60 uppercase mb-1.5">
                  จำนวนเงิน (บาท) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-amber-500/3 border border-amber-200/40 dark:border-amber-900/30 text-amber-950 dark:text-amber-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-800/60 dark:text-amber-500/60 uppercase mb-1.5">
                  หมวดหมู่ *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ค่าเดินทาง, ค่านิตยภัต, สัปคับ"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-amber-500/3 border border-amber-200/40 dark:border-amber-900/30 text-amber-950 dark:text-amber-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-800/60 dark:text-amber-500/60 uppercase mb-1.5">
                  วันที่ทำรายการ *
                </label>
                <ThaiDatePicker
                  required
                  value={date}
                  onChange={(val) => setDate(val)}
                />
              </div>

              {formType === 'income' && (
                <div>
                  <label className="block text-xs font-bold text-amber-800/60 dark:text-amber-500/60 uppercase mb-1.5">
                    ผู้ถวาย / เจ้าภาพ (ถ้ามี)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น โยมอุปัฏฐาก พ่อออก แม่ออก"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-amber-500/3 border border-amber-200/40 dark:border-amber-900/30 text-amber-950 dark:text-amber-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              )}

               <div>
                <label className="block text-xs font-bold text-amber-800/60 dark:text-amber-500/60 uppercase mb-1.5">
                  หมายเหตุ / รายละเอียดเพิ่มเติม
                </label>
                <textarea
                  placeholder="ระบุวัตถุประสงค์ หรือรายละเอียดสั้นๆ..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-amber-500/3 border border-amber-200/40 dark:border-amber-900/30 text-amber-950 dark:text-amber-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Receipt Image Attachment (Drive Upload) */}
              <div>
                <label className="block text-xs font-bold text-amber-800/60 dark:text-amber-500/60 uppercase mb-1.5">
                  แนบรูปบิล หรือ ใบเสร็จ (Upload to Google Drive)
                </label>
                <div className="flex items-center gap-3 mt-1.5">
                  {receiptImage ? (
                    <div className="relative group size-16 rounded-xl border border-amber-200 dark:border-amber-950 overflow-hidden bg-amber-500/5 flex items-center justify-center shrink-0">
                      <img src={receiptImage} alt="Receipt Preview" className="size-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setReceiptImage('')}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity cursor-pointer border-none"
                      >
                        ลบรูป
                      </button>
                    </div>
                  ) : (
                    <div className="size-16 rounded-xl border border-dashed border-amber-200 dark:border-amber-950/60 flex flex-col items-center justify-center text-amber-600/50 dark:text-amber-500/40 bg-amber-50/10 dark:bg-amber-950/5 shrink-0">
                      <DollarSign className="size-5" />
                      <span className="text-[8px] font-bold mt-1">ไม่มีรูปบิล</span>
                    </div>
                  )}
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        setIsUploading(true);
                        try {
                          const body = new FormData();
                          body.append('file', file);
                          
                          const res = await fetch('/api/upload/drive', {
                            method: 'POST',
                            body
                          });
                          
                          const data = await res.json();
                          if (data.success && data.path) {
                            setReceiptImage(data.path);
                          } else {
                            alert(data.error || 'เกิดข้อผิดพลาดในการอัพโหลด');
                          }
                        } catch (err: any) {
                          console.error(err);
                          alert('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ');
                        } finally {
                          setIsUploading(false);
                        }
                      }}
                      disabled={isUploading}
                      className="hidden"
                      id="tx-personal-image-upload"
                    />
                    <label
                      htmlFor="tx-personal-image-upload"
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-950 text-[10px] font-bold text-amber-800 dark:text-amber-400 bg-white dark:bg-[#110e08] hover:bg-amber-500/5 transition-all cursor-pointer shadow-sm",
                        isUploading && "pointer-events-none opacity-50"
                      )}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="size-3 animate-spin" />
                          <span>กำลังอัพโหลด...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="size-3" />
                          <span>เลือกรูปภาพบิล/ใบเสร็จ</span>
                        </>
                      )}
                    </label>
                    <p className="text-[8px] text-amber-700/40 dark:text-amber-500/40">รองรับไฟล์ PNG, JPG, JPEG (ขนาดไม่เกิน 5MB)</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  variant="outline"
                  className="border-amber-200 hover:bg-amber-500/10 text-amber-800 dark:text-amber-450 text-xs font-bold py-5.5 px-4 rounded-xl cursor-pointer"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-5.5 px-5 rounded-xl border-none shadow-md shadow-amber-600/10 cursor-pointer"
                >
                  {isSaving ? <Loader2 className="size-4 animate-spin" /> : 'บันทึกรายการ'}
                </Button>
              </div>
              <div className="h-2" /> {/* Spacer to prevent browser from swallowing bottom padding */}
            </form>
          </div>
        </div>
      )}
      <ImageLightbox src={lightboxImage} onClose={() => setLightboxImage(null)} />
    </div>
  );
}
