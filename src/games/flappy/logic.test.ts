import { describe, expect, it } from 'vitest';
import { GAP, H, OB_W, SLEIGH_X, crashed, makeWorld, newObstacle, stepWorld } from './logic';

describe('flappy', () => {
  it('falls under gravity and crashes on the ground', () => {
    const w = makeWorld();
    let frames = 0;
    while (!crashed(w) && frames++ < 600) stepWorld(w, 1 / 60, 1, () => 0.5);
    expect(crashed(w)).toBe(true);
    expect(w.y).toBeGreaterThan(H - 80);
  });
  it('does not crash when flying through the gap', () => {
    const w = makeWorld();
    w.obstacles = [{ x: SLEIGH_X - OB_W / 2, gap: w.y, passed: false }];
    expect(crashed(w)).toBe(false);
  });
  it('crashes into a cloud above the gap', () => {
    const w = makeWorld();
    w.obstacles = [{ x: SLEIGH_X - OB_W / 2, gap: w.y + GAP, passed: false }];
    expect(crashed(w)).toBe(true);
  });
  it('keeps gaps reachable and scores passed obstacles', () => {
    for (let i = 0; i < 100; i++) {
      const o = newObstacle(0);
      expect(o.gap - GAP / 2).toBeGreaterThanOrEqual(50);
      expect(o.gap + GAP / 2).toBeLessThanOrEqual(H - 40 - 50);
    }
    const w = makeWorld();
    w.obstacles = [{ x: SLEIGH_X - OB_W - 30, gap: 200, passed: false }];
    expect(stepWorld(w, 0.01, 1, () => 0.5)).toBe(true);
    expect(w.score).toBe(1);
  });
});
