'use client';

import React from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Loader2,
  Trash,
  Printer,
  X,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Info,
  Settings,
  RefreshCw,
  Calendar as CalendarIcon,
  Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFinanceController } from '@/app/Controllers/useFinanceController';
import { db, Monk, FinancialCategory, RecurringExpense, FinancialTransaction } from '@/lib/db';
import { CustomDialog } from '@/components/ui/custom-dialog';
import { usePermission } from '@/lib/usePermission';
import { formatThaiDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { ThaiDatePicker } from '@/components/ui/thai-date-picker';
import { ImageLightbox } from '@/components/ui/image-lightbox';

export default function FinanceManagement() {
  const { permissions } = usePermission();
  const [isUploading, setIsUploading] = React.useState(false);
  const [lightboxImage, setLightboxImage] = React.useState<string | null>(null);
  const {
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
    thaiBahtText,
    settings,
    abbotMonk,
    loadTransactions
  } = useFinanceController();

  const [donorNameOnly, setDonorNameOnly] = React.useState('');
  const [donorTaxId, setDonorTaxId] = React.useState('');

  React.useEffect(() => {
    if (currentTx && currentTx.type === 'income') {
      const rawName = currentTx.donor_name || '';
      const match = rawName.match(/\((\d{13})\)/);
      if (match) {
        setDonorTaxId(match[1]);
        setDonorNameOnly(rawName.replace(/\(\d{13}\)/, '').trim());
      } else {
        setDonorTaxId('');
        setDonorNameOnly(rawName);
      }
    } else {
      setDonorNameOnly('');
      setDonorTaxId('');
    }
  }, [currentTx]);

  // Local states for custom categories & recurring expenses
  const [categories, setCategories] = React.useState<FinancialCategory[]>([]);
  const [recurringExpenses, setRecurringExpenses] = React.useState<RecurringExpense[]>([]);
  const [monksList, setMonksList] = React.useState<Monk[]>([]);
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = React.useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = React.useState(false);
  const [isPostRecurringModalOpen, setIsPostRecurringModalOpen] = React.useState(false);
  
  const [newIncomeCategoryName, setNewIncomeCategoryName] = React.useState('');
  const [newExpenseCategoryName, setNewExpenseCategoryName] = React.useState('');
  const [isSavingRecurring, setIsSavingRecurring] = React.useState(false);
  const [selectedRecurringIds, setSelectedRecurringIds] = React.useState<string[]>([]);
  const [recurringForm, setRecurringForm] = React.useState<Partial<RecurringExpense>>({
    title: '',
    amount: 0,
    category: '',
    pay_day: 1,
    is_active: true,
    description: ''
  });

  const loadFinancialData = async () => {
    try {
      const [catList, recList, monksData] = await Promise.all([
        db.financialCategories.list(),
        db.recurringExpenses.list(),
        db.monks.list()
      ]);
      setCategories(catList);
      setRecurringExpenses(recList);
      setMonksList(monksData.filter(m => m.status === 'active'));
      
      // Auto precheck active ones
      setSelectedRecurringIds(recList.filter(r => r.is_active).map(r => r.id));
    } catch (e) {
      console.error('Failed to load extra financial data', e);
    }
  };

  React.useEffect(() => {
    loadFinancialData();
  }, []);

  const handleAddCategory = async (type: 'income' | 'expense') => {
    const name = type === 'income' ? newIncomeCategoryName : newExpenseCategoryName;
    if (!name.trim()) return;
    try {
      await db.financialCategories.save({
        id: '',
        name: name.trim(),
        type
      });
      if (type === 'income') setNewIncomeCategoryName('');
      else setNewExpenseCategoryName('');
      await loadFinancialData();
    } catch (e) {
      console.error('Failed to add category', e);
      alert('เกิดข้อผิดพลาดในการบันทึกหมวดหมู่');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('คุณต้องการลบหมวดหมู่นี้ใช่หรือไม่?')) return;
    try {
      await db.financialCategories.delete(id);
      await loadFinancialData();
    } catch (e) {
      console.error('Failed to delete category', e);
      alert('เกิดข้อผิดพลาดในการลบหมวดหมู่');
    }
  };

  const handleSaveRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recurringForm.title || !recurringForm.amount || !recurringForm.category) {
      alert('กรุณากรอกข้อมูล ชื่องาน จำนวนเงิน และหมวดหมู่ให้ครบถ้วน');
      return;
    }
    setIsSavingRecurring(true);
    try {
      await db.recurringExpenses.save({
        id: recurringForm.id || '',
        title: recurringForm.title,
        amount: Number(recurringForm.amount),
        category: recurringForm.category,
        pay_day: Number(recurringForm.pay_day || 1),
        is_active: recurringForm.is_active !== false,
        description: recurringForm.description || '',
        payer_monk_id: recurringForm.payer_monk_id || null
      });
      setRecurringForm({
        title: '',
        amount: 0,
        category: '',
        pay_day: 1,
        is_active: true,
        description: ''
      });
      await loadFinancialData();
    } catch (err) {
      console.error('Failed to save recurring expense', err);
      alert('เกิดข้อผิดพลาดในการบันทึกรายจ่ายประจำ');
    } finally {
      setIsSavingRecurring(false);
    }
  };

  const handleEditRecurring = (exp: RecurringExpense) => {
    setRecurringForm(exp);
  };

  const handleDeleteRecurring = async (id: string) => {
    if (!confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) return;
    try {
      await db.recurringExpenses.delete(id);
      await loadFinancialData();
    } catch (err) {
      console.error('Failed to delete recurring expense', err);
      alert('เกิดข้อผิดพลาดในการลบรายจ่ายประจำ');
    }
  };

  const handlePostRecurring = async () => {
    if (selectedRecurringIds.length === 0) {
      alert('กรุณาเลือกรายการที่ต้องการบันทึกอย่างน้อย 1 รายการ');
      return;
    }
    try {
      const selected = recurringExpenses.filter(r => selectedRecurringIds.includes(r.id));
      const todayStr = new Date().toISOString().split('T')[0];
      
      await Promise.all(selected.map(exp => {
        return db.finance.save({
          id: `t-rec-${Date.now()}-${exp.id}-${Math.floor(100 + Math.random() * 900)}`,
          type: 'expense',
          amount: exp.amount,
          category: exp.category,
          date: todayStr,
          description: `[รายจ่ายประจำ] ${exp.title} ${exp.description ? `(${exp.description})` : ''}`
        });
      }));

      alert('บันทึกรายการธุรกรรมประจำเดือนเรียบร้อยแล้ว!');
      setIsPostRecurringModalOpen(false);
      await loadTransactions();
    } catch (err) {
      console.error('Failed to post recurring expenses', err);
      alert('เกิดข้อผิดพลาดในการบันทึกธุรกรรม');
    }
  };

  const handleExportEDonation = () => {
    const incomes = filteredTxs.filter(t => t.type === 'income');
    if (incomes.length === 0) {
      alert('ไม่มีข้อมูลรายรับบริจาคที่ตรงตามเงื่อนไขการค้นหาในขณะนี้');
      return;
    }

    const headers = ['ลำดับ', 'เลขประจำตัวประชาชน (13 หลัก)', 'ชื่อ-นามสกุลผู้บริจาค', 'จำนวนเงินบริจาค (บาท)', 'วันที่บริจาค', 'วัตถุประสงค์ / ตู้บริจาค', 'เลขที่ใบอนุโมทนาบัตร'];
    const rows = incomes.map((t, idx) => {
      const rawName = t.donor_name || '';
      const match = rawName.match(/\((\d{13})\)/);
      const taxId = match ? match[1] : '';
      const donorNameOnly = rawName.replace(/\(\d{13}\)/, '').trim();
      return [
        idx + 1,
        `"${taxId}"`,
        `"${donorNameOnly.replace(/"/g, '""')}"`,
        t.amount,
        t.date,
        `"${t.category.replace(/"/g, '""')}"`,
        `"${(t.receipt_no || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `e_donation_wat_dong_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      
      {/* Printable Area styling */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header section & Controls */}
      <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 p-5 shadow-sm shadow-amber-100/5 mb-6 no-print flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h2 className="text-2xl font-bold font-heading text-amber-900 dark:text-amber-200">
            ระบบบัญชีและการเงินของวัด
          </h2>
          <p className="text-xs text-amber-700/60 dark:text-amber-400/50 mt-1 max-w-lg">
            บันทึกรายรับจากจิตศรัทธา ออกใบอนุโมทนาบัตร และควบคุมบัญชีรายจ่ายค่าบูรณะบำรุงรักษาวัด
          </p>
        </div>
        {permissions.canCreate && (
          <div className="flex flex-col sm:flex-row gap-3.5 w-full xl:w-auto items-stretch sm:items-center">
            {/* Primary Action Group: Income & Expense */}
            <div className="grid grid-cols-2 gap-2 shrink-0">
              {permissions.canEditFinanceIncome && (
                <Button
                  onClick={() => handleOpenAddModal('income')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-5 px-4 rounded-xl flex items-center justify-center gap-1.5 border-none shadow-md shadow-emerald-600/10 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <Plus className="size-4" />
                  บันทึกรายรับ
                </Button>
              )}
              {permissions.canEditFinanceExpense && (
                <Button
                  onClick={() => handleOpenAddModal('expense')}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-5 px-4 rounded-xl flex items-center justify-center gap-1.5 border-none shadow-md shadow-rose-600/10 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <Plus className="size-4" />
                  บันทึกรายจ่าย
                </Button>
              )}
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-[1px] h-8 bg-amber-200/40 dark:bg-amber-950/50" />

            {/* Utility Actions Group */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setIsCategoryModalOpen(true)}
                className="bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200/50 dark:border-amber-950/40 font-bold text-xs py-5 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] shadow-xs"
              >
                <Settings className="size-4 text-amber-600 dark:text-amber-500" />
                หมวดหมู่บัญชี
              </Button>
              
              <Button
                onClick={() => setIsRecurringModalOpen(true)}
                className="bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200/50 dark:border-amber-950/40 font-bold text-xs py-5 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] shadow-xs"
              >
                <CalendarIcon className="size-4 text-amber-600 dark:text-amber-500" />
                รายจ่ายประจำ
              </Button>
              
              <Button
                onClick={() => setIsPostRecurringModalOpen(true)}
                className="bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200/50 dark:border-amber-950/40 font-bold text-xs py-5 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] shadow-xs"
                title="คีย์รายจ่ายประจำรายเดือนเข้าบันทึกบัญชีอัตโนมัติ"
              >
                <RefreshCw className="size-4 text-amber-600 dark:text-amber-500" />
                คีย์รายเดือน
              </Button>
              
              <Button
                onClick={handleExportEDonation}
                className="bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200/50 dark:border-amber-950/40 font-bold text-xs py-5 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] shadow-xs"
              >
                <FileText className="size-4 text-amber-600 dark:text-amber-500" />
                E-Donation
              </Button>
            </div>
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

      {/* Center Confirm Deletion Modal */}
      {confirmState && confirmState.show && (
        <CustomDialog
          show={confirmState.show}
          type="confirm"
          variant="destructive"
          title={confirmState.title}
          description={confirmState.description}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
          confirmText="ยืนยันการลบ"
          cancelText="ยกเลิก"
        />
      )}

      {/* Finance Stats Board */}
      {permissions.canViewFinanceSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
          {/* Box 1: Income */}
          <div className="bg-white dark:bg-[#15110a] p-6 rounded-2xl border border-amber-200/40 dark:border-amber-950/30 shadow-md shadow-amber-100/5">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-amber-800/60 dark:text-amber-500/50 uppercase tracking-wider">รายรับรวมทั้งหมด</span>
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="size-4.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-heading">
                {totalIncome.toLocaleString('th-TH')}
              </span>
              <span className="text-xs font-semibold text-emerald-700/60">บาท</span>
            </div>
          </div>

          {/* Box 2: Expense */}
          <div className="bg-white dark:bg-[#15110a] p-6 rounded-2xl border border-amber-200/40 dark:border-amber-950/30 shadow-md shadow-amber-100/5">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-amber-800/60 dark:text-amber-500/50 uppercase tracking-wider">รายจ่ายรวมทั้งหมด</span>
              <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400">
                <TrendingDown className="size-4.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-red-600 dark:text-red-400 font-heading">
                {totalExpense.toLocaleString('th-TH')}
              </span>
              <span className="text-xs font-semibold text-red-700/60">บาท</span>
            </div>
          </div>

          {/* Box 3: Net Balance */}
          <div className="bg-white dark:bg-[#15110a] p-6 rounded-2xl border border-amber-200/40 dark:border-amber-950/30 shadow-md shadow-amber-100/5">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-amber-800/60 dark:text-amber-500/50 uppercase tracking-wider">เงินทุนคงเหลือสุทธิ</span>
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <DollarSign className="size-4.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-extrabold font-heading ${
                netBalance >= 0 ? 'text-amber-950 dark:text-amber-100' : 'text-red-600'
              }`}>
                {netBalance.toLocaleString('th-TH')}
              </span>
              <span className="text-xs font-semibold text-amber-700/60">บาท</span>
            </div>
          </div>
        </div>
      )}

      {/* Financial Analytics Dashboard */}
      {permissions.canViewFinanceSummary && !loading && filteredTxs.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
          {/* Expense Breakdown by Category */}
          <div className="bg-white dark:bg-[#15110a] p-6 rounded-2xl border border-amber-200/40 dark:border-amber-950/30 shadow-md shadow-amber-100/5">
            <h3 className="text-sm font-extrabold text-amber-950 dark:text-amber-100 mb-4 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400">
                <TrendingDown className="size-3.5" />
              </div>
              สัดส่วนค่าใช้จ่ายแยกตามหมวดหมู่
            </h3>
            {(() => {
              const expenseTxs = filteredTxs.filter(tx => tx.type === 'expense');
              const expenseByCategory: Record<string, number> = {};
              expenseTxs.forEach(tx => {
                expenseByCategory[tx.category] = (expenseByCategory[tx.category] || 0) + tx.amount;
              });
              const sorted = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]);
              const maxAmount = sorted.length > 0 ? sorted[0][1] : 1;
              const barColors = [
                'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
                'bg-rose-500', 'bg-pink-500', 'bg-fuchsia-500', 'bg-purple-500'
              ];

              if (sorted.length === 0) return (
                <div className="text-center py-6 text-amber-700/40 dark:text-amber-500/30 text-xs">ยังไม่มีข้อมูลรายจ่าย</div>
              );

              return (
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                  {sorted.map(([cat, amount], idx) => {
                    const pct = totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : '0';
                    return (
                      <div key={cat}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200 truncate max-w-[60%]">{cat}</span>
                          <span className="text-[10px] font-bold text-amber-700/60 dark:text-amber-500/50 shrink-0">{amount.toLocaleString()} บาท ({pct}%)</span>
                        </div>
                        <div className="w-full h-2.5 bg-amber-100/40 dark:bg-amber-950/30 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ease-out ${barColors[idx % barColors.length]}`}
                            style={{ width: `${(amount / maxAmount) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Income by Category */}
          <div className="bg-white dark:bg-[#15110a] p-6 rounded-2xl border border-amber-200/40 dark:border-amber-950/30 shadow-md shadow-amber-100/5">
            <h3 className="text-sm font-extrabold text-amber-950 dark:text-amber-100 mb-4 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="size-3.5" />
              </div>
              สัดส่วนรายรับแยกตามตู้บริจาค/วัตถุประสงค์
            </h3>
            {(() => {
              const incomeTxs = filteredTxs.filter(tx => tx.type === 'income');
              const incomeByCategory: Record<string, number> = {};
              incomeTxs.forEach(tx => {
                incomeByCategory[tx.category] = (incomeByCategory[tx.category] || 0) + tx.amount;
              });
              const sorted = Object.entries(incomeByCategory).sort((a, b) => b[1] - a[1]);
              const maxAmount = sorted.length > 0 ? sorted[0][1] : 1;
              const barColors = [
                'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500',
                'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-green-500'
              ];

              if (sorted.length === 0) return (
                <div className="text-center py-6 text-amber-700/40 dark:text-amber-500/30 text-xs">ยังไม่มีข้อมูลรายรับ</div>
              );

              return (
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                  {sorted.map(([cat, amount], idx) => {
                    const pct = totalIncome > 0 ? ((amount / totalIncome) * 100).toFixed(1) : '0';
                    return (
                      <div key={cat}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200 truncate max-w-[60%]">{cat}</span>
                          <span className="text-[10px] font-bold text-amber-700/60 dark:text-amber-500/50 shrink-0">{amount.toLocaleString()} บาท ({pct}%)</span>
                        </div>
                        <div className="w-full h-2.5 bg-amber-100/40 dark:bg-amber-950/30 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ease-out ${barColors[idx % barColors.length]}`}
                            style={{ width: `${(amount / maxAmount) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 p-6 shadow-md shadow-amber-100/5 no-print">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-700/40 dark:text-amber-500/30">
              <Search className="size-4" />
            </div>
            <input
              type="text"
              placeholder="ค้นหาหมวดหมู่, ชื่อผู้บริจาค, เลขใบอนุโมทนา..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-amber-200/60 dark:border-amber-950 bg-amber-50/10 dark:bg-[#1a150e] text-amber-950 dark:text-amber-100 placeholder-amber-700/30 dark:placeholder-amber-500/20 text-xs outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-800/70 dark:text-amber-400/70 shrink-0">กรองชนิดรายการ:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="py-2 px-3 rounded-lg border border-amber-200/60 dark:border-amber-950 bg-amber-50/10 dark:bg-[#1a150e] text-amber-950 dark:text-amber-100 text-xs outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
            >
              <option value="all">ทั้งหมด</option>
              <option value="income">รายรับ (ทำบุญ)</option>
              <option value="expense">รายจ่าย</option>
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        {loading ? (
          <div className="p-12 text-center animate-pulse-subtle">
            <Loader2 className="size-8 text-amber-500 animate-spin mx-auto mb-2" />
            <p className="text-xs font-bold text-amber-700/65">กำลังโหลดบัญชีการเงิน...</p>
          </div>
        ) : filteredTxs.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-amber-200/20 rounded-xl animate-fade-in">
            <DollarSign className="size-12 mx-auto text-amber-200 dark:text-amber-900/35 mb-2.5" />
            <p className="text-sm text-amber-800/50 dark:text-amber-500/40">ไม่พบข้อมูลบัญชีที่ระบุ</p>
          </div>
        ) : (
          <div className="overflow-x-auto animate-fade-in">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-amber-200/30 dark:border-amber-950/30 text-amber-800/60 dark:text-amber-500/65 font-bold">
                  <th className="py-3.5 px-3">วันที่</th>
                  <th className="py-3.5 px-3">ประเภท</th>
                  <th className="py-3.5 px-3">สถานะ</th>
                  <th className="py-3.5 px-3">คำอธิบายรายการ / หมวดหมู่</th>
                  <th className="py-3.5 px-3">ผู้บริจาค (รายรับ)</th>
                  <th className="py-3.5 px-3 text-right">จำนวนเงิน</th>
                  <th className="py-3.5 px-3 text-center">อนุโมทนาบัตร</th>
                  {permissions.canDelete && <th className="py-3.5 px-3 text-right">ลบ</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100/40 dark:divide-amber-950/20">
                {filteredTxs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-amber-50/10 dark:hover:bg-amber-950/5 transition-colors">
                    <td className="py-3.5 px-3 whitespace-nowrap text-amber-800/70 dark:text-amber-400">{formatThaiDate(tx.date)}</td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${
                        tx.type === 'income'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}>
                        {tx.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {tx.type === 'income' ? (
                        <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">🟢 รับเข้าแล้ว</span>
                      ) : tx.status === 'pending' ? (
                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm(`ยืนยันว่ารายการ "${tx.category}" จำนวน ${tx.amount.toLocaleString()} บาท ชำระเงินเรียบร้อยแล้วใช่หรือไม่?`)) {
                              try {
                                await db.finance.save({ ...tx, status: 'completed' });
                                await loadTransactions();
                              } catch (e) {
                                alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
                              }
                            }
                          }}
                          className="px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 cursor-pointer hover:bg-amber-500/20 transition-colors"
                          title="คลิกเพื่อยืนยันชำระเงินจริง"
                        >
                          ⏳ รอโอนจ่าย
                        </button>
                      ) : (
                        <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">✅ ชำระแล้ว</span>
                      )}
                    </td>
                     <td className="py-3.5 px-3 max-w-[250px] truncate">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-bold text-amber-950 dark:text-amber-100">{tx.category}</span>
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
                      {tx.description && <div className="text-[10px] text-amber-700/50 dark:text-amber-500/40 mt-0.5 truncate">{tx.description}</div>}
                    </td>
                    <td className="py-3.5 px-3 text-amber-900 dark:text-amber-300">
                      {tx.donor_name ? (
                        <>
                          <div className="font-semibold">{tx.donor_name.replace(/\(\d{13}\)/, '').trim()}</div>
                          {tx.donor_name.match(/\((\d{13})\)/) && (
                            <div className="text-[9px] text-amber-700/50 dark:text-amber-500/40 mt-0.5">
                              ID: {tx.donor_name.match(/\((\d{13})\)/)?.[1]}
                            </div>
                          )}
                        </>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className={`py-3.5 px-3 text-right font-extrabold ${
                      tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()} บาท
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {tx.type === 'income' ? (
                        <Button
                          size="xs"
                          onClick={() => setPrintTx(tx)}
                          className="bg-amber-500/10 hover:bg-amber-500/25 hover:text-amber-950 dark:hover:text-amber-200 border border-amber-500/20 text-amber-800 dark:text-amber-400 flex items-center gap-1 mx-auto font-bold cursor-pointer"
                        >
                          <Printer className="size-3" />
                          พิมพ์ใบโมทนา
                        </Button>
                      ) : (
                        <span className="text-amber-800/30 dark:text-amber-500/30">-</span>
                      )}
                    </td>
                    {permissions.canDelete && (
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => handleDeleteTx(tx.id)}
                          className="p-1 rounded text-red-600 hover:bg-red-500/10 cursor-pointer"
                        >
                          <Trash className="size-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Ledger Form Modal */}
      {isModalOpen && currentTx && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm p-4 no-print">
          <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/50 dark:border-amber-950/40 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="h-1.5 bg-gradient-to-r from-amber-400 to-amber-600" />
            <div className="p-6 border-b border-amber-100 dark:border-amber-950 flex justify-between items-center bg-amber-50/20 dark:bg-amber-950/5">
              <h3 className="font-bold text-base text-amber-900 dark:text-amber-200 font-heading">
                {currentTx.type === 'income' ? 'ลงทะเบียนรายรับ / เงินบริจาค' : 'ลงทะเบียนบันทึกรายจ่ายวัด'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-amber-800 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTx} className="p-6 space-y-4">
              {/* Category */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">หมวดหมู่รายการ / วัตถุประสงค์</label>
                {currentTx.type === 'income' ? (
                  <select
                    required
                    value={currentTx.category || ''}
                    onChange={(e) => updateFormFields('category', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                  >
                    <option value="" disabled>-- เลือกตู้บริจาค / วัตถุประสงค์ --</option>
                    {categories.filter(c => c.type === 'income').map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-2">
                    <select
                      value={currentTx.category && categories.filter(c => c.type === 'expense').some(c => c.name === currentTx.category) ? currentTx.category : (currentTx.category === '' ? '' : '__custom__')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '__custom__') {
                          updateFormFields('category', ' '); // Use single space initially to trigger text input
                        } else {
                          updateFormFields('category', val);
                        }
                      }}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                    >
                      <option value="" disabled>-- เลือกหมวดหมู่รายจ่าย --</option>
                      {categories.filter(c => c.type === 'expense').map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                      <option value="__custom__">อื่นๆ (ระบุเอง)</option>
                    </select>
                    
                    {(!currentTx.category || !categories.filter(c => c.type === 'expense').some(c => c.name === currentTx.category)) && (
                      <input
                        type="text"
                        required
                        value={currentTx.category === ' ' ? '' : currentTx.category}
                        onChange={(e) => updateFormFields('category', e.target.value)}
                        placeholder="กรอกประเภทรายจ่าย / วัตถุประสงค์"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Amount */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">จำนวนเงิน (บาท)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={currentTx.amount || ''}
                  onChange={(e) => updateFormFields('amount', Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">วันที่ทำรายการ</label>
                <ThaiDatePicker
                  required
                  value={currentTx.date || ''}
                  onChange={(val) => updateFormFields('date', val)}
                />
              </div>

              {/* For Income: Donor Name, Tax ID & Receipt No */}
              {currentTx.type === 'income' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ชื่อผู้บริจาค / โยมเจ้าภาพ</label>
                      <input
                        type="text"
                        required
                        value={donorNameOnly}
                        onChange={(e) => {
                          const newName = e.target.value;
                          setDonorNameOnly(newName);
                          updateFormFields('donor_name', donorTaxId ? `${newName} (${donorTaxId})` : newName);
                        }}
                        placeholder="คุณโยมประภาศรี โชคดี"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">เลขบัตรประชาชน (13 หลัก)</label>
                      <input
                        type="text"
                        value={donorTaxId}
                        onChange={(e) => {
                          const rawVal = e.target.value.replace(/\D/g, '');
                          const newTaxId = rawVal.substring(0, 13);
                          setDonorTaxId(newTaxId);
                          updateFormFields('donor_name', newTaxId ? `${donorNameOnly} (${newTaxId})` : donorNameOnly);
                        }}
                        placeholder="สำหรับลดหย่อนภาษี"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">เลขที่ใบอนุโมทนาบัตร</label>
                    <input
                      type="text"
                      disabled
                      value={currentTx.receipt_no || ''}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200/50 bg-amber-50/50 dark:bg-[#15110a] text-amber-800/70 dark:text-amber-400 cursor-not-allowed"
                    />
                  </div>
                </>
              )}

               {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">รายละเอียดเพิ่มเติม (บันทึกช่วยจำ)</label>
                <textarea
                  value={currentTx.description || ''}
                  onChange={(e) => updateFormFields('description', e.target.value)}
                  placeholder="ระบุข้อความเสริมสำหรับการบันทึก..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 h-16 resize-none"
                />
              </div>

              {/* Receipt Image Attachment (Drive Upload) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">แนบรูปบิล หรือ ใบเสร็จ (Upload to Google Drive)</label>
                <div className="flex items-center gap-3 mt-1.5">
                  {currentTx.receipt_image ? (
                    <div className="relative group size-16 rounded-xl border border-amber-200 dark:border-amber-950 overflow-hidden bg-amber-500/5 flex items-center justify-center shrink-0">
                      <img src={currentTx.receipt_image} alt="Receipt Preview" className="size-full object-cover" />
                      <button
                        type="button"
                        onClick={() => updateFormFields('receipt_image', undefined)}
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
                            updateFormFields('receipt_image', data.path);
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
                      id="tx-image-upload"
                    />
                    <label
                      htmlFor="tx-image-upload"
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

              {/* Payment Status (Expense Only) */}
              {currentTx.type === 'expense' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">สถานะการชำระเงิน</label>
                  <select
                    value={currentTx.status || 'completed'}
                    onChange={(e) => updateFormFields('status', e.target.value as 'pending' | 'completed')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                  >
                    <option value="completed">✅ ชำระเงินแล้ว (Paid)</option>
                    <option value="pending">⏳ รอโอนจ่าย (Pending)</option>
                  </select>
                </div>
              )}

              {/* Action buttons inside form modal */}
              <div className="flex gap-3 justify-end pt-4 border-t border-amber-100 dark:border-amber-950 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 text-xs font-bold border-amber-200 hover:bg-amber-500/10 text-amber-800 dark:text-amber-400 cursor-pointer"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2.5 px-5 rounded-lg flex items-center gap-1 border-none shadow-md shadow-amber-500/10 cursor-pointer"
                >
                  {isSaving && <Loader2 className="size-3.5 animate-spin" />}
                  บันทึกข้อมูล
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm p-4 no-print">
          <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/50 dark:border-amber-950/40 shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-up">
            <div className="h-1.5 bg-gradient-to-r from-amber-400 to-amber-600" />
            <div className="p-6 border-b border-amber-100 dark:border-amber-950 flex justify-between items-center bg-amber-50/20 dark:bg-amber-950/5">
              <h3 className="font-bold text-base text-amber-900 dark:text-amber-200 font-heading">
                จัดการหมวดหมู่บัญชี (รายรับและรายจ่าย)
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 rounded-lg text-amber-800 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
              {/* Income Categories */}
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-emerald-700 dark:text-emerald-450 border-b pb-2 border-emerald-100 dark:border-emerald-950/60">
                  🟢 หมวดหมู่รายรับ
                </h4>
                
                {/* Input form */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ชื่อหมวดหมู่รายรับ..."
                    value={newIncomeCategoryName}
                    onChange={(e) => setNewIncomeCategoryName(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                  <Button
                    onClick={() => handleAddCategory('income')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg border-none"
                  >
                    เพิ่ม
                  </Button>
                </div>
                
                {/* List */}
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {categories.filter(c => c.type === 'income').length === 0 ? (
                    <p className="text-[10px] text-amber-800/40 dark:text-amber-500/30 text-center py-4">ไม่มีข้อมูลหมวดหมู่รายรับ</p>
                  ) : (
                    categories.filter(c => c.type === 'income').map(cat => (
                      <div key={cat.id} className="flex justify-between items-center p-2 rounded-lg bg-amber-50/30 dark:bg-amber-950/5 border border-amber-100/50 dark:border-amber-950/30 text-xs">
                        <span className="font-medium text-amber-950 dark:text-amber-100">{cat.name}</span>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1 rounded-md text-red-500 hover:bg-red-500/10 cursor-pointer border-none"
                        >
                          <Trash className="size-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Expense Categories */}
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-rose-700 dark:text-rose-450 border-b pb-2 border-rose-100 dark:border-rose-950/60">
                  🔴 หมวดหมู่รายจ่าย
                </h4>
                
                {/* Input form */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ชื่อหมวดหมู่รายจ่าย..."
                    value={newExpenseCategoryName}
                    onChange={(e) => setNewExpenseCategoryName(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                  <Button
                    onClick={() => handleAddCategory('expense')}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg border-none"
                  >
                    เพิ่ม
                  </Button>
                </div>
                
                {/* List */}
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {categories.filter(c => c.type === 'expense').length === 0 ? (
                    <p className="text-[10px] text-amber-800/40 dark:text-amber-500/30 text-center py-4">ไม่มีข้อมูลหมวดหมู่รายจ่าย</p>
                  ) : (
                    categories.filter(c => c.type === 'expense').map(cat => (
                      <div key={cat.id} className="flex justify-between items-center p-2 rounded-lg bg-amber-50/30 dark:bg-amber-950/5 border border-amber-100/50 dark:border-amber-950/30 text-xs">
                        <span className="font-medium text-amber-950 dark:text-amber-100">{cat.name}</span>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1 rounded-md text-red-500 hover:bg-red-500/10 cursor-pointer border-none"
                        >
                          <Trash className="size-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-amber-50/20 dark:bg-amber-950/5 border-t border-amber-100 dark:border-amber-950 flex justify-end">
              <Button
                onClick={() => setIsCategoryModalOpen(false)}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2 px-5 rounded-lg border-none cursor-pointer"
              >
                เสร็จสิ้น
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Recurring Expense Management Modal */}
      {isRecurringModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm p-4 no-print">
          <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/50 dark:border-amber-950/40 shadow-2xl w-full max-w-4xl overflow-hidden animate-scale-up">
            <div className="h-1.5 bg-gradient-to-r from-amber-400 to-amber-600" />
            <div className="p-6 border-b border-amber-100 dark:border-amber-950 flex justify-between items-center bg-amber-50/20 dark:bg-amber-950/5">
              <h3 className="font-bold text-base text-amber-900 dark:text-amber-200 font-heading">
                จัดการรายการจ่ายประจำรายเดือน (Recurring Expenses)
              </h3>
              <button
                onClick={() => setIsRecurringModalOpen(false)}
                className="p-1.5 rounded-lg text-amber-800 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto">
              {/* Left Form Column */}
              <form onSubmit={handleSaveRecurring} className="space-y-4 lg:col-span-1 border-r border-amber-100 dark:border-amber-950 lg:pr-6">
                <h4 className="font-bold text-xs text-amber-905 dark:text-amber-200 uppercase tracking-wider">
                  {recurringForm.id ? '📝 แก้ไขรายการรายจ่ายประจำ' : '➕ เพิ่มรายการรายจ่ายประจำ'}
                </h4>
                
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-amber-900/80 dark:text-amber-300">ชื่องาน / รายการ</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ค่าเน็ตวัด, ค่าจ้างภารโรง"
                    value={recurringForm.title || ''}
                    onChange={(e) => setRecurringForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {/* Amount */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-amber-900/80 dark:text-amber-300">จำนวนเงิน (บาท)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="0.00"
                    value={recurringForm.amount || ''}
                    onChange={(e) => setRecurringForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-amber-900/80 dark:text-amber-300">หมวดหมู่รายจ่าย</label>
                  <select
                    required
                    value={recurringForm.category || ''}
                    onChange={(e) => setRecurringForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none cursor-pointer focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value="" disabled>-- เลือกหมวดหมู่ --</option>
                    {categories.filter(c => c.type === 'expense').map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Pay Day */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-amber-900/80 dark:text-amber-300">วันที่ต้องจ่าย (ของทุกเดือน)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="31"
                    placeholder="1 - 31"
                    value={recurringForm.pay_day || ''}
                    onChange={(e) => setRecurringForm(prev => ({ ...prev, pay_day: Number(e.target.value) }))}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-amber-900/80 dark:text-amber-300">รายละเอียดบันทึกความจำ</label>
                  <textarea
                    placeholder="ระบุข้อความเสริม..."
                    value={recurringForm.description || ''}
                    onChange={(e) => setRecurringForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 h-16 resize-none"
                  />
                </div>

                {/* Assigned Payer (ผู้รับผิดชอบชำระ) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-amber-900/80 dark:text-amber-300">ผู้รับผิดชอบชำระ (ส่งแจ้งเตือนส่วนตัว)</label>
                  <select
                    value={recurringForm.payer_monk_id || ''}
                    onChange={(e) => setRecurringForm(prev => ({ ...prev, payer_monk_id: e.target.value || null }))}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
                  >
                    <option value="">-- ไม่ระบุ (แจ้งเตือนเฉพาะกลุ่มหลัก) --</option>
                    {monksList.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.chaya})</option>
                    ))}
                  </select>
                </div>

                {/* Status Toggle */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active_check"
                    checked={recurringForm.is_active !== false}
                    onChange={(e) => setRecurringForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="cursor-pointer size-4 rounded accent-amber-600"
                  />
                  <label htmlFor="is_active_check" className="text-xs font-bold text-amber-900/80 dark:text-amber-300 cursor-pointer select-none">
                    เปิดใช้งานรายการจ่ายนี้
                  </label>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  {recurringForm.id && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setRecurringForm({ title: '', amount: 0, category: '', pay_day: 1, is_active: true, description: '' })}
                      className="text-xs py-1.5 px-3 border-amber-200 text-amber-800 hover:bg-amber-500/10 cursor-pointer"
                    >
                      ล้างค่า
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={isSavingRecurring}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-1.5 px-4 rounded-lg border-none cursor-pointer"
                  >
                    {isSavingRecurring ? 'กำลังบันทึก...' : (recurringForm.id ? 'อัปเดต' : 'เพิ่มรายการ')}
                  </Button>
                </div>
              </form>

              {/* Right Table Column */}
              <div className="lg:col-span-2 space-y-4">
                <h4 className="font-bold text-xs text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                  รายการรายจ่ายประจำในระบบ ({recurringExpenses.length} รายการ)
                </h4>
                
                <div className="overflow-x-auto border border-amber-100 dark:border-amber-950 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-amber-50/50 dark:bg-amber-950/15 border-b border-amber-200/30 text-amber-850 dark:text-amber-400 font-extrabold text-[10px]">
                        <th className="p-3">ชื่องาน</th>
                        <th className="p-3">หมวดหมู่</th>
                        <th className="p-3 text-right">จำนวนเงิน</th>
                        <th className="p-3 text-center">วันชำระ</th>
                        <th className="p-3 text-center">สถานะ</th>
                        <th className="p-3 text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100/40 dark:divide-amber-950/20">
                      {recurringExpenses.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-amber-800/40 dark:text-amber-500/30">
                            ไม่มีรายการรายจ่ายประจำ
                          </td>
                        </tr>
                      ) : (
                        recurringExpenses.map(exp => (
                          <tr key={exp.id} className="hover:bg-amber-50/10 dark:hover:bg-amber-950/5 transition-colors">
                            <td className="p-3 font-semibold text-amber-950 dark:text-amber-100">
                              <div>{exp.title}</div>
                              {exp.description && <div className="text-[9px] text-amber-800/50 dark:text-amber-500/40 font-normal">{exp.description}</div>}
                            </td>
                            <td className="p-3 text-amber-800/80 dark:text-amber-400">{exp.category}</td>
                            <td className="p-3 text-right font-bold text-amber-950 dark:text-amber-100">
                              {exp.amount.toLocaleString()} ฿
                            </td>
                            <td className="p-3 text-center text-amber-850 dark:text-amber-300">ทุกวันที่ {exp.pay_day}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-bold ${exp.is_active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450' : 'bg-amber-500/10 text-amber-700 dark:text-amber-500'}`}>
                                {exp.is_active ? 'เปิดใช้งาน' : 'ระงับไว้'}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleEditRecurring(exp)}
                                  className="p-1 rounded-md text-amber-600 hover:bg-amber-500/10 border-none cursor-pointer"
                                  title="แก้ไข"
                                >
                                  <Edit className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRecurring(exp.id)}
                                  className="p-1 rounded-md text-red-500 hover:bg-red-500/10 border-none cursor-pointer"
                                  title="ลบ"
                                >
                                  <Trash className="size-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-6 bg-amber-50/20 dark:bg-amber-950/5 border-t border-amber-100 dark:border-amber-950 flex justify-end">
              <Button
                onClick={() => setIsRecurringModalOpen(false)}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2 px-5 rounded-lg border-none cursor-pointer"
              >
                ปิดหน้าต่าง
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Post Recurring Expenses Confirmation Modal */}
      {isPostRecurringModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm p-4 no-print">
          <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/50 dark:border-amber-950/40 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="h-1.5 bg-gradient-to-r from-amber-400 to-amber-600" />
            <div className="p-6 border-b border-amber-100 dark:border-amber-950 flex justify-between items-center bg-amber-50/20 dark:bg-amber-950/5">
              <h3 className="font-bold text-base text-amber-900 dark:text-amber-200 font-heading">
                บันทึกรายจ่ายประจำเดือนนี้
              </h3>
              <button
                onClick={() => setIsPostRecurringModalOpen(false)}
                className="p-1.5 rounded-lg text-amber-800 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <p className="text-xs text-amber-800/80 dark:text-amber-400/85">
                กรุณาตรวจสอบและเลือกรายจ่ายประจำของเดือนนี้ ระบบจะสร้างบันทึกรายจ่ายแยกรายการให้โดยอัตโนมัติ:
              </p>

              <div className="space-y-2">
                {recurringExpenses.filter(r => r.is_active).length === 0 ? (
                  <p className="text-xs text-center py-6 text-amber-800/40 dark:text-amber-500/30">ไม่มีรายการจ่ายประจำที่เปิดใช้งานในระบบ</p>
                ) : (
                  recurringExpenses.filter(r => r.is_active).map(exp => (
                    <div key={exp.id} className="flex items-center gap-3 p-3 rounded-xl border border-amber-100 dark:border-amber-950 bg-amber-50/10 dark:bg-amber-950/5 text-xs hover:border-amber-500/20 transition-all">
                      <input
                        type="checkbox"
                        id={`post-check-${exp.id}`}
                        checked={selectedRecurringIds.includes(exp.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRecurringIds(prev => [...prev, exp.id]);
                          } else {
                            setSelectedRecurringIds(prev => prev.filter(id => id !== exp.id));
                          }
                        }}
                        className="size-4 cursor-pointer accent-amber-600 rounded"
                      />
                      <label htmlFor={`post-check-${exp.id}`} className="flex-1 flex justify-between items-center cursor-pointer select-none">
                        <div>
                          <span className="font-bold text-amber-950 dark:text-amber-100">{exp.title}</span>
                          <span className="text-[10px] text-amber-750/50 dark:text-amber-500/45 block">หมวดหมู่: {exp.category}</span>
                        </div>
                        <span className="font-extrabold text-amber-950 dark:text-amber-100 text-sm">
                          {exp.amount.toLocaleString()} บาท
                        </span>
                      </label>
                    </div>
                  ))
                )}
              </div>

              {recurringExpenses.filter(r => r.is_active).length > 0 && (
                <div className="bg-amber-50/40 dark:bg-amber-950/10 p-3 rounded-lg border border-amber-200/30 text-right">
                  <span className="text-xs text-amber-900/70 dark:text-amber-400/80 mr-2 font-medium">รวมเงินที่เลือกคีย์:</span>
                  <span className="text-sm font-extrabold text-amber-950 dark:text-amber-100">
                    {recurringExpenses
                      .filter(r => selectedRecurringIds.includes(r.id))
                      .reduce((sum, r) => sum + r.amount, 0)
                      .toLocaleString()} บาท
                  </span>
                </div>
              )}
            </div>

            <div className="p-6 bg-amber-50/20 dark:bg-amber-950/5 border-t border-amber-100 dark:border-amber-950 flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsPostRecurringModalOpen(false)}
                className="py-2.5 px-4 text-xs font-bold border-amber-200 hover:bg-amber-500/10 text-amber-800 dark:text-amber-400 cursor-pointer"
              >
                ยกเลิก
              </Button>
              <Button
                onClick={handlePostRecurring}
                disabled={selectedRecurringIds.length === 0}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2.5 px-5 rounded-lg border-none shadow-md shadow-amber-500/10 cursor-pointer"
              >
                ยืนยันบันทึกธุรกรรม
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Donation Certificate (Receipt) Print View Overlay */}
      {printTx && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/85 backdrop-blur-md overflow-y-auto p-4 no-print-layout">
          <div className="bg-[#fdfbf7] border-[12px] border-double border-amber-600 w-full max-w-3xl rounded-lg shadow-2xl p-8 relative print-area my-auto animate-scale-up text-amber-950">
            {/* Certificate Header Banner */}
            <div className="flex flex-col items-center text-center">
              
              {/* Dharma Wheel ornament placeholder */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 to-amber-700 flex items-center justify-center text-white shadow-md border-4 border-amber-200/50 mb-3 select-none">
                <FileText className="size-8" />
              </div>

              <h1 className="text-3xl font-extrabold text-amber-900 font-heading tracking-wide">
                ใบอนุโมทนาบัตร
              </h1>
              <p className="text-[11px] text-amber-700/60 mt-1 uppercase tracking-widest font-bold">
                Certificate of Devotion • {settings?.templeName || 'วัด'}
              </p>
              <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-amber-600 to-transparent my-3.5" />
            </div>

            {/* Certificate Contents */}
            <div className="mt-8 space-y-6 text-sm leading-loose text-center max-w-xl mx-auto">
              <p className="text-xs text-amber-800/60 font-semibold">
                ใบอนุโมทนาบัตรเลขที่: {printTx.receipt_no || 'RE-XXXX-XXXX'}
              </p>

              <div className="text-base text-amber-900 leading-relaxed font-medium">
                ขออนุโมทนาแด่ <span className="underline decoration-dotted underline-offset-8 decoration-amber-600 text-lg font-bold text-amber-950 px-2">{printTx.donor_name ? printTx.donor_name.replace(/\(\d{13}\)/, '').trim() : ''}</span>
              </div>

              <div className="text-amber-900 leading-relaxed">
                ที่ได้มีจิตศรัทธาบริจาคทรัพย์บำรุงศาสนกุศลบำรุงวัด เป็นจำนวนเงินร่วมบริจาค{' '}
                <span className="underline decoration-dotted underline-offset-8 decoration-amber-600 text-lg font-extrabold text-amber-950 px-2">{printTx.amount.toLocaleString()} บาท</span>
                <span className="text-xs text-amber-700/60"> ({thaiBahtText(printTx.amount)})</span>
              </div>

              <div className="text-amber-900 leading-relaxed">
                เพื่อสมทบทุนจัดทำโครงการวัตถุประสงค์ในด้าน:{' '}
                <span className="underline decoration-dotted underline-offset-8 decoration-amber-600 font-bold text-amber-950 px-2">{printTx.category}</span>
              </div>

              <p className="text-amber-800/80 leading-relaxed text-xs pt-4">
                ขออำนาจแห่งคุณพระศรีรัตนตรัย และสิ่งศักดิ์สิทธิ์ทั้งหลาย จงดลบันดาลอภิบาลประทานพรให้ท่านและครอบครัว<br/>
                จงเจริญด้วยสิริสวัสดิ์พิพัฒนมงคล ชนมายุ สุขะ พละ ปฏิภาณ ธนสารสมบัติ ทุกประการเทอญ.
              </p>

              <p className="text-xs text-amber-800/50 pt-3">
                อนุโมทนาบัตร ณ วันที่: {formatThaiDate(printTx.date)}
              </p>
            </div>

            {/* Signatures */}
            <div className="mt-14 grid grid-cols-2 gap-12 max-w-md mx-auto text-xs text-center border-t border-amber-200/30 pt-8">
              <div className="space-y-4">
                <div className="h-6 border-b border-amber-600/30 w-32 mx-auto" />
                <p className="font-bold text-amber-900">
                  {abbotMonk 
                    ? abbotMonk.name.replace(/\s*\(.*?\)/g, '').trim()
                    : 'พระครูบัณฑิตวราภิมณฑ์'}
                </p>
                <p className="text-[10px] text-amber-700/60">
                  {abbotMonk 
                    ? abbotMonk.rank.replace(/\s*\(.*?\)/g, '').trim()
                    : `เจ้าอาวาส${settings?.templeName || 'วัด'}`}
                </p>
              </div>
              <div className="space-y-4">
                <div className="h-6 border-b border-amber-600/30 w-32 mx-auto" />
                <p className="font-bold text-amber-900">ไวยาวัจกรผู้รับเงิน</p>
                <p className="text-[10px] text-amber-700/60">เจ้าหน้าที่รับเงินวัด</p>
              </div>
            </div>

            {/* Control buttons inside print overlay */}
            <div className="mt-12 flex gap-3.5 justify-center no-print border-t border-amber-200/20 pt-6">
              <Button
                onClick={() => setPrintTx(null)}
                className="bg-amber-900/10 hover:bg-amber-950/20 text-amber-900 font-bold text-xs py-2 px-5 border-none shadow-none cursor-pointer"
              >
                ย้อนกลับ
              </Button>
              <Button
                onClick={triggerPrint}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 px-6 rounded-lg flex items-center gap-1.5 border-none shadow-md shadow-amber-600/10 cursor-pointer"
              >
                พิมพ์ใบอนุโมทนาบัตร
              </Button>
            </div>
          </div>
        </div>
      )}
      <ImageLightbox src={lightboxImage} onClose={() => setLightboxImage(null)} />
    </div>
  );
}
