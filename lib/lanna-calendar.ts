// Lanna Calendar Utility
// Calculates Lanna month, day sign (ลูกวัน), and checks for "วันเก้ากอง" (Wan Kao Kong)

// 12 Lanna Day Signs (ลูกวัน) corresponding to zodiac signs
// 1 = ไจ้ (Rat), 2 = เป้า (Ox), ..., 12 = ไค้ (Pig)
export const LANNA_DAY_SIGNS = [
  'ไจ้',     // 1: Rat (ชวด)
  'เป้า',    // 2: Ox (ฉลู)
  'ยี',      // 3: Tiger (ขาล)
  'เหม้า',   // 4: Rabbit (เถาะ)
  'สี',      // 5: Dragon (มะโรง)
  'ใส้',     // 6: Snake (มะเส็ง)
  'สะง้า',   // 7: Horse (มะเมีย)
  'เม็ด',    // 8: Goat (มะแม)
  'สัน',     // 9: Monkey (วอก)
  'เล้า',    // 10: Rooster (ระกา)
  'เส็ด',    // 11: Dog (จอ)
  'ไค้'      // 12: Pig (กุน)
];

// Lanna Month Names
export const LANNA_MONTH_NAMES = [
  'เกี๋ยง (เดือน 1)',
  'ยี่ (เดือน 2)',
  'เดือน 3',
  'เดือน 4',
  'เดือน 5',
  'เดือน 6',
  'เดือน 7',
  'เดือน 8',
  'เดือน 9',
  'เดือน 10',
  'เดือน 11',
  'เดือน 12'
];

// Start dates of Thai Lunar Months in 2026 and 2027 (Central Thai Lunar Calendar)
// Central Month = 1 to 12.
// Lanna Month = (Central Month + 2) % 12 (11 -> 1, 12 -> 2)
const THAI_LUNAR_BOUNDARIES = [
  { start: '2025-12-20', centralMonth: 2 },
  { start: '2026-01-19', centralMonth: 3 },
  { start: '2026-02-17', centralMonth: 4 },
  { start: '2026-03-19', centralMonth: 5 },
  { start: '2026-04-17', centralMonth: 6 },
  { start: '2026-05-17', centralMonth: 7 },
  { start: '2026-06-15', centralMonth: 8 },
  { start: '2026-07-15', centralMonth: 8 }, // 8-8 leap month
  { start: '2026-08-14', centralMonth: 9 },
  { start: '2026-09-12', centralMonth: 10 },
  { start: '2026-10-12', centralMonth: 11 },
  { start: '2026-11-10', centralMonth: 12 },
  { start: '2026-12-10', centralMonth: 1 },
  { start: '2026-12-25', centralMonth: 2 },
  { start: '2027-01-24', centralMonth: 3 },
  { start: '2027-02-22', centralMonth: 4 },
  { start: '2027-03-24', centralMonth: 5 },
  { start: '2027-04-23', centralMonth: 6 },
  { start: '2027-05-23', centralMonth: 7 },
  { start: '2027-06-22', centralMonth: 8 },
  { start: '2027-08-03', centralMonth: 9 },
  { start: '2027-09-02', centralMonth: 10 },
  { start: '2027-10-02', centralMonth: 11 },
  { start: '2027-11-02', centralMonth: 12 },
  { start: '2027-12-03', centralMonth: 1 },
  { start: '2027-12-28', centralMonth: 2 }
];

// Helper to format date object to YYYY-MM-DD
function formatDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Calculate days between two dates (safe from timezone and DST issues)
function getDaysBetween(d1: Date, d2: Date): number {
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

// Get the Lanna day sign index (1-based: 1 = ไจ้, ..., 12 = ไค้)
export function getLannaDayIndex(date: Date): number {
  // Calibration Anchor: 2026-06-23 is Earth Dragon (สี / Dragon) which is index 5 in LANNA_DAY_SIGNS
  const anchorDate = new Date('2026-06-23');
  const diffDays = getDaysBetween(anchorDate, date);
  return ((5 - 1 + diffDays) % 12 + 12) % 12 + 1;
}

// Get the name of the Lanna day sign
export function getLannaDaySignName(date: Date): string {
  const index = getLannaDayIndex(date);
  return LANNA_DAY_SIGNS[index - 1];
}

// Get the Lanna month (1 to 12)
export function getLannaMonth(date: Date): number {
  const dateStr = formatDateString(date);

  // Check boundaries list
  for (let i = THAI_LUNAR_BOUNDARIES.length - 1; i >= 0; i--) {
    if (dateStr >= THAI_LUNAR_BOUNDARIES[i].start) {
      const central = THAI_LUNAR_BOUNDARIES[i].centralMonth;
      // Lanna Month = (Central Month + 2)
      let lanna = central + 2;
      if (lanna > 12) lanna -= 12;
      return lanna;
    }
  }

  // Fallbacks for outside the boundaries (before 2025-12-20 or after 2027-12-28)
  // Approximate using standard synodic month calculation relative to a known start.
  // We use 2026-06-15 as start of Central Month 8 (Lanna Month 10).
  const anchorDate = new Date('2026-06-15');
  const daysDiff = getDaysBetween(anchorDate, date);
  const synodicMonth = 29.530589;
  const lunations = daysDiff / synodicMonth;
  
  // Calculate central month starting from month 8 at 2026-06-15
  let centralFloat = 8 + lunations;
  let central = Math.floor(centralFloat) % 12;
  if (central <= 0) central += 12;
  
  let lanna = central + 2;
  if (lanna > 12) lanna -= 12;
  return lanna;
}

// Get Lanna month name
export function getLannaMonthName(date: Date): string {
  const m = getLannaMonth(date);
  return LANNA_MONTH_NAMES[m - 1];
}

// Check if a date is "วันเก้ากอง" (Wan Kao Kong) - Forbidden to cremate/funeral
export function checkWanKaoKong(date: Date): { isWanKaoKong: boolean; daySign: string; lannaMonth: number; lannaMonthName: string; message: string } {
  const dayIndex = getLannaDayIndex(date);
  const daySign = LANNA_DAY_SIGNS[dayIndex - 1];
  const lannaMonth = getLannaMonth(date);
  const lannaMonthName = LANNA_MONTH_NAMES[lannaMonth - 1];

  // Forbidden day sign index for each Lanna Month:
  // Formula: forbiddenSignIndex = ((8 - LannaMonth) % 12 + 12) % 12 + 1
  const forbiddenSignIndex = ((8 - lannaMonth) % 12 + 12) % 12 + 1;
  const isWanKaoKong = dayIndex === forbiddenSignIndex;

  return {
    isWanKaoKong,
    daySign,
    lannaMonth,
    lannaMonthName,
    message: isWanKaoKong ? 'วันเก้ากอง (ห้ามเผาศพ)' : ''
  };
}
