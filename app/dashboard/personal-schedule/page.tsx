'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Search,
  Clock,
  MapPin,
  User,
  Loader2,
  Users,
  AlertCircle,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { db, TempleEvent, Monk } from '@/lib/db';
import { formatThaiDate } from '@/lib/utils';

export default function PersonalSchedulePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<TempleEvent[]>([]);
  const [monks, setMonks] = useState<Monk[]>([]);
  const [selectedMonkId, setSelectedMonkId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    // 1. Get logged-in user session
    const sessionStr = localStorage.getItem('temple_session');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        setCurrentUser(session.user);
      } catch (e) {
        console.error('Session parse error:', e);
      }
    }

    // 2. Fetch events and monks
    Promise.all([db.events.list(), db.monks.list()])
      .then(([eventsList, monksList]) => {
        setEvents(eventsList);
        setMonks(monksList);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // 3. Auto-link user to monk profile
  useEffect(() => {
    if (!currentUser || monks.length === 0) return;

    if (currentUser.monk_id) {
      setSelectedMonkId(currentUser.monk_id);
      return;
    }

    // Search matches
    const matched = monks.find(m => {
      const uName = currentUser.fullName || currentUser.name || '';
      const cleanUser = uName.replace(/\s+/g, '').replace(/(พระ|สามเณร|นาย)/g, '');
      const cleanMonk = m.name.replace(/\s+/g, '').replace(/(พระ|สามเณร|นาย)/g, '');
      return cleanUser.includes(cleanMonk) || cleanMonk.includes(cleanUser) || (currentUser.phone && m.phone && currentUser.phone === m.phone);
    });

    if (matched) {
      setSelectedMonkId(matched.id);
    } else if (currentUser.role === 'member' && monks.length > 0) {
      // Fallback first active monk if role is member but not matched cleanly
      setSelectedMonkId(monks[0].id);
    }
  }, [currentUser, monks]);

  const activeMonk = monks.find(m => m.id === selectedMonkId);

  // Filter events assigned to the selected monk
  const filteredEvents = events.filter(event => {
    const isAssigned = event.assigned_monks && event.assigned_monks.includes(selectedMonkId);
    if (!isAssigned) return false;

    // Search query matches
    const matchesSearch =
      (event.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.host_name || '').toLowerCase().includes(searchQuery.toLowerCase());

    // Status matches
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            รอดำเนินการ
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20">
            เสร็จสิ้น
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-500/20">
            ยกเลิก
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-amber-600 animate-spin" />
          <p className="text-sm font-semibold text-amber-700/60 dark:text-amber-500/60">กำลังดึงตารางกิจนิมนต์...</p>
        </div>
      </div>
    );
  }

  const isPrivileged = currentUser?.role === 'admin' || currentUser?.role === 'abbot' || currentUser?.role === 'editor' || currentUser?.role === 'staff';

  return (
    <div className="space-y-6 animate-fade-in select-none">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading text-amber-900 dark:text-amber-200">
            ตารางกิจนิมนต์ของฉัน
          </h2>
          <p className="text-xs text-amber-700/50 dark:text-amber-400/50 mt-0.5">
            สืบค้นตารางงานที่ได้รับมอบหมายและกิจนิมนต์ส่วนบุคคลตามการจัดสรร
          </p>
        </div>
      </div>

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
            <span className="text-xs font-bold text-amber-800/65 dark:text-amber-500/65 whitespace-nowrap">ดูตารางของรูปอื่น:</span>
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

      {/* Filter and search controls */}
      <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 p-4 shadow-md shadow-amber-100/5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-amber-800/45 dark:text-amber-500/40 pointer-events-none" />
          <input
            type="text"
            placeholder="ค้นหาชื่อกิจนิมนต์, สถานที่ หรือเจ้าภาพ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-amber-500/3 border border-amber-200/40 dark:border-amber-900/30 text-amber-950 dark:text-amber-100 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder-amber-800/35"
          />
        </div>
        <div className="flex gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/40 dark:border-amber-900/30 text-amber-950 dark:text-amber-150 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="all">สถานะทั้งหมด</option>
            <option value="upcoming">รอดำเนินการ</option>
            <option value="completed">เสร็จสิ้น</option>
            <option value="cancelled">ยกเลิก</option>
          </select>
        </div>
      </div>

      {/* Events display */}
      {!selectedMonkId ? (
        <div className="p-8 text-center bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 shadow-md">
          <AlertCircle className="size-8 text-amber-600 dark:text-amber-500 mx-auto mb-2" />
          <p className="text-xs font-bold text-amber-800/60 dark:text-amber-400/65">
            โปรดเชื่อมโยงรายชื่อพระภิกษุก่อนทำการสืบค้นตารางกิจนิมนต์
          </p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 shadow-md shadow-amber-100/5">
          <CalendarIcon className="size-10 text-amber-500/40 dark:text-amber-500/20 mx-auto mb-3" />
          <h4 className="font-bold text-sm text-amber-900 dark:text-amber-300">ไม่พบตารางกิจนิมนต์</h4>
          <p className="text-xs text-amber-700/50 dark:text-amber-500/40 mt-1 max-w-sm mx-auto">
            ขณะนี้ยังไม่มีรายการกิจนิมนต์ที่ตรงกับตัวกรองค้นหา หรือยังไม่มีรายชื่องานนิมนต์ที่ได้รับการมอบหมาย
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredEvents.map((event) => {
            // Find co-assigned monks
            const assignedMonksList = monks.filter(m => event.assigned_monks?.includes(m.id));

            return (
              <div
                key={event.id}
                className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 p-5 shadow-md shadow-amber-100/5 hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/20">
                      {formatThaiDate(event.date)}
                    </span>
                    {getStatusBadge(event.status)}
                  </div>

                  <h3 className="font-bold text-base text-amber-950 dark:text-amber-100 mt-4 leading-relaxed font-heading">
                    {event.title}
                  </h3>

                  <div className="space-y-2 mt-4 text-xs font-semibold text-amber-850 dark:text-amber-350">
                    <div className="flex items-center gap-2">
                      <Clock className="size-3.5 text-amber-600 dark:text-amber-500" />
                      <span>เวลา {event.time} น.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="size-3.5 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
                      <span className="leading-relaxed">สถานที่: {event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="size-3.5 text-amber-600 dark:text-amber-500" />
                      <span>เจ้าภาพ: {event.host_name}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-amber-100/60 dark:border-amber-950/40 mt-5 pt-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800/70 dark:text-amber-500">
                      <Users className="size-3.5" />
                      <span>พระที่รับนิมนต์ร่วมกัน ({assignedMonksList.length} รูป):</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {assignedMonksList.map((m) => (
                      <span
                        key={m.id}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                          m.id === selectedMonkId
                            ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/10'
                            : 'bg-amber-50/50 dark:bg-amber-950/20 text-amber-900/80 dark:text-amber-400 border-amber-200/30'
                        }`}
                      >
                        {m.name} {m.chaya !== '-' ? `(${m.chaya})` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
