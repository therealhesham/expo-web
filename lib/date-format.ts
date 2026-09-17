import { fromRiyadhParts, toRiyadhParts } from '@/lib/riyadh-time';

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export function toArabicDigits(input: string): string {
  return input.replace(/[0-9]/g, (d) => ARABIC_DIGITS[Number(d)]);
}

const ARABIC_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

export function formatArabicDate(date: Date): string {
  const { day, month } = toRiyadhParts(date);
  return `${toArabicDigits(String(day))} ${ARABIC_MONTHS[month]}`;
}

export function formatArabicTime(date: Date): string {
  const { hour, minute } = toRiyadhParts(date);
  let hours = hour;
  const minutes = minute;
  const suffix = hours >= 12 ? 'م' : 'ص';
  hours = hours % 12 || 12;
  const hh = toArabicDigits(String(hours));
  const mm = toArabicDigits(String(minutes).padStart(2, '0'));
  return `${hh}:${mm} ${suffix}`;
}

// Arabic pluralizes small counts irregularly (dual + broken plural) — a
// literal "١ أيام" reads as a grammar mistake to a native speaker, so this
// is worth the branching instead of a single generic template.
export function formatDaysAr(days: number): string {
  if (days === 1) return 'يوم واحد';
  if (days === 2) return 'يومان';
  if (days >= 3 && days <= 10) return `${toArabicDigits(String(days))} أيام`;
  return `${toArabicDigits(String(days))} يوماً`;
}

export function daysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

// Mirrors rentcar's lib/booking-search-shared.ts exactly (addLocalCalendarMonths
// + computeAutoDropoff) — a real calendar month, clamped to the previous
// month's last day when the target month is shorter (e.g. Jan 31 + 1 month
// lands on Feb 28/29, not Mar 3).
export function addCalendarMonths(base: Date, months: number): Date {
  const p = toRiyadhParts(base);
  const total = p.month + months;
  const year = p.year + Math.floor(total / 12);
  const month = ((total % 12) + 12) % 12;
  // Clamp to the target month's last day (e.g. Jan 31 + 1 month lands on
  // Feb 28/29, not Mar 3) — day 0 of the following month is that month's last day.
  const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const day = Math.min(p.day, lastDayOfMonth);
  return fromRiyadhParts(year, month, day, p.hour, p.minute);
}

// Same minimum-duration rule rentcar enforces server-side for these rental
// types — auto-computing the return date to match means the UI can never
// produce a booking shorter than what the backend would reject anyway.
export function computeAutoReturn(pickup: Date, period: 'weekly' | 'monthly'): Date {
  // Riyadh observes no DST, so adding exact 24h chunks is exact.
  if (period === 'weekly') return new Date(pickup.getTime() + 7 * 86400000);
  return addCalendarMonths(pickup, 1);
}
