'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn, formatThaiDate } from '@/lib/utils';

interface ThaiDatePickerProps {
  value: string; // "YYYY-MM-DD"
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

const THAI_MONTHS_LONG = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

export function ThaiDatePicker({
  value,
  onChange,
  placeholder = 'เลือกวันที่...',
  className,
  required = false
}: ThaiDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial date (CE)
  const getParsedDate = (val: string) => {
    if (!val) return new Date();
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const parsedDate = getParsedDate(value);
  const [currentYear, setCurrentYear] = useState(parsedDate.getFullYear()); // CE year
  const [currentMonth, setCurrentMonth] = useState(parsedDate.getMonth()); // 0-indexed

  // Update calendar view when value changes externally
  useEffect(() => {
    const d = getParsedDate(value);
    setCurrentYear(d.getFullYear());
    setCurrentMonth(d.getMonth());
  }, [value]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get number of days in the month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get weekday of the first day of the month (0 = Sunday)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  // Generate years list in Buddhist Era (พ.ศ.)
  // Range from 80 years ago to 20 years in the future
  const thisYearBE = new Date().getFullYear() + 543;
  const startYearBE = thisYearBE - 80;
  const endYearBE = thisYearBE + 20;
  const yearsBE: number[] = [];
  for (let y = endYearBE; y >= startYearBE; y--) {
    yearsBE.push(y);
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const selectedDate = new Date(currentYear, currentMonth, day);
    // Format to YYYY-MM-DD in local time
    const yyyy = selectedDate.getFullYear();
    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(selectedDate.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  // Generate blank spaces for days of the week before the 1st of the month
  const blanks = Array(firstDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const calendarCells = [...blanks, ...days];

  // Helper to determine if a day cell is the selected day
  const isSelectedDay = (day: number) => {
    if (!value) return false;
    const d = new Date(value);
    return (
      !isNaN(d.getTime()) &&
      d.getDate() === day &&
      d.getMonth() === currentMonth &&
      d.getFullYear() === currentYear
    );
  };

  // Helper to check if a day is today
  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth &&
      today.getFullYear() === currentYear
    );
  };

  const formattedDisplay = value ? formatThaiDate(value, 'short') : '';

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          readOnly
          required={required}
          value={formattedDisplay}
          placeholder={placeholder}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer transition-all",
            className
          )}
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-700/55 dark:text-amber-500/40">
          <CalendarIcon className="size-3.5" />
        </div>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-amber-700/40 hover:text-amber-700/70 dark:text-amber-500/30 dark:hover:text-amber-500/60 cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-64 bg-white dark:bg-[#15110a] rounded-xl border border-amber-200/50 dark:border-amber-950/50 shadow-xl p-3 animate-scale-up left-0">
          {/* Header selectors */}
          <div className="flex items-center justify-between gap-1 mb-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-md text-amber-800 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer"
            >
              <ChevronLeft className="size-4" />
            </button>

            <div className="flex items-center gap-1">
              {/* Month Dropdown */}
              <select
                value={currentMonth}
                onChange={(e) => setCurrentMonth(Number(e.target.value))}
                className="text-[11px] font-bold bg-transparent text-amber-950 dark:text-amber-100 border-none outline-none cursor-pointer hover:text-amber-500"
              >
                {THAI_MONTHS_LONG.map((m, idx) => (
                  <option key={m} value={idx} className="bg-white dark:bg-[#15110a] text-amber-950 dark:text-amber-100">
                    {m}
                  </option>
                ))}
              </select>

              {/* Year Dropdown */}
              <select
                value={currentYear + 543}
                onChange={(e) => setCurrentYear(Number(e.target.value) - 543)}
                className="text-[11px] font-bold bg-transparent text-amber-950 dark:text-amber-100 border-none outline-none cursor-pointer hover:text-amber-500"
              >
                {yearsBE.map((y) => (
                  <option key={y} value={y} className="bg-white dark:bg-[#15110a] text-amber-950 dark:text-amber-100">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-md text-amber-800 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 text-center text-[10px] font-bold text-amber-800/40 dark:text-amber-500/40 mb-1">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 text-center text-xs">
            {calendarCells.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="py-1" />;
              }

              const selected = isSelectedDay(day);
              const today = isToday(day);

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={cn(
                    "py-1.5 rounded-md hover:bg-amber-500/20 text-amber-950 dark:text-amber-100 font-medium cursor-pointer transition-colors",
                    selected && "bg-amber-500 hover:bg-amber-600 text-white font-bold",
                    !selected && today && "border border-amber-500/50 text-amber-600 dark:text-amber-400 font-bold",
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
