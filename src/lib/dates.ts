export interface Clock {
  /** The date the calendar treats as "now". */
  today: Date;
  /** All doors unlocked (?preview). */
  preview: boolean;
}

/**
 * Reads the testing overrides from the query string:
 *  ?preview=1           unlock every door
 *  ?today=2026-12-05    pretend it is that date
 */
export function readClock(search: string, now: Date = new Date()): Clock {
  const params = new URLSearchParams(search);
  const preview = params.has('preview') && params.get('preview') !== '0';
  let today = now;
  const override = params.get('today');
  const m = override?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) today = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12);
  return { today, preview };
}

export function unlockDate(day: number, year: number): Date {
  return new Date(year, 11, day);
}

export function isUnlocked(day: number, year: number, clock: Clock): boolean {
  return clock.preview || clock.today.getTime() >= unlockDate(day, year).getTime();
}

/** Whole calendar days until the door opens (0 if already open). */
export function daysUntil(day: number, year: number, today: Date): number {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = unlockDate(day, year).getTime() - start.getTime();
  return Math.max(0, Math.round(diff / 86_400_000));
}
