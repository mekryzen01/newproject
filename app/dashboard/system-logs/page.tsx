'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  Calendar, 
  ShieldAlert, 
  User, 
  Mail, 
  RefreshCw,
  Clock,
  Terminal,
  FileJson,
  Eye,
  X
} from 'lucide-react';
import { db, SystemLog } from '@/lib/db';
import { usePermission } from '@/lib/usePermission';
import { CustomDialog } from '@/components/ui/custom-dialog';
import { ThaiDatePicker } from '@/components/ui/thai-date-picker';

export default function SystemLogsPage() {
  const { role, loaded } = usePermission();
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering and pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // Modal for detail view
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);

  // Load logs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await db.systemLogs.list();
      setLogs(data || []);
      setFilteredLogs(data || []);
    } catch (err) {
      console.error('Failed to load system logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loaded && role === 'admin') {
      fetchLogs();
    }
  }, [loaded, role]);

  // Apply filters & reset page
  useEffect(() => {
    let result = [...logs];

    // Search filter (User Name, Email, Details, Entity ID)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(log => 
        (log.user_name || '').toLowerCase().includes(term) ||
        (log.user_email || '').toLowerCase().includes(term) ||
        (log.entity_type || '').toLowerCase().includes(term) ||
        (log.entity_id || '').toLowerCase().includes(term) ||
        (log.details || '').toLowerCase().includes(term)
      );
    }

    // Action filter
    if (actionFilter !== 'all') {
      result = result.filter(log => log.action === actionFilter);
    }

    // Entity type filter
    if (entityFilter !== 'all') {
      result = result.filter(log => log.entity_type === entityFilter);
    }

    // Date filter
    if (dateFilter) {
      result = result.filter(log => {
        const logDate = new Date(log.created_at).toISOString().split('T')[0];
        return logDate === dateFilter;
      });
    }

    setFilteredLogs(result);
    setCurrentPage(1);
  }, [searchTerm, actionFilter, entityFilter, dateFilter, pageSize, logs]);

  // Handle access restriction
  if (!loaded) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="size-8 text-amber-500 animate-spin" />
          <p className="text-xs font-semibold text-amber-800/60 dark:text-amber-500/60">กำลังตรวจสอบสิทธิ์การใช้งาน...</p>
        </div>
      </div>
    );
  }

  if (role !== 'admin') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-950/30 rounded-2xl p-6 text-center shadow-lg">
          <div className="size-14 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="size-8 text-rose-500" />
          </div>
          <h2 className="text-lg font-extrabold text-rose-900 dark:text-rose-200 mb-2 font-heading">
            สิทธิ์การใช้งานไม่เพียงพอ
          </h2>
          <p className="text-xs text-rose-800/70 dark:text-rose-400/70 mb-4">
            เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถเข้าถึงระบบบันทึกเหตุการณ์ประวัติการทำงานของส่วนกลางได้
          </p>
        </div>
      </div>
    );
  }

  // Get unique entities for filter dropdown
  const uniqueEntities = Array.from(new Set(logs.map(log => log.entity_type).filter(Boolean)));

  // Grouped stats
  const totalCount = logs.length;
  const loginCount = logs.filter(l => l.action === 'login').length;
  const createCount = logs.filter(l => l.action === 'create').length;
  const editCount = logs.filter(l => l.action === 'edit').length;
  const deleteCount = logs.filter(l => l.action === 'delete').length;

  const formatThaiDateString = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) + ' น.';
    } catch (e) {
      return isoString;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'create':
        return (
          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 border border-emerald-200/30">
            🟢 CREATE
          </span>
        );
      case 'edit':
        return (
          <span className="text-[10px] bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 border border-amber-200/30">
            🟡 EDIT
          </span>
        );
      case 'delete':
        return (
          <span className="text-[10px] bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 border border-rose-200/30">
            🔴 DELETE
          </span>
        );
      case 'login':
        return (
          <span className="text-[10px] bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 border border-blue-200/30">
            🔵 LOGIN
          </span>
        );
      default:
        return (
          <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
            ⚪ ACTION
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-heading text-amber-900 dark:text-amber-200 flex items-center gap-2">
            <Activity className="size-6 text-amber-600 animate-pulse" />
            ประวัติการทำงานระบบ (System Audit Logs)
          </h1>
          <p className="text-xs text-amber-800/60 dark:text-amber-500/60">
            สืบค้นและบันทึกประวัติการกระทำของบัญชีผู้ใช้งาน เพื่อความโปร่งใสและการรักษาความปลอดภัย
          </p>
        </div>
        
        <button
          onClick={fetchLogs}
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center gap-1 border-none shadow-md shadow-amber-600/10 cursor-pointer transition-colors"
        >
          <RefreshCw className="size-3.5" />
          รีเฟรชข้อมูล
        </button>
      </div>

      {/* Stats Cards Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-amber-50/30 dark:bg-amber-950/5 border border-amber-100/50 dark:border-amber-950/20 p-3.5 rounded-2xl flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-bold text-amber-800/70 dark:text-amber-400/70">เหตุการณ์รวม</span>
          <span className="text-2xl font-extrabold text-amber-950 dark:text-amber-100 mt-1">{totalCount} รายการ</span>
        </div>
        <div className="bg-blue-50/30 dark:bg-blue-950/5 border border-blue-100/50 dark:border-blue-950/20 p-3.5 rounded-2xl flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-bold text-blue-800/70 dark:text-blue-400/70">การเข้าสู่ระบบ</span>
          <span className="text-2xl font-extrabold text-blue-950 dark:text-blue-100 mt-1">{loginCount} ครั้ง</span>
        </div>
        <div className="bg-emerald-50/30 dark:bg-emerald-950/5 border border-emerald-100/50 dark:border-emerald-950/20 p-3.5 rounded-2xl flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-bold text-emerald-800/70 dark:text-emerald-400/70">สร้างรายการ</span>
          <span className="text-2xl font-extrabold text-emerald-950 dark:text-emerald-100 mt-1">{createCount} รายการ</span>
        </div>
        <div className="bg-amber-50/30 dark:bg-amber-950/5 border border-amber-100/50 dark:border-amber-950/20 p-3.5 rounded-2xl flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-bold text-amber-800/70 dark:text-amber-400/70">แก้ไขข้อมูล</span>
          <span className="text-2xl font-extrabold text-amber-950 dark:text-amber-100 mt-1">{editCount} ครั้ง</span>
        </div>
        <div className="bg-rose-50/30 dark:bg-rose-950/5 border border-rose-100/50 dark:border-rose-950/20 p-3.5 rounded-2xl flex flex-col justify-between shadow-sm col-span-2 md:col-span-1">
          <span className="text-[10px] font-bold text-rose-800/70 dark:text-rose-400/70">ลบรายการ</span>
          <span className="text-2xl font-extrabold text-rose-950 dark:text-rose-100 mt-1">{deleteCount} รายการ</span>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-white dark:bg-[#110e08] border border-amber-100 dark:border-amber-950/30 rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search text filter */}
          <div className="relative flex items-center">
            <Search className="size-4 text-amber-800/40 dark:text-amber-500/40 absolute left-3" />
            <input
              type="text"
              placeholder="ค้นหาผู้ใช้, อีเมล, รายละเอียด..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-amber-100 dark:border-amber-950 bg-amber-50/10 dark:bg-amber-950/5 text-amber-950 dark:text-amber-100 outline-none"
            />
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-2">
            <Filter className="size-3.5 text-amber-800/40 dark:text-amber-500/40 shrink-0" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-amber-100 dark:border-amber-950 bg-amber-50/10 dark:bg-amber-950/5 text-amber-950 dark:text-amber-100 outline-none"
            >
              <option value="all">การกระทำทั้งหมด (All Actions)</option>
              <option value="create">สร้าง (CREATE)</option>
              <option value="edit">แก้ไข (EDIT)</option>
              <option value="delete">ลบ (DELETE)</option>
              <option value="login">เข้าสู่ระบบ (LOGIN)</option>
            </select>
          </div>

          {/* Entity Filter */}
          <div className="flex items-center gap-2">
            <Terminal className="size-3.5 text-amber-800/40 dark:text-amber-500/40 shrink-0" />
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-amber-100 dark:border-amber-950 bg-amber-50/10 dark:bg-amber-950/5 text-amber-950 dark:text-amber-100 outline-none"
            >
              <option value="all">ส่วนระบบงานทั้งหมด (All Modules)</option>
              {uniqueEntities.map(ent => (
                <option key={ent} value={ent}>{ent}</option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="w-full">
            <ThaiDatePicker
              value={dateFilter}
              onChange={(val) => setDateFilter(val)}
              placeholder="เลือกวันที่..."
            />
          </div>
        </div>

        {/* Page Size Selector Sub-bar */}
        <div className="mt-3 pt-3 border-t border-amber-100 dark:border-amber-950/30 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="text-amber-800/60 dark:text-amber-500/60 font-semibold">
            พบประวัติทั้งหมด <strong className="text-amber-950 dark:text-amber-100">{filteredLogs.length}</strong> รายการ
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-900/80 dark:text-amber-300/80">แสดงผลทีละ:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-2.5 py-1 text-xs font-bold rounded-xl border border-amber-200 dark:border-amber-950 bg-amber-50/50 dark:bg-amber-950/20 text-amber-950 dark:text-amber-100 outline-none cursor-pointer"
            >
              <option value={10}>10 รายการ / หน้า</option>
              <option value={20}>20 รายการ / หน้า</option>
              <option value={50}>50 รายการ / หน้า</option>
              <option value={100}>100 รายการ / หน้า</option>
              <option value={999999}>แสดงทั้งหมด (All Logs)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table Card */}
      <div className="bg-white dark:bg-[#110e08] border border-amber-100 dark:border-amber-950/30 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <RefreshCw className="size-7 text-amber-500 animate-spin" />
            <span className="text-xs text-amber-800/60 dark:text-amber-500/60 font-semibold">กำลังเรียกประวัติเหตุการณ์ระบบ...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <Activity className="size-10 text-amber-800/30 dark:text-amber-500/35" />
            <span className="text-xs text-amber-800/60 dark:text-amber-500/60 font-semibold">ไม่พบประวัติเหตุการณ์ตรงตามคำค้นหา</span>
          </div>
        ) : (() => {
          const totalFiltered = filteredLogs.length;
          const totalPages = pageSize >= 999999 ? 1 : Math.ceil(totalFiltered / pageSize) || 1;
          const startIndex = (currentPage - 1) * pageSize;
          const paginatedLogs = pageSize >= 999999 ? filteredLogs : filteredLogs.slice(startIndex, startIndex + pageSize);

          return (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-amber-50/50 dark:bg-amber-950/15 border-b border-amber-100 dark:border-amber-950/30 text-amber-800/60 dark:text-amber-500/65 font-bold">
                      <th className="py-3 px-4 w-12 text-center">ประเภท</th>
                      <th className="py-3 px-4">ผู้กระทำ</th>
                      <th className="py-3 px-4">ระบบย่อย</th>
                      <th className="py-3 px-4">วันที่ - เวลาบันทึก</th>
                      <th className="py-3 px-4 w-28 text-center">ดูรายละเอียด</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-50/50 dark:divide-amber-950/10">
                    {paginatedLogs.map(log => (
                      <tr key={log.id} className="hover:bg-amber-50/5 dark:hover:bg-amber-950/5 transition-colors">
                        {/* Action Badge */}
                        <td className="py-3 px-4 text-center">
                          {getActionBadge(log.action)}
                        </td>
                        
                        {/* Actor Profile Info */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-amber-950 dark:text-amber-100 inline-flex items-center gap-1.5">
                              <User className="size-3 text-amber-600/50 shrink-0" />
                              {log.user_name || 'ระบบวัด'}
                            </span>
                            <span className="text-[10px] text-amber-850/65 dark:text-amber-400/65 inline-flex items-center gap-1.5 mt-0.5">
                              <Mail className="size-3 text-amber-600/50 shrink-0" />
                              {log.user_email}
                            </span>
                          </div>
                        </td>

                        {/* Entity Type / Id tag */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-[10px] bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 px-1.5 py-0.5 rounded w-fit uppercase font-mono">
                              {log.entity_type || 'system'}
                            </span>
                            <span className="text-[9px] text-amber-800/40 dark:text-amber-500/35 font-mono">
                              ID: {log.entity_id || '-'}
                            </span>
                          </div>
                        </td>

                        {/* Recorded Time */}
                        <td className="py-3 px-4 text-amber-900/80 dark:text-amber-300/85">
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="size-3 text-amber-600/50" />
                            {formatThaiDateString(log.created_at)}
                          </span>
                        </td>

                        {/* Detail Modal button */}
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="bg-amber-500/10 hover:bg-amber-500 text-amber-700 dark:text-amber-300 hover:text-white border border-amber-500/20 rounded-lg p-1.5 cursor-pointer transition-colors inline-flex items-center justify-center"
                            title="ดูรายละเอียดข้อมูลบันทึก"
                          >
                            <Eye className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls Footer */}
              <div className="p-3.5 bg-amber-50/40 dark:bg-amber-950/15 border-t border-amber-100 dark:border-amber-950/30 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
                <div className="text-amber-800/70 dark:text-amber-400/70 font-semibold">
                  แสดงรายการที่ <strong className="text-amber-950 dark:text-amber-100">{totalFiltered === 0 ? 0 : startIndex + 1}</strong> - <strong className="text-amber-950 dark:text-amber-100">{Math.min(startIndex + pageSize, totalFiltered)}</strong> จากทั้งหมด <strong className="text-amber-950 dark:text-amber-100">{totalFiltered}</strong> รายการ
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(1)}
                    className="px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#15110a] text-amber-900 dark:text-amber-200 font-bold text-xs disabled:opacity-40 cursor-pointer hover:bg-amber-50"
                  >
                    « หน้าแรก
                  </button>
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#15110a] text-amber-900 dark:text-amber-200 font-bold text-xs disabled:opacity-40 cursor-pointer hover:bg-amber-50"
                  >
                    ‹ ก่อนหน้า
                  </button>
                  <span className="px-3 py-1 font-extrabold text-amber-950 dark:text-amber-100 font-mono">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#15110a] text-amber-900 dark:text-amber-200 font-bold text-xs disabled:opacity-40 cursor-pointer hover:bg-amber-50"
                  >
                    ถัดไป ›
                  </button>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                    className="px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#15110a] text-amber-900 dark:text-amber-200 font-bold text-xs disabled:opacity-40 cursor-pointer hover:bg-amber-50"
                  >
                    สุดท้าย »
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Log Details Viewer Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#110e08] border border-amber-100 dark:border-amber-950/50 rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-scale-up">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-amber-100 dark:border-amber-950/40">
              <h3 className="font-bold text-sm text-amber-950 dark:text-amber-100 flex items-center gap-2">
                <FileJson className="size-4.5 text-amber-600" />
                รายละเอียดเหตุการณ์การตรวจสอบความปลอดภัย
              </h3>
              <button 
                onClick={() => setSelectedLog(null)}
                className="text-amber-800/50 hover:text-amber-950 dark:text-amber-400/50 dark:hover:text-amber-100 cursor-pointer border-none bg-transparent"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              {/* Actor Box */}
              <div className="grid grid-cols-2 gap-4 bg-amber-50/20 dark:bg-amber-950/5 p-3 rounded-xl border border-amber-100 dark:border-amber-950/20">
                <div>
                  <span className="text-[10px] font-bold text-amber-800/60 dark:text-amber-400/60 block">ผู้ดำเนินงาน:</span>
                  <span className="font-bold text-amber-950 dark:text-amber-100 text-sm mt-0.5 block">{selectedLog.user_name || 'ระบบอัตโนมัติ'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-amber-800/60 dark:text-amber-400/60 block">อีเมลบัญชี:</span>
                  <span className="font-bold text-amber-950 dark:text-amber-100 text-sm mt-0.5 block">{selectedLog.user_email}</span>
                </div>
              </div>

              {/* Action Box */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-amber-50/10 dark:bg-amber-950/5 p-2.5 rounded-xl border border-amber-100/50 dark:border-amber-950/10">
                  <span className="text-[9px] font-bold text-amber-800/50 dark:text-amber-500/55 block uppercase">การกระทำ (Action)</span>
                  <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                </div>
                <div className="bg-amber-50/10 dark:bg-amber-950/5 p-2.5 rounded-xl border border-amber-100/50 dark:border-amber-950/10 col-span-2">
                  <span className="text-[9px] font-bold text-amber-800/50 dark:text-amber-500/55 block uppercase">ส่วนระบบ (Module Target)</span>
                  <span className="font-bold text-amber-950 dark:text-amber-100 font-mono mt-1 block uppercase">{selectedLog.entity_type}</span>
                </div>
              </div>

              {/* Target Entity ID */}
              <div className="bg-amber-50/10 dark:bg-amber-950/5 p-3 rounded-xl border border-amber-100/50 dark:border-amber-950/10">
                <span className="text-[9px] font-bold text-amber-800/50 dark:text-amber-500/55 block uppercase">รหัสอ้างอิงเอกสาร/ข้อมูล (Entity ID)</span>
                <span className="font-bold text-amber-950 dark:text-amber-100 font-mono mt-1 block select-all">{selectedLog.entity_id || '-'}</span>
              </div>

              {/* Log JSON Details */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-amber-800/50 dark:text-amber-500/55 block uppercase">รายละเอียดข้อมูลเพิ่มเติม (Payload JSON)</span>
                <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[10px] overflow-x-auto max-h-[30vh] border border-slate-800 leading-normal">
                  {selectedLog.details ? (
                    <pre className="whitespace-pre-wrap select-all">
                      {(() => {
                        try {
                          return JSON.stringify(typeof selectedLog.details === 'object' ? selectedLog.details : JSON.parse(selectedLog.details), null, 2);
                        } catch {
                          return String(selectedLog.details);
                        }
                      })()}
                    </pre>
                  ) : (
                    <span className="text-slate-500 italic">ไม่มีข้อมูลรายละเอียดเพิ่มเติม</span>
                  )}
                </div>
              </div>

              {/* Time Info */}
              <div className="text-[10px] text-amber-850/60 dark:text-amber-400/60 flex items-center justify-between pt-2 border-t border-amber-150/40 dark:border-amber-950/30">
                <span>ID ล็อก: {selectedLog.id}</span>
                <span className="font-bold">วันที่สร้าง: {formatThaiDateString(selectedLog.created_at)}</span>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-3 border-t border-amber-100 dark:border-amber-950/40 bg-amber-50/20 dark:bg-amber-950/5 rounded-b-2xl flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 px-4 rounded-xl border-none cursor-pointer transition-colors"
              >
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
