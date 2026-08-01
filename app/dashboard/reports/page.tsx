'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Calendar,
  DollarSign,
  Package,
  Archive,
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  Loader2,
  TrendingUp,
  TrendingDown,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { db, SalaBooking, FuneralArrangement, FinancialTransaction, BorrowRecord, AshesRecord, Sala } from '@/lib/db';
import { formatThaiDate } from '@/lib/utils';
import { usePermission } from '@/lib/usePermission';

export default function ReportsDashboard() {
  const { role, loaded } = usePermission();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  
  // Data states
  const [bookings, setBookings] = useState<SalaBooking[]>([]);
  const [arrangements, setArrangements] = useState<FuneralArrangement[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [borrows, setBorrows] = useState<BorrowRecord[]>([]);
  const [ashes, setAshes] = useState<AshesRecord[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);

  // Selection state
  const [activeReport, setActiveReport] = useState<'sala' | 'finance' | 'inventory' | 'ashes'>('sala');

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [
          bookingsList,
          arrangementsList,
          transList,
          borrowList,
          ashesList,
          salasList,
          config
        ] = await Promise.all([
          db.salaBookings.list(),
          db.funeralArrangements.list(),
          db.finance.list(),
          db.borrow.list(),
          db.ashes.list(),
          db.salas.list(),
          db.settings.get()
        ]);

        setBookings(bookingsList);
        setArrangements(arrangementsList);
        // Filter out personal monk transactions to only show temple transactions on the reports page
        setTransactions(transList.filter(t => !t.monk_id));
        setBorrows(borrowList);
        setAshes(ashesList);
        setSalas(salasList);
        setSettings(config);
      } catch (err) {
        console.error('Failed to load reports data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  // Export CSV Helper
  const handleExportCSV = (data: any[], headers: string[], keys: string[], filename: string) => {
    const csvRows = [headers.join(',')];
    data.forEach(row => {
      const values = keys.map(key => {
        const val = row[key];
        const escaped = ('' + (val ?? '')).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    });
    const csvContent = '\uFEFF' + csvRows.join('\n'); // Thai support UTF-8 BOM
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // SVG Chart Export PNG Helper
  const handleExportChartPNG = (svgId: string, filename: string) => {
    const svgElement = document.getElementById(svgId);
    if (!svgElement) return;

    const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
    const isDark = document.documentElement.classList.contains('dark');
    const bgFill = isDark ? '#15110a' : '#ffffff';
    
    // Add background color
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', '100%');
    rect.setAttribute('height', '100%');
    rect.setAttribute('fill', bgFill);
    clonedSvg.insertBefore(rect, clonedSvg.firstChild);

    // Set absolute size for canvas render
    clonedSvg.setAttribute('width', '800');
    clonedSvg.setAttribute('height', '400');

    const svgString = new XMLSerializer().serializeToString(clonedSvg);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const blobURL = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 400;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(image, 0, 0, 800, 400);
        const pngURL = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngURL;
        link.download = `${filename}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(blobURL);
    };
    image.src = blobURL;
  };

  // PDF Direct Print helper
  const handlePrintPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-amber-600 animate-spin" />
          <p className="text-sm font-semibold text-amber-700/60 dark:text-amber-500/60">กำลังเตรียมรายงานสถิติของวัด...</p>
        </div>
      </div>
    );
  }

  // --- Calculate Analytics ---

  // 1. Sala Booking Report stats
  const activeBookings = bookings.filter(b => b.status !== 'cancelled');
  const totalBookingsCount = activeBookings.length;
  const funeralCount = activeBookings.filter(b => b.event_type === 'funeral').length;
  const completedArrangements = arrangements.length;
  const incompleteArrangements = Math.max(0, funeralCount - completedArrangements);

  const getMonthlySalaData = () => {
    // Generate bookings last 6 months
    const data = [];
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mLabel = months[d.getMonth()] + ' ' + (d.getFullYear() + 543).toString().slice(-2);
      const count = activeBookings.filter(b => {
        const bDate = new Date(b.start_date);
        return bDate.getMonth() === d.getMonth() && bDate.getFullYear() === d.getFullYear();
      }).length;
      data.push({ month: mLabel, count });
    }
    return data;
  };
  const monthlySalaData = getMonthlySalaData();
  const maxSalaCount = Math.max(...monthlySalaData.map(d => d.count), 5);

  // 2. Finance Report stats
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const getMonthlyFinanceData = () => {
    const data = [];
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mLabel = months[d.getMonth()] + ' ' + (d.getFullYear() + 543).toString().slice(-2);
      
      const income = transactions
        .filter(t => t.type === 'income' && new Date(t.date).getMonth() === d.getMonth() && new Date(t.date).getFullYear() === d.getFullYear())
        .reduce((acc, t) => acc + t.amount, 0);
        
      const expense = transactions
        .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === d.getMonth() && new Date(t.date).getFullYear() === d.getFullYear())
        .reduce((acc, t) => acc + t.amount, 0);

      data.push({ month: mLabel, income, expense });
    }
    return data;
  };
  const monthlyFinanceData = getMonthlyFinanceData();
  const maxFinanceValue = Math.max(...monthlyFinanceData.map(d => Math.max(d.income, d.expense)), 10000);

  // 3. Inventory stats
  const activeBorrows = borrows.filter(b => b.status !== 'returned');
  const overdueBorrows = borrows.filter(b => b.status === 'overdue' || (b.status === 'borrowed' && new Date(b.due_date) < new Date()));
  const totalBorrowsCount = borrows.length;

  // 4. Ashes stats
  const totalAshesCount = ashes.length;
  const recentAshesCount = ashes.filter(a => {
    const depDate = new Date(a.deposit_date);
    const diff = Math.abs(new Date().getTime() - depDate.getTime());
    return Math.ceil(diff / (1000 * 3600 * 24)) <= 7;
  }).length;

  const getMonthlyAshesData = () => {
    const data = [];
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mLabel = months[d.getMonth()] + ' ' + (d.getFullYear() + 543).toString().slice(-2);
      const count = ashes.filter(a => {
        const aDate = new Date(a.deposit_date);
        return aDate.getMonth() === d.getMonth() && aDate.getFullYear() === d.getFullYear();
      }).length;
      data.push({ month: mLabel, count });
    }
    return data;
  };
  const monthlyAshesData = getMonthlyAshesData();
  const maxAshesCount = Math.max(...monthlyAshesData.map(d => d.count), 5);

  return (
    <div className="space-y-6 animate-fade-in select-none">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold font-heading text-amber-900 dark:text-amber-200">
            ระบบรายงานและสถิติวัด
          </h2>
          <p className="text-xs text-amber-700/50 dark:text-amber-400/50 mt-0.5">
            เรียกดูสถิติสากล รายรับรายจ่าย และประวัติการจัดงานวัดในรูปแบบกราฟวิเคราะห์ ข้อมูลพร้อมส่งออก PDF และ Excel
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handlePrintPDF}
            className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer shadow-md flex items-center gap-1.5"
          >
            <Printer className="size-4" />
            พิมพ์รายงาน (PDF)
          </Button>
        </div>
      </div>

      {/* Tabs navigation for Reports */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print:hidden">
        <button
          onClick={() => setActiveReport('sala')}
          className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-xs font-bold transition-all shadow-sm cursor-pointer ${
            activeReport === 'sala'
              ? 'bg-amber-500 text-white border-amber-500 shadow-amber-500/20'
              : 'bg-white dark:bg-[#15110a] border-amber-200/40 dark:border-amber-950/30 text-amber-900 dark:text-amber-300 hover:bg-amber-500/5'
          }`}
        >
          <Calendar className="size-4 shrink-0" />
          การจองศาลาและงานฌาปนกิจ
        </button>

        <button
          onClick={() => setActiveReport('finance')}
          className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-xs font-bold transition-all shadow-sm cursor-pointer ${
            activeReport === 'finance'
              ? 'bg-amber-500 text-white border-amber-500 shadow-amber-500/20'
              : 'bg-white dark:bg-[#15110a] border-amber-200/40 dark:border-amber-950/30 text-amber-900 dark:text-amber-300 hover:bg-amber-500/5'
          }`}
        >
          <DollarSign className="size-4 shrink-0" />
          การเงินและบัญชีวัด
        </button>

        <button
          onClick={() => setActiveReport('inventory')}
          className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-xs font-bold transition-all shadow-sm cursor-pointer ${
            activeReport === 'inventory'
              ? 'bg-amber-500 text-white border-amber-500 shadow-amber-500/20'
              : 'bg-white dark:bg-[#15110a] border-amber-200/40 dark:border-amber-950/30 text-amber-900 dark:text-amber-300 hover:bg-amber-500/5'
          }`}
        >
          <Package className="size-4 shrink-0" />
          การยืม-คืนครุภัณฑ์
        </button>

        <button
          onClick={() => setActiveReport('ashes')}
          className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-xs font-bold transition-all shadow-sm cursor-pointer ${
            activeReport === 'ashes'
              ? 'bg-amber-500 text-white border-amber-500 shadow-amber-500/20'
              : 'bg-white dark:bg-[#15110a] border-amber-200/40 dark:border-amber-950/30 text-amber-900 dark:text-amber-300 hover:bg-amber-500/5'
          }`}
        >
          <Archive className="size-4 shrink-0" />
          ทะเบียนประดิษฐานอัฐิ
        </button>
      </div>

      {/* --- REPORT CONTAINER (Print Styled) --- */}
      <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 p-6 shadow-md shadow-amber-100/5 space-y-6 print:border-none print:shadow-none print:p-0">
        
        {/* Print Header (Only visible on PDF print) */}
        <div className="hidden print:block border-b-2 border-amber-800 pb-4 text-center">
          <h1 className="text-xl font-bold text-amber-900">รายงานการวิเคราะห์และข้อมูลวัดประจำระบบ</h1>
          <p className="text-xs text-amber-700 mt-1">{settings?.templeName || 'วัด'}</p>
          <p className="text-[10px] text-amber-600 mt-0.5">ดึงข้อมูลวันที่: {new Date().toLocaleDateString('th-TH')}</p>
        </div>

        {/* 1. Sala Booking Report */}
        {activeReport === 'sala' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center print:hidden">
              <h3 className="text-base font-bold text-amber-950 dark:text-amber-100 flex items-center gap-1.5">
                <span className="w-1.5 h-3.5 bg-amber-500 rounded-sm inline-block" />
                รายงานสถิติการจองศาลาและการจัดตั้งศพ
              </h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleExportChartPNG('sala-chart', 'สถิติการจองศาลาย้อนหลัง')}
                  className="bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 text-amber-850 dark:text-amber-300 border border-amber-250/20 text-xs px-3.5 py-1.5 rounded-xl cursor-pointer"
                >
                  โหลดรูปกราฟ (PNG)
                </Button>
                <Button
                  onClick={() => handleExportCSV(
                    activeBookings,
                    ['ไอดี', 'ศาลา', 'ชื่องาน', 'ประเภท', 'ผู้จอง', 'เบอร์ผู้จอง', 'วันที่เริ่ม', 'วันที่สิ้นสุด'],
                    ['id', 'sala_id', 'event_title', 'event_type', 'booker_name', 'booker_phone', 'start_date', 'end_date'],
                    'ทะเบียนการจองศาลา'
                  )}
                  className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-3.5 py-1.5 rounded-xl cursor-pointer flex items-center gap-1"
                >
                  <FileSpreadsheet className="size-3.5" />
                  ส่งออก Excel (CSV)
                </Button>
              </div>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-200/20 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-700">
                  <Calendar className="size-5" />
                </div>
                <div>
                  <div className="text-[10px] text-amber-700/60 dark:text-amber-400/50">ยอดจองศาลาสะสม (ครั้ง)</div>
                  <div className="text-xl font-bold text-amber-950 dark:text-amber-100">{totalBookingsCount}</div>
                </div>
              </div>

              <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-200/20 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-700">
                  <Archive className="size-5" />
                </div>
                <div>
                  <div className="text-[10px] text-emerald-700/60 dark:text-emerald-400/50">จัดตั้งศพสมบูรณ์ (ราย)</div>
                  <div className="text-xl font-bold text-emerald-950 dark:text-emerald-100">{completedArrangements}</div>
                </div>
              </div>

              <div className="bg-red-500/5 p-4 rounded-xl border border-red-200/20 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-700">
                  <Info className="size-5" />
                </div>
                <div>
                  <div className="text-[10px] text-red-700/60 dark:text-red-400/50">รอกรอกประวัติเพิ่มเติม (ราย)</div>
                  <div className="text-xl font-bold text-red-950 dark:text-red-100">{incompleteArrangements}</div>
                </div>
              </div>
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="border border-amber-200/20 rounded-xl p-4 bg-amber-500/5">
              <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-4 text-center">สถิติปริมาณการจองศาลารายเดือน (6 เดือนย้อนหลัง)</h4>
              <div className="relative h-[240px] w-full flex justify-center">
                <svg id="sala-chart" className="w-full max-w-[700px] h-full" viewBox="0 0 600 240">
                  {/* Grid lines */}
                  <line x1="40" y1="40" x2="560" y2="40" stroke="#f59e0b" strokeWidth="0.5" strokeOpacity="0.1" strokeDasharray="3 3" />
                  <line x1="40" y1="100" x2="560" y2="100" stroke="#f59e0b" strokeWidth="0.5" strokeOpacity="0.1" strokeDasharray="3 3" />
                  <line x1="40" y1="160" x2="560" y2="160" stroke="#f59e0b" strokeWidth="0.5" strokeOpacity="0.1" strokeDasharray="3 3" />
                  <line x1="40" y1="200" x2="560" y2="200" stroke="#f59e0b" strokeWidth="0.8" strokeOpacity="0.25" />

                  {/* Labels y-axis */}
                  <text x="10" y="44" className="fill-amber-800/40 dark:fill-amber-500/30 text-[9px] font-bold">{(maxSalaCount).toFixed(0)}</text>
                  <text x="10" y="104" className="fill-amber-800/40 dark:fill-amber-500/30 text-[9px] font-bold">{(maxSalaCount * 0.5).toFixed(0)}</text>
                  <text x="10" y="164" className="fill-amber-800/40 dark:fill-amber-500/30 text-[9px] font-bold">{(maxSalaCount * 0.2).toFixed(0)}</text>
                  <text x="15" y="204" className="fill-amber-800/40 dark:fill-amber-500/30 text-[9px] font-bold">0</text>

                  {monthlySalaData.map((d, i) => {
                    const blockWidth = 520 / 6;
                    const xMid = 40 + i * blockWidth + blockWidth / 2;
                    const barHeight = (d.count / maxSalaCount) * 160;

                    return (
                      <g key={i}>
                        {/* Bar */}
                        <rect
                          x={xMid - 15}
                          y={200 - barHeight}
                          width="30"
                          height={Math.max(barHeight, 2)}
                          rx="4"
                          className="fill-amber-500/80 hover:fill-amber-500 transition-colors"
                        />
                        {/* Value label on top of bar */}
                        <text
                          x={xMid}
                          y={200 - barHeight - 6}
                          textAnchor="middle"
                          className="fill-amber-900 dark:fill-amber-300 text-[10px] font-extrabold"
                        >
                          {d.count}
                        </text>
                        {/* X-axis label */}
                        <text
                          x={xMid}
                          y={218}
                          textAnchor="middle"
                          className="fill-amber-850 dark:fill-amber-400 text-[10px] font-bold"
                        >
                          {d.month}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Data Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">ตารางข้อมูลดิบการจองศาลา</h4>
              <div className="overflow-x-auto border border-amber-250/20 rounded-xl">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-amber-500/10 text-amber-900 dark:text-amber-300 border-b border-amber-200/30 font-bold">
                      <th className="p-3">ชื่องานกิจกรรม</th>
                      <th className="p-3">ศาลา</th>
                      <th className="p-3">ผู้ติดต่อ</th>
                      <th className="p-3">ช่วงวันที่จัดงาน</th>
                      <th className="p-3">ประเภทกิจกรรม</th>
                      <th className="p-3">ประวัติจัดตั้งศพ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100/50 dark:divide-amber-950/20">
                    {activeBookings.slice(0, 10).map((b) => {
                      const sala = salas.find(s => s.id === b.sala_id);
                      const hasDetail = arrangements.some(a => a.booking_id === b.id);
                      return (
                        <tr key={b.id} className="hover:bg-amber-50/20">
                          <td className="p-3 font-semibold text-amber-950 dark:text-amber-100">{b.event_title}</td>
                          <td className="p-3 text-amber-900 dark:text-amber-200">{sala ? sala.short_name : 'ศาลา'}</td>
                          <td className="p-3">{b.booker_name} ({b.booker_phone})</td>
                          <td className="p-3">{formatThaiDate(b.start_date)} - {formatThaiDate(b.end_date)}</td>
                          <td className="p-3 capitalize">{b.event_type === 'funeral' ? 'งานศพ' : b.event_type}</td>
                          <td className="p-3">
                            {b.event_type === 'funeral' ? (
                              hasDetail ? (
                                <span className="text-emerald-600 font-bold">ครบถ้วน ✓</span>
                              ) : (
                                <span className="text-red-500 font-bold">ไม่ครบถ้วน ⚠️</span>
                              )
                            ) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. Finance Report */}
        {activeReport === 'finance' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center print:hidden">
              <h3 className="text-base font-bold text-amber-950 dark:text-amber-100 flex items-center gap-1.5">
                <span className="w-1.5 h-3.5 bg-amber-500 rounded-sm inline-block" />
                รายงานรายรับ-รายจ่ายของวัด
              </h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleExportChartPNG('finance-chart', 'สถิติการเงินวัดย้อนหลัง')}
                  className="bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 text-amber-850 dark:text-amber-300 border border-amber-250/20 text-xs px-3.5 py-1.5 rounded-xl cursor-pointer"
                >
                  โหลดรูปกราฟ (PNG)
                </Button>
                <Button
                  onClick={() => handleExportCSV(
                    transactions,
                    ['ไอดี', 'ประเภท', 'จำนวนเงิน', 'หมวดหมู่', 'วันที่', 'คำอธิบาย', 'เลขที่ใบเสร็จ'],
                    ['id', 'type', 'amount', 'category', 'date', 'description', 'receipt_no'],
                    'บัญชีรายรับรายจ่ายวัด'
                  )}
                  className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-3.5 py-1.5 rounded-xl cursor-pointer flex items-center gap-1"
                >
                  <FileSpreadsheet className="size-3.5" />
                  ส่งออก Excel (CSV)
                </Button>
              </div>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-200/20 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-700">
                  <TrendingUp className="size-5" />
                </div>
                <div>
                  <div className="text-[10px] text-emerald-700/60 dark:text-amber-400/50">ยอดรายรับทั้งหมด (บาท)</div>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">฿{totalIncome.toLocaleString()}</div>
                </div>
              </div>

              <div className="bg-rose-500/5 p-4 rounded-xl border border-rose-200/20 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-700">
                  <TrendingDown className="size-5" />
                </div>
                <div>
                  <div className="text-[10px] text-rose-700/60 dark:text-amber-400/50">ยอดรายจ่ายทั้งหมด (บาท)</div>
                  <div className="text-lg font-bold text-rose-600 dark:text-rose-400">฿{totalExpense.toLocaleString()}</div>
                </div>
              </div>

              <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-200/20 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-700">
                  <DollarSign className="size-5" />
                </div>
                <div>
                  <div className="text-[10px] text-amber-700/60 dark:text-amber-400/50">ยอดเงินคงเหลือสุทธิ (บาท)</div>
                  <div className="text-lg font-bold text-amber-950 dark:text-amber-100">฿{netBalance.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Custom SVG Double Bar Chart */}
            <div className="border border-amber-200/20 rounded-xl p-4 bg-amber-500/5">
              <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-4 text-center">แนวโน้มรายรับ-รายจ่ายของวัดประจำ 6 เดือนย้อนหลัง</h4>
              <div className="relative h-[240px] w-full flex justify-center">
                <svg id="finance-chart" className="w-full max-w-[700px] h-full" viewBox="0 0 600 240">
                  {/* Grid lines */}
                  <line x1="50" y1="40" x2="560" y2="40" stroke="#f59e0b" strokeWidth="0.5" strokeOpacity="0.1" strokeDasharray="3 3" />
                  <line x1="50" y1="100" x2="560" y2="100" stroke="#f59e0b" strokeWidth="0.5" strokeOpacity="0.1" strokeDasharray="3 3" />
                  <line x1="50" y1="160" x2="560" y2="160" stroke="#f59e0b" strokeWidth="0.5" strokeOpacity="0.1" strokeDasharray="3 3" />
                  <line x1="50" y1="200" x2="560" y2="200" stroke="#f59e0b" strokeWidth="0.8" strokeOpacity="0.25" />

                  {/* Labels y-axis */}
                  <text x="5" y="44" className="fill-amber-800/40 dark:fill-amber-500/30 text-[9px] font-bold">{(maxFinanceValue).toLocaleString()}</text>
                  <text x="5" y="104" className="fill-amber-800/40 dark:fill-amber-500/30 text-[9px] font-bold">{(maxFinanceValue * 0.5).toLocaleString()}</text>
                  <text x="5" y="164" className="fill-amber-800/40 dark:fill-amber-500/30 text-[9px] font-bold">{(maxFinanceValue * 0.2).toLocaleString()}</text>
                  <text x="25" y="204" className="fill-amber-800/40 dark:fill-amber-500/30 text-[9px] font-bold">0</text>

                  {monthlyFinanceData.map((d, i) => {
                    const blockWidth = 500 / 6;
                    const xMid = 55 + i * blockWidth + blockWidth / 2;
                    const incomeHeight = (d.income / maxFinanceValue) * 160;
                    const expenseHeight = (d.expense / maxFinanceValue) * 160;

                    return (
                      <g key={i}>
                        {/* Income Bar (emerald) */}
                        <rect
                          x={xMid - 16}
                          y={200 - incomeHeight}
                          width="13"
                          height={Math.max(incomeHeight, 2)}
                          rx="3"
                          className="fill-emerald-500/80 hover:fill-emerald-500 transition-colors"
                        />
                        {/* Expense Bar (rose) */}
                        <rect
                          x={xMid + 3}
                          y={200 - expenseHeight}
                          width="13"
                          height={Math.max(expenseHeight, 2)}
                          rx="3"
                          className="fill-rose-500/80 hover:fill-rose-500 transition-colors"
                        />
                        {/* X-axis label */}
                        <text
                          x={xMid}
                          y={218}
                          textAnchor="middle"
                          className="fill-amber-850 dark:fill-amber-400 text-[10px] font-bold"
                        >
                          {d.month}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Data Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">ตารางประวัติธุรกรรมรายรับ-รายจ่ายล่าสุด</h4>
              <div className="overflow-x-auto border border-amber-250/20 rounded-xl">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-amber-500/10 text-amber-900 dark:text-amber-300 border-b border-amber-200/30 font-bold">
                      <th className="p-3">วันที่</th>
                      <th className="p-3">ประเภท</th>
                      <th className="p-3">จำนวนเงิน</th>
                      <th className="p-3">หมวดหมู่</th>
                      <th className="p-3">คำอธิบาย</th>
                      <th className="p-3">เลขที่ใบเสร็จ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100/50 dark:divide-amber-950/20">
                    {transactions.slice(0, 10).map((t) => (
                      <tr key={t.id} className="hover:bg-amber-50/20">
                        <td className="p-3">{formatThaiDate(t.date)}</td>
                        <td className="p-3">
                          <span className={`px-1.5 py-0.5 rounded font-bold text-[8px] ${
                            t.type === 'income' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                          }`}>
                            {t.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                          </span>
                        </td>
                        <td className="p-3 font-semibold">฿{t.amount.toLocaleString()}</td>
                        <td className="p-3">{t.category}</td>
                        <td className="p-3">{t.description}</td>
                        <td className="p-3 font-mono">{t.receipt_no || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. Inventory Report */}
        {activeReport === 'inventory' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center print:hidden">
              <h3 className="text-base font-bold text-amber-950 dark:text-amber-100 flex items-center gap-1.5">
                <span className="w-1.5 h-3.5 bg-amber-500 rounded-sm inline-block" />
                รายงานการยืม-คืนครุภัณฑ์ของวัด
              </h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleExportCSV(
                    borrows,
                    ['ไอดี', 'ครุภัณฑ์', 'ชื่อผู้ยืม', 'เบอร์ผู้ยืม', 'จำนวน', 'วันที่ยืม', 'กำหนดคืน', 'สถานะ'],
                    ['id', 'item_name', 'borrower_name', 'borrower_phone', 'borrow_qty', 'borrow_date', 'due_date', 'status'],
                    'ทะเบียนประวัติยืมคืนครุภัณฑ์'
                  )}
                  className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-3.5 py-1.5 rounded-xl cursor-pointer flex items-center gap-1"
                >
                  <FileSpreadsheet className="size-3.5" />
                  ส่งออก Excel (CSV)
                </Button>
              </div>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-200/20 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-700">
                  <Package className="size-5" />
                </div>
                <div>
                  <div className="text-[10px] text-amber-700/60 dark:text-amber-400/50">การทำรายการยืมสะสม (ครั้ง)</div>
                  <div className="text-xl font-bold text-amber-950 dark:text-amber-100">{totalBorrowsCount}</div>
                </div>
              </div>

              <div className="bg-blue-500/5 p-4 rounded-xl border border-blue-200/20 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-700">
                  <Download className="size-5" />
                </div>
                <div>
                  <div className="text-[10px] text-blue-700/60 dark:text-blue-400/50">ครุภัณฑ์ที่กำลังถูกยืมอยู่ (รายการ)</div>
                  <div className="text-xl font-bold text-blue-950 dark:text-blue-100">{activeBorrows.length}</div>
                </div>
              </div>

              <div className="bg-rose-500/5 p-4 rounded-xl border border-rose-200/20 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-700">
                  <Info className="size-5" />
                </div>
                <div>
                  <div className="text-[10px] text-rose-700/60 dark:text-rose-400/50">รายการค้างส่งคืนเลยกำหนด (รายการ)</div>
                  <div className="text-xl font-bold text-rose-950 dark:text-rose-100">{overdueBorrows.length}</div>
                </div>
              </div>
            </div>

            {/* Custom SVG horizontal status chart */}
            <div className="border border-amber-200/20 rounded-xl p-4 bg-amber-500/5">
              <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-4 text-center">สัดส่วนสถานะการทำรายการยืมสิ่งของครุภัณฑ์</h4>
              <div className="relative h-[80px] w-full flex justify-center">
                {totalBorrowsCount > 0 ? (
                  <svg className="w-full max-w-[600px] h-full" viewBox="0 0 500 80">
                    {/* Horizontal Bar */}
                    <rect x="0" y="25" width="500" height="24" rx="12" fill="#e2e8f0" />
                    
                    {/* Returned segments */}
                    {(() => {
                      const returnedCount = borrows.filter(b => b.status === 'returned').length;
                      const returnedWidth = (returnedCount / totalBorrowsCount) * 500;
                      const borrowedCount = borrows.filter(b => b.status === 'borrowed').length;
                      const borrowedWidth = (borrowedCount / totalBorrowsCount) * 500;
                      const overdueCount = borrows.filter(b => b.status === 'overdue' || (b.status === 'borrowed' && new Date(b.due_date) < new Date())).length;
                      const overdueWidth = (overdueCount / totalBorrowsCount) * 500;

                      return (
                        <>
                          <rect x="0" y="25" width={returnedWidth} height="24" rx="4" className="fill-emerald-500" />
                          <rect x={returnedWidth} y="25" width={borrowedWidth} height="24" rx="4" className="fill-blue-500" />
                          <rect x={returnedWidth + borrowedWidth} y="25" width={overdueWidth} height="24" rx="4" className="fill-rose-500" />
                          
                          {/* Legend / Info text */}
                          <text x="10" y="70" className="fill-emerald-600 dark:fill-emerald-400 text-[10px] font-bold">คืนแล้ว: {returnedCount} รายการ ({((returnedCount/totalBorrowsCount)*100).toFixed(0)}%)</text>
                          <text x="180" y="70" className="fill-blue-600 dark:fill-blue-400 text-[10px] font-bold">กำลังยืม: {borrowedCount} รายการ ({((borrowedCount/totalBorrowsCount)*100).toFixed(0)}%)</text>
                          <text x="350" y="70" className="fill-rose-600 dark:fill-rose-455 text-[10px] font-bold">เกินกำหนด: {overdueCount} รายการ ({((overdueCount/totalBorrowsCount)*100).toFixed(0)}%)</text>
                        </>
                      );
                    })()}
                  </svg>
                ) : (
                  <p className="text-center text-xs text-amber-700/50">ไม่มีข้อมูลบันทึกการยืม</p>
                )}
              </div>
            </div>

            {/* Data Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">ตารางข้อมูลการยืมครุภัณฑ์ค้างส่งคืนล่าสุด</h4>
              <div className="overflow-x-auto border border-amber-250/20 rounded-xl">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-amber-500/10 text-amber-900 dark:text-amber-300 border-b border-amber-200/30 font-bold">
                      <th className="p-3">ครุภัณฑ์</th>
                      <th className="p-3">ผู้ยืม</th>
                      <th className="p-3">เบอร์ติดต่อ</th>
                      <th className="p-3">จำนวน</th>
                      <th className="p-3">วันที่ยืม</th>
                      <th className="p-3">กำหนดคืน</th>
                      <th className="p-3">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100/50 dark:divide-amber-950/20">
                    {borrows.filter(b => b.status !== 'returned').slice(0, 10).map((b) => {
                      const isOverdue = b.status === 'overdue' || new Date(b.due_date) < new Date();
                      return (
                        <tr key={b.id} className="hover:bg-amber-50/20">
                          <td className="p-3 font-semibold text-amber-950 dark:text-amber-100">{b.item_name}</td>
                          <td className="p-3">{b.borrower_name}</td>
                          <td className="p-3">{b.borrower_phone}</td>
                          <td className="p-3 font-bold">{b.borrow_qty} ชิ้น</td>
                          <td className="p-3">{formatThaiDate(b.borrow_date)}</td>
                          <td className="p-3">{formatThaiDate(b.due_date)}</td>
                          <td className="p-3">
                            <span className={`px-1.5 py-0.5 rounded font-bold text-[8px] ${
                              isOverdue ? 'bg-rose-500/10 text-rose-600 animate-pulse' : 'bg-blue-500/10 text-blue-600'
                            }`}>
                              {isOverdue ? 'ค้างเกินกำหนด ⚠️' : 'ยืมอยู่'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 4. Ashes Report */}
        {activeReport === 'ashes' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center print:hidden">
              <h3 className="text-base font-bold text-amber-950 dark:text-amber-100 flex items-center gap-1.5">
                <span className="w-1.5 h-3.5 bg-amber-500 rounded-sm inline-block" />
                รายงานทะเบียนการฝากกระดูกและอัฐิ
              </h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleExportChartPNG('ashes-chart', 'สถิติการฝากอัฐิย้อนหลัง')}
                  className="bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 text-amber-850 dark:text-amber-300 border border-amber-250/20 text-xs px-3.5 py-1.5 rounded-xl cursor-pointer"
                >
                  โหลดรูปกราฟ (PNG)
                </Button>
                <Button
                  onClick={() => handleExportCSV(
                    ashes,
                    ['ไอดี', 'ผู้วายชนม์', 'วันที่เสียชีวิต', 'รหัสช่องฝาก', 'ญาติผู้ดูแล', 'เบอร์ญาติ', 'วันที่ฝาก', 'ผู้รับฝาก'],
                    ['id', 'deceased_name', 'death_date', 'niche_code', 'relative_name', 'relative_phone', 'deposit_date', 'deposited_by'],
                    'ทะเบียนการฝากอัฐิวัด'
                  )}
                  className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-3.5 py-1.5 rounded-xl cursor-pointer flex items-center gap-1"
                >
                  <FileSpreadsheet className="size-3.5" />
                  ส่งออก Excel (CSV)
                </Button>
              </div>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-200/20 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-700">
                  <Archive className="size-5" />
                </div>
                <div>
                  <div className="text-[10px] text-amber-700/60 dark:text-amber-400/50">อัฐิที่ฝากประดิษฐานสะสม (ราย)</div>
                  <div className="text-xl font-bold text-amber-950 dark:text-amber-100">{totalAshesCount} รายการ</div>
                </div>
              </div>

              <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-200/20 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-700">
                  <TrendingUp className="size-5" />
                </div>
                <div>
                  <div className="text-[10px] text-emerald-700/60 dark:text-emerald-400/50">รายการฝากใหม่ในช่วง 7 วันล่าสุด (ราย)</div>
                  <div className="text-xl font-bold text-emerald-950 dark:text-emerald-100">{recentAshesCount} รายการ</div>
                </div>
              </div>
            </div>

            {/* Custom SVG Line Chart */}
            <div className="border border-amber-200/20 rounded-xl p-4 bg-amber-500/5">
              <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-4 text-center">สถิติปริมาณการฝากอัฐิสะสมรายเดือน (6 เดือนย้อนหลัง)</h4>
              <div className="relative h-[240px] w-full flex justify-center">
                <svg id="ashes-chart" className="w-full max-w-[700px] h-full" viewBox="0 0 600 240">
                  {/* Grid lines */}
                  <line x1="50" y1="40" x2="560" y2="40" stroke="#f59e0b" strokeWidth="0.5" strokeOpacity="0.1" strokeDasharray="3 3" />
                  <line x1="50" y1="100" x2="560" y2="100" stroke="#f59e0b" strokeWidth="0.5" strokeOpacity="0.1" strokeDasharray="3 3" />
                  <line x1="50" y1="160" x2="560" y2="160" stroke="#f59e0b" strokeWidth="0.5" strokeOpacity="0.1" strokeDasharray="3 3" />
                  <line x1="50" y1="200" x2="560" y2="200" stroke="#f59e0b" strokeWidth="0.8" strokeOpacity="0.25" />

                  {/* Labels y-axis */}
                  <text x="10" y="44" className="fill-amber-800/40 dark:fill-amber-500/30 text-[9px] font-bold">{(maxAshesCount).toFixed(0)}</text>
                  <text x="10" y="104" className="fill-amber-800/40 dark:fill-amber-500/30 text-[9px] font-bold">{(maxAshesCount * 0.5).toFixed(0)}</text>
                  <text x="10" y="164" className="fill-amber-800/40 dark:fill-amber-500/30 text-[9px] font-bold">{(maxAshesCount * 0.2).toFixed(0)}</text>
                  <text x="20" y="204" className="fill-amber-800/40 dark:fill-amber-500/30 text-[9px] font-bold">0</text>

                  {/* Draw Line paths */}
                  {(() => {
                    const blockWidth = 490 / 5;
                    const points = monthlyAshesData.map((d, i) => {
                      const x = 60 + i * blockWidth;
                      const y = 200 - (d.count / maxAshesCount) * 160;
                      return `${x},${y}`;
                    }).join(' ');

                    return (
                      <>
                        {/* Line path */}
                        <polyline
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="3"
                          points={points}
                        />
                        {/* Circles for each point */}
                        {monthlyAshesData.map((d, i) => {
                          const x = 60 + i * blockWidth;
                          const y = 200 - (d.count / maxAshesCount) * 160;
                          return (
                            <g key={i}>
                              <circle
                                cx={x}
                                cy={y}
                                r="5"
                                className="fill-amber-600 stroke-white dark:stroke-[#15110a] stroke-2"
                              />
                              <text
                                x={x}
                                y={y - 8}
                                textAnchor="middle"
                                className="fill-amber-900 dark:fill-amber-300 text-[10px] font-extrabold"
                              >
                                {d.count}
                              </text>
                              <text
                                x={x}
                                y={218}
                                textAnchor="middle"
                                className="fill-amber-850 dark:fill-amber-400 text-[10px] font-bold"
                              >
                                {d.month}
                              </text>
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>
              </div>
            </div>

            {/* Data Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">ตารางรายชื่อผู้วายชนม์ในทะเบียนฝากอัฐิ</h4>
              <div className="overflow-x-auto border border-amber-250/20 rounded-xl">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-amber-500/10 text-amber-900 dark:text-amber-300 border-b border-amber-200/30 font-bold">
                      <th className="p-3">ผู้วายชนม์</th>
                      <th className="p-3">รหัสช่อง/ตู้ฝาก</th>
                      <th className="p-3">ญาติผู้ดูแล</th>
                      <th className="p-3">เบอร์ติดต่อ</th>
                      <th className="p-3">วันที่เริ่มนำฝาก</th>
                      <th className="p-3">เจ้าหน้าที่ผู้รับฝาก</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100/50 dark:divide-amber-950/20">
                    {ashes.slice(0, 10).map((a) => (
                      <tr key={a.id} className="hover:bg-amber-50/20">
                        <td className="p-3 font-semibold text-amber-950 dark:text-amber-100">{a.deceased_name}</td>
                        <td className="p-3 font-mono font-bold text-amber-800 dark:text-amber-400">{a.niche_code}</td>
                        <td className="p-3">{a.relative_name}</td>
                        <td className="p-3">{a.relative_phone}</td>
                        <td className="p-3">{formatThaiDate(a.deposit_date)}</td>
                        <td className="p-3">{a.deposited_by || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
