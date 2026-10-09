import { describe, expect, it } from 'vitest';
import { daysUntil, isUnlocked, readClock } from './dates';

const at = (s: string) => readClock(`?today=${s}`);

describe('isUnlocked', () => {
  it('locks everything before December', () => {
    expect(isUnlocked(1, 2026, at('2026-11-30'))).toBe(false);
  });
  it('unlocks days up to today only', () => {
    const c = at('2026-12-08');
    expect(isUnlocked(8, 2026, c)).toBe(true);
    expect(isUnlocked(9, 2026, c)).toBe(false);
  });
  it('unlocks all after Dec 24', () => {
    expect(isUnlocked(24, 2026, at('2027-01-02'))).toBe(true);
  });
  it('preview unlocks everything', () => {
    expect(isUnlocked(24, 2026, readClock('?preview=1', new Date(2026, 5, 1)))).toBe(true);
  });
  it('counts days until a door', () => {
    expect(daysUntil(10, 2026, new Date(2026, 11, 8, 15))).toBe(2);
    expect(daysUntil(5, 2026, new Date(2026, 11, 8))).toBe(0);
  });
});
