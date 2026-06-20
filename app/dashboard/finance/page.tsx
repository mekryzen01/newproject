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
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFinanceController } from '@/app/Controllers/useFinanceController';
import { CustomDialog } from '@/components/ui/custom-dialog';
import { usePermission } from '@/lib/usePermission';

export default function FinanceManagement() {
  const { permissions } = usePermission();
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
    thaiBahtText
  } = useFinanceController();

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

      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h2 className="text-2xl font-bold font-heading text-amber-900 dark:text-amber-200">
            ระบบบัญชีและการเงินของวัด
          </h2>
          <p className="text-xs text-amber-700/50 dark:text-amber-400/50">
            บันทึกรายรับจากจิตศรัทธา ออกใบอนุโมทนาบัตร และควบคุมบัญชีรายจ่ายค่าบูรณะบำรุงรักษาวัด
          </p>
        </div>
        {permissions.canCreate && (
          <div className="flex gap-2.5">
            <Button
              onClick={() => handleOpenAddModal('income')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-5 px-5 rounded-xl flex items-center gap-1.5 border-none shadow-md shadow-emerald-600/10 cursor-pointer"
            >
              <Plus className="size-4" />
              ลงบันทึกรายรับ (เงินบริจาค)
            </Button>
            <Button
              onClick={() => handleOpenAddModal('expense')}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-5 px-5 rounded-xl flex items-center gap-1.5 border-none shadow-md shadow-red-600/10 cursor-pointer"
            >
              <Plus className="size-4" />
              ลงบันทึกรายจ่าย
            </Button>
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

      {/* Control panel & list */}
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
                    <td className="py-3.5 px-3 whitespace-nowrap text-amber-800/70 dark:text-amber-400">{tx.date}</td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${
                        tx.type === 'income'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}>
                        {tx.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 max-w-[250px] truncate">
                      <div className="font-bold text-amber-950 dark:text-amber-100">{tx.category}</div>
                      {tx.description && <div className="text-[10px] text-amber-700/50 dark:text-amber-500/40 mt-0.5 truncate">{tx.description}</div>}
                    </td>
                    <td className="py-3.5 px-3 text-amber-900 dark:text-amber-300">{tx.donor_name || '-'}</td>
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
          <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/50 dark:border-amber-950/40 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
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
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">หมวดหมู่รายการ</label>
                <input
                  type="text"
                  required
                  value={currentTx.category || ''}
                  onChange={(e) => updateFormFields('category', e.target.value)}
                  placeholder={currentTx.type === 'income' ? 'เช่น บริจาคสร้างวิหาร, สังฆทานอุทิศ' : 'เช่น ค่าไฟฟ้าประจำเดือน, ค่าซ่อมกุฏิ'}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
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
                <input
                  type="date"
                  required
                  value={currentTx.date || ''}
                  onChange={(e) => updateFormFields('date', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* For Income: Donor Name & Receipt No */}
              {currentTx.type === 'income' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ชื่อผู้บริจาค / โยมเจ้าภาพ</label>
                    <input
                      type="text"
                      required
                      value={currentTx.donor_name || ''}
                      onChange={(e) => updateFormFields('donor_name', e.target.value)}
                      placeholder="คุณโยมประภาศรี โชคดี"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
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
                Certificate of Devotion • วัดศรีสว่างธรรมาราม
              </p>
              <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-amber-600 to-transparent my-3.5" />
            </div>

            {/* Certificate Contents */}
            <div className="mt-8 space-y-6 text-sm leading-loose text-center max-w-xl mx-auto">
              <p className="text-xs text-amber-800/60 font-semibold">
                ใบอนุโมทนาบัตรเลขที่: {printTx.receipt_no || 'RE-XXXX-XXXX'}
              </p>

              <div className="text-base text-amber-900 leading-relaxed font-medium">
                ขออนุโมทนาแด่ <span className="underline decoration-dotted underline-offset-8 decoration-amber-600 text-lg font-bold text-amber-950 px-2">{printTx.donor_name}</span>
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
                อนุโมทนาบัตร ณ วันที่: {printTx.date}
              </p>
            </div>

            {/* Signatures */}
            <div className="mt-14 grid grid-cols-2 gap-12 max-w-md mx-auto text-xs text-center border-t border-amber-200/30 pt-8">
              <div className="space-y-4">
                <div className="h-6 border-b border-amber-600/30 w-32 mx-auto" />
                <p className="font-bold text-amber-900">พระมหาทองดี ปญฺญาธโร</p>
                <p className="text-[10px] text-amber-700/60">เจ้าอาวาสวัดศรีสว่างธรรมาราม</p>
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
    </div>
  );
}
