import { describe, expect, it } from 'vitest';
import { SONG_IDS, buildTrack, hitTime, noteAt, scaleBetween, stepFromY } from './logic';

describe('melody', () => {
  it('builds sensible tracks for every song', () => {
    for (const id of SONG_IDS) {
      const t = buildTrack(id);
      expect(t.notes.every((n) => n.step > 0 && n.step < t.scale.length - 1)).toBe(true);
      expect(t.scale.length).toBeLessThanOrEqual(12);
      expect(t.length).toBeGreaterThan(10);
      expect(t.length).toBeLessThan(50);
    }
  });
  it('scale only contains C-major pitches', () => {
    expect(scaleBetween(60, 67)).toEqual([60, 62, 64, 65, 67]);
  });
  it('maps y to steps with the top being the highest', () => {
    expect(stepFromY(0, 100, 5)).toBe(4);
    expect(stepFromY(99, 100, 5)).toBe(0);
    expect(stepFromY(-20, 100, 5)).toBe(4);
    expect(stepFromY(500, 100, 5)).toBe(0);
  });
  it('perfect play scores the full note time, wrong play scores nothing', () => {
    const t = buildTrack('jingle-bells');
    let hit = 0;
    for (const n of t.notes) hit += hitTime(t, n.start, n.start + n.dur, n.step);
    expect(hit).toBeCloseTo(t.noteTime, 6);
    expect(hitTime(t, 0, t.length, 0)).toBe(0);
    expect(hitTime(t, 0, t.length, null)).toBe(0);
  });
  it('finds the active note', () => {
    const t = buildTrack('silent-night');
    expect(noteAt(t, 0)).toBe(t.notes[0]);
    expect(noteAt(t, t.length + 1)).toBeUndefined();
  });
});
