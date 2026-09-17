// Reads the same { days: { "0": {open,close,closed?}, ... "6": {...} } }
// shape the backend already returns (0=Sunday…6=Saturday, matching JS
// Date#getDay()) — mirrors rentcar's own lib/branch-opening-hours.ts so
// "open now" here means the same thing it means on the web app.
import { toRiyadhParts } from '@/lib/riyadh-time';

interface DayHours {
  closed?: boolean;
  open?: string;
  close?: string;
}

function toMinutes(hm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hm.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

export function isBranchOpenNow(openingHours: unknown): boolean | null {
  const days = (openingHours as { days?: Record<string, DayHours> } | null)?.days;
  if (!days) return null;

  const { weekday, hour, minute } = toRiyadhParts(new Date());
  const minutes = hour * 60 + minute;
  const today = days[String(weekday)];
  if (!today || today.closed || !today.open || !today.close) return false;

  const open = toMinutes(today.open);
  const close = toMinutes(today.close);
  if (open == null || close == null) return null;
  return minutes >= open && minutes <= close;
}
