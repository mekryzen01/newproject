import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats an ISO date string (YYYY-MM-DD or full ISO) or Date object into Thai format: "DD ม.ค. พ.ศ."
 * @param dateStr ISO date string or Date object
 * @param formatType 'short' (e.g. 21 มิ.ย. 2569) or 'long' (e.g. 21 มิถุนายน 2569) or 'numeric' (e.g. 21/06/2569)
 */
export function formatThaiDate(
  dateStr: string | Date | null | undefined, 
  formatType: 'short' | 'long' | 'numeric' = 'short'
): string {
  if (!dateStr || dateStr === '-') return '';
  
  try {
    let date: Date;
    if (typeof dateStr === 'string') {
      const datePart = dateStr.split('T')[0];
      const matches = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (matches) {
        const y = parseInt(matches[1], 10);
        const m = parseInt(matches[2], 10) - 1;
        const d = parseInt(matches[3], 10);
        date = new Date(y, m, d);
      } else {
        date = new Date(dateStr);
      }
    } else {
      date = dateStr;
    }

    if (isNaN(date.getTime())) return String(dateStr);

    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear() + 543; // Buddhist Era

    const THAI_MONTHS_SHORT = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];

    const THAI_MONTHS_LONG = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    if (formatType === 'numeric') {
      const dd = String(day).padStart(2, '0');
      const mm = String(month + 1).padStart(2, '0');
      return `${dd}/${mm}/${year}`;
    }

    const monthName = formatType === 'long' ? THAI_MONTHS_LONG[month] : THAI_MONTHS_SHORT[month];
    return `${day} ${monthName} ${year}`;
  } catch (e) {
    return String(dateStr);
  }
}

