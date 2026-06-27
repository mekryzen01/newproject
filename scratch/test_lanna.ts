import { checkWanKaoKong } from '../lib/lanna-calendar';

const dates = [
  '2026-06-23', // Expect Day: สี (Dragon), Month: 10
  '2026-06-22', // Expect Day: เหม้า, Month: 10
  '2026-06-24', // Expect Day: ใส้, Month: 10
  '2026-07-29', // Day of entry
  '2026-10-11', // Month: 12
];

dates.forEach(dStr => {
  const d = new Date(dStr);
  const info = checkWanKaoKong(d);
  console.log(`Date: ${dStr} -> Lanna Month: ${info.lannaMonthName}, Day Sign: ${info.daySign}, Wan Kao Kong? ${info.isWanKaoKong ? 'YES (ห้ามเผาศพ)' : 'NO'}`);
});

console.log('\nScanning for Wan Kao Kong in June 2026:');
for (let i = 1; i <= 30; i++) {
  const dayStr = `2026-06-${String(i).padStart(2, '0')}`;
  const d = new Date(dayStr);
  const info = checkWanKaoKong(d);
  if (info.isWanKaoKong) {
    console.log(`  - ${dayStr}: ${info.message} (Month: ${info.lannaMonthName}, Day: ${info.daySign})`);
  }
}
