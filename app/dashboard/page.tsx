'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  DollarSign,
  Calendar,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Clock,
  Plus,
  ArrowRight,
  AlertCircle,
  Archive
} from 'lucide-react';
import { useDashboardController } from '@/app/Controllers/useDashboardController';
import { Button } from '@/components/ui/button';

export default function DashboardOverview() {
  const {
    monks,
    events,
    borrowRecords,
    ashes,
    loading,
    totalMonks,
    totalIncome,
    totalExpense,
    netBalance,
    upcomingEvents,
    activeBorrows,
    recentTransactions
  } = useDashboardController();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-amber-700/60 dark:text-amber-500/60">กำลังดึงข้อมูลระบบวัด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in select-none">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 rounded-2xl p-6 md:p-8 text-white shadow-xl shadow-amber-500/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute right-[-5%] top-[-20%] w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="relative">
          <h2 className="text-xl md:text-2xl font-bold font-heading">นมัสการพระคุณเจ้า และสวัสดีผู้ดูแลระบบ</h2>
          <p className="text-white/80 text-xs md:text-sm mt-1 max-w-xl leading-relaxed">
            ระบบจัดตารางงานนิมนต์ บัญชีวัด และสิ่งของจัดเตรียมไว้ให้เรียบร้อยแล้ว ท่านสามารถดูภาพรวมสถานะปัจจุบันของวัดศรีสว่างธรรมารามได้จากรายงานด้านล่างนี้
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 relative">
          <Link href="/dashboard/schedule">
            <Button className="bg-white hover:bg-amber-50 text-amber-900 font-bold text-xs py-5 px-5 rounded-xl flex items-center gap-1.5 border-none shadow-md shadow-black/10">
              <Calendar className="size-4" />
              จัดงานนิมนต์
            </Button>
          </Link>
          <Link href="/dashboard/finance">
            <Button className="bg-amber-800/40 hover:bg-amber-800/60 text-white font-bold text-xs py-5 px-5 rounded-xl border border-white/20 flex items-center gap-1.5">
              <Plus className="size-4" />
              ลงบัญชีวัด
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Stat 1: Monks */}
        <div className="bg-white dark:bg-[#15110a] p-6 rounded-2xl border border-amber-200/40 dark:border-amber-950/30 shadow-md shadow-amber-100/5 hover:translate-y-[-2px] transition-all duration-300">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-amber-800/60 dark:text-amber-500/50 uppercase tracking-wider">พระภิกษุสามเณร</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Users className="size-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-950 dark:text-amber-100 font-heading">{totalMonks}</span>
            <span className="text-sm font-semibold text-amber-800/60 dark:text-amber-400/60">รูป (ที่จำพรรษา)</span>
          </div>
          <p className="text-[10px] text-amber-700/50 dark:text-amber-500/40 mt-3 flex items-center gap-1">
            <Clock className="size-3" /> ข้อมูลล่าสุดวันนี้
          </p>
        </div>

        {/* Stat 2: Total Balance */}
        <div className="bg-white dark:bg-[#15110a] p-6 rounded-2xl border border-amber-200/40 dark:border-amber-950/30 shadow-md shadow-amber-100/5 hover:translate-y-[-2px] transition-all duration-300">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-amber-800/60 dark:text-amber-500/50 uppercase tracking-wider">เงินกองทุนสะสมของวัด</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <DollarSign className="size-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-heading">
              {netBalance.toLocaleString('th-TH')}
            </span>
            <span className="text-sm font-semibold text-emerald-700/60 dark:text-emerald-500/60">บาท</span>
          </div>
          <p className="text-[10px] text-emerald-600/70 dark:text-emerald-500/50 mt-3 flex items-center gap-1">
            <TrendingUp className="size-3" /> รายรับสะสม: {totalIncome.toLocaleString()} บาท
          </p>
        </div>

        {/* Stat 3: Upcoming Rituals */}
        <div className="bg-white dark:bg-[#15110a] p-6 rounded-2xl border border-amber-200/40 dark:border-amber-950/30 shadow-md shadow-amber-100/5 hover:translate-y-[-2px] transition-all duration-300">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-amber-800/60 dark:text-amber-500/50 uppercase tracking-wider">งานนิมนต์สัปดาห์นี้</span>
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Calendar className="size-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-950 dark:text-amber-100 font-heading">
              {events.filter(e => e.status === 'upcoming').length}
            </span>
            <span className="text-sm font-semibold text-amber-800/60 dark:text-amber-400/60">งาน</span>
          </div>
          <p className="text-[10px] text-amber-700/50 dark:text-amber-500/40 mt-3 flex items-center gap-1">
            <Clock className="size-3" /> มีงานอัปเดตวันนี้
          </p>
        </div>

        {/* Stat 4: Inventory Borrowings */}
        <div className="bg-white dark:bg-[#15110a] p-6 rounded-2xl border border-amber-200/40 dark:border-amber-950/30 shadow-md shadow-amber-100/5 hover:translate-y-[-2px] transition-all duration-300">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-amber-800/60 dark:text-amber-500/50 uppercase tracking-wider">ของที่ชุมชนยืมออก</span>
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Package className="size-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-950 dark:text-amber-100 font-heading">{activeBorrows.length}</span>
            <span className="text-sm font-semibold text-amber-800/60 dark:text-amber-400/60">รายการ</span>
          </div>
          <p className="text-[10px] text-red-600/70 dark:text-red-400/70 mt-3 flex items-center gap-1">
            {borrowRecords.filter(b => b.status === 'overdue').length > 0 ? (
              <>
                <AlertCircle className="size-3" /> เกินกำหนดส่งคืน{' '}
                {borrowRecords.filter(b => b.status === 'overdue').length} รายการ
              </>
            ) : (
              'ไม่มีรายการเกินกำหนดส่งคืน'
            )}
          </p>
        </div>

        {/* Stat 5: Ashes Deposited */}
        <div className="bg-white dark:bg-[#15110a] p-6 rounded-2xl border border-amber-200/40 dark:border-amber-950/30 shadow-md shadow-amber-100/5 hover:translate-y-[-2px] transition-all duration-300">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-amber-800/60 dark:text-amber-500/50 uppercase tracking-wider">ทะเบียนฝากกระดูก</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-700 dark:text-amber-500">
              <Archive className="size-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-950 dark:text-amber-100 font-heading">{ashes.length}</span>
            <span className="text-sm font-semibold text-amber-800/60 dark:text-amber-400/60">ราย</span>
          </div>
          <p className="text-[10px] text-amber-700/50 dark:text-amber-500/40 mt-3 flex items-center gap-1">
            <Clock className="size-3" /> ข้อมูลล่วงลับสะสม
          </p>
        </div>
      </div>

      {/* Main Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Schedule & Finance */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Card: Upcoming Events */}
          <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 p-6 shadow-md shadow-amber-100/5">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-lg text-amber-900 dark:text-amber-200 font-heading">
                  ตารางงานนิมนต์ที่กำลังจะถึง
                </h3>
                <p className="text-xs text-amber-700/50 dark:text-amber-400/50 mt-0.5">งานพิธีกรรมทางศาสนาและงานนอกสถานที่</p>
              </div>
              <Link href="/dashboard/schedule">
                <Button variant="ghost" size="sm" className="text-xs font-bold text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 flex items-center gap-1">
                  ดูทั้งหมด
                  <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-amber-200/30 rounded-xl">
                <p className="text-sm text-amber-700/40 dark:text-amber-500/30">ไม่มีงานนิมนต์เร็ว ๆ นี้</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-4 rounded-xl border border-amber-100 dark:border-amber-950 bg-amber-50/10 dark:bg-amber-950/5 hover:bg-amber-500/5 hover:border-amber-500/20 transition-all duration-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          {event.time} น.
                        </span>
                        <span className="text-xs font-semibold text-amber-800/50 dark:text-amber-400/40">
                          {event.date}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-amber-900 dark:text-amber-200 mt-2">
                        {event.title}
                      </h4>
                      <p className="text-xs text-amber-700/60 dark:text-amber-400/60 mt-1">
                        สถานที่: {event.location} • เจ้าภาพ: {event.host_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-300 bg-amber-100/50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg border border-amber-200/30 dark:border-amber-950">
                        พระ {event.monks_needed} รูป
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: Financial Ledger Summary */}
          <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 p-6 shadow-md shadow-amber-100/5">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-lg text-amber-900 dark:text-amber-200 font-heading">
                  บัญชีรายรับ-รายจ่ายล่าสุด
                </h3>
                <p className="text-xs text-amber-700/50 dark:text-amber-400/50 mt-0.5">การบริจาคและรายจ่ายของวัด</p>
              </div>
              <Link href="/dashboard/finance">
                <Button variant="ghost" size="sm" className="text-xs font-bold text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 flex items-center gap-1">
                  ดูรายละเอียดบัญชี
                  <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-amber-100/50 dark:border-amber-950 bg-amber-50/5 hover:bg-amber-500/5 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      tx.type === 'income'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-red-500/10 text-red-600 dark:text-red-400'
                    }`}>
                      {tx.type === 'income' ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-amber-900 dark:text-amber-200">
                        {tx.category}
                      </h4>
                      <p className="text-[10px] text-amber-700/50 dark:text-amber-400/50 mt-0.5">
                        {tx.date} {tx.donor_name ? `• จาก: ${tx.donor_name}` : ''}
                      </p>
                    </div>
                  </div>
                  <span className={`font-bold text-sm ${
                    tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()} บาท
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right 1 Column: Borrow Records & Monk Directory Quick View */}
        <div className="space-y-8">
          
          {/* Card: Active Borrowings */}
          <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 p-6 shadow-md shadow-amber-100/5">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-base text-amber-900 dark:text-amber-200 font-heading">
                  การยืมครุภัณฑ์ของชุมชน
                </h3>
                <p className="text-[11px] text-amber-700/50 dark:text-amber-400/50 mt-0.5">ครุภัณฑ์วัดที่ชาวบ้านยืมจัดงาน</p>
              </div>
              <Link href="/dashboard/inventory">
                <Button variant="ghost" size="sm" className="text-xs font-bold text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300">
                  จัดการ
                </Button>
              </Link>
            </div>

            {activeBorrows.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-amber-200/30 rounded-xl">
                <p className="text-xs text-amber-700/40 dark:text-amber-500/30">ไม่มีสิ่งของถูกยืมขณะนี้</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {activeBorrows.slice(0, 4).map((record) => (
                  <div
                    key={record.id}
                    className="p-3 rounded-lg border border-amber-100 dark:border-amber-950 bg-amber-50/5 dark:bg-amber-950/5 flex justify-between items-center gap-3 text-xs"
                  >
                    <div>
                      <h4 className="font-bold text-amber-900 dark:text-amber-200 truncate max-w-[150px]">
                        {record.item_name}
                      </h4>
                      <p className="text-[10px] text-amber-700/60 dark:text-amber-400/60 mt-0.5">
                        ผู้ยืม: {record.borrower_name} ({record.borrow_qty} ชิ้น)
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-bold ${
                        record.status === 'overdue'
                          ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}>
                        {record.status === 'overdue' ? 'เกินกำหนดคืน' : 'กำลังยืม'}
                      </span>
                      <p className="text-[9px] text-amber-700/50 dark:text-amber-400/50 mt-1">
                        กำหนดคืน: {record.due_date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: Monk list Quick view */}
          <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 p-6 shadow-md shadow-amber-100/5">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-base text-amber-900 dark:text-amber-200 font-heading">
                  รายนามพระภิกษุสามเณร
                </h3>
                <p className="text-[11px] text-amber-700/50 dark:text-amber-400/50 mt-0.5">จำพรรษาที่วัดปัจจุบัน</p>
              </div>
              <Link href="/dashboard/monks">
                <Button variant="ghost" size="sm" className="text-xs font-bold text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300">
                  ดูทั้งหมด
                </Button>
              </Link>
            </div>

            <div className="space-y-3">
              {monks.slice(0, 4).map((monk) => (
                <div key={monk.id} className="flex items-center gap-3 text-xs p-1.5 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/25 text-amber-700 dark:text-amber-400 shrink-0 font-bold">
                    {monk.chaya === '-' ? 'ณ' : monk.chaya[0]}
                  </div>
                  <div className="truncate flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-amber-950 dark:text-amber-100 truncate">
                        {monk.name}
                      </span>
                      {monk.chaya !== '-' && (
                        <span className="text-[10px] text-amber-700/60 dark:text-amber-400/60 italic font-semibold">
                          ({monk.chaya})
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-amber-700/50 dark:text-amber-400/50 truncate">
                      {monk.rank}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
