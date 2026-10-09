import { describe, expect, it } from 'vitest';
import { ANCHOR, LEVELS, createWorld, fire, houseDown, pullToShot, removeBall, step, trajectory } from './logic';

function shoot(level: 1 | 2 | 3 | 4, dx: number, dy: number, steps = 420) {
  const w = createWorld(LEVELS[level]);
  for (let i = 0; i < 60; i++) step(w); // let the tower settle
  const { pull, vel } = pullToShot(dx, dy);
  fire(w, { x: ANCHOR.x + pull.x, y: ANCHOR.y + pull.y }, vel);
  for (let i = 0; i < steps; i++) {
    step(w);
    if (houseDown(w)) return true;
  }
  return false;
}

describe('snowball', () => {
  it('towers stand still until hit', () => {
    for (const lv of [1, 2, 3, 4] as const) {
      const w = createWorld(LEVELS[lv]);
      const y0 = LEVELS[lv].house.y;
      for (let i = 0; i < 600; i++) step(w);
      expect(Math.abs(w.house.position.y - y0)).toBeLessThan(4);
      expect(houseDown(w)).toBe(false);
    }
  });
  it('every level can be won with a single shot', () => {
    for (const lv of [1, 2, 3, 4] as const) {
      let wins = 0;
      for (let dx = -55; dx <= -10; dx += 3) for (let dy = -10; dy <= 55; dy += 3) if (shoot(lv, dx, dy)) wins++;
      expect(wins, `level ${lv}`).toBeGreaterThan(0);
    }
  });
  it('misses (too weak) do not win', () => {
    expect(shoot(1, -5, 0)).toBe(false);
  });
  it('clamps the pull and launches opposite to it', () => {
    const { pull, vel } = pullToShot(-200, 100);
    expect(Math.hypot(pull.x, pull.y)).toBeCloseTo(55);
    expect(vel.x).toBeGreaterThan(0);
    expect(vel.y).toBeLessThan(0);
  });
  it('trajectory arcs downward under gravity', () => {
    const t = trajectory({ x: 0, y: 0 }, { x: 5, y: -8 }, 30, 2);
    expect(t[0].y).toBeLessThan(0);
    expect(t[t.length - 1].y).toBeGreaterThan(t[5].y);
  });
  it('removes the ball from the world', () => {
    const w = createWorld(LEVELS[1]);
    fire(w, ANCHOR, { x: 1, y: 0 });
    removeBall(w);
    expect(w.ball).toBeNull();
  });
});
