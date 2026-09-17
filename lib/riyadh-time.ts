// Saudi Arabia has used a fixed UTC+3 offset since 1968 and observes no DST,
// so plain offset arithmetic is exact here — unlike zones where the offset
// varies by date, this never needs a timezone database.
const RIYADH_OFFSET_MS = 3 * 60 * 60 * 1000;

export interface RiyadhParts {
  year: number;
  month: number; // 0-11
  day: number;
  weekday: number; // 0=Sunday...6=Saturday, matching JS Date#getDay()
  hour: number;
  minute: number;
}

// Reads the wall-clock date/time a given instant corresponds to in Riyadh,
// regardless of the device's own timezone.
export function toRiyadhParts(date: Date): RiyadhParts {
  const shifted = new Date(date.getTime() + RIYADH_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
  };
}

// Inverse of toRiyadhParts: builds the exact instant corresponding to the
// given wall-clock moment in Riyadh. Overflowing fields (day 32, month 13,
// etc.) normalize the same way the native Date constructor does.
export function fromRiyadhParts(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  return new Date(Date.UTC(year, month, day, hour, minute, 0) - RIYADH_OFFSET_MS);
}
