import { describe, expect, it } from 'vitest';
import { createStackWorld, dropPresent, hangPos, stepStack, swingAngle, swingSpeed, towerTop, BASE_Y } from './logic';

const rng = () => 0.5;

function run(w: ReturnType<typeof createStackWorld>, steps: number) {
  let last = 'none';
  for (let i = 0; i < steps; i++) {
    const ev = stepStack(w, 1, rng);
    if (ev === 'fell') return 'fell';
    if (ev === 'settled') last = ev;
  }
  return last;
}

describe('stack', () => {
  it('swing stays within the pendulum limits and speeds up', () => {
    for (let p = 0; p < 20; p += 0.3) expect(Math.abs(swingAngle(p))).toBeLessThanOrEqual(0.55);
    expect(swingSpeed(10)).toBeGreaterThan(swingSpeed(0));
    expect(hangPos(0, 0).x).toBeCloseTo(180);
  });

  it('a present dropped in the middle settles on the pedestal', () => {
    const w = createStackWorld(rng);
    dropPresent(w); // phase 0 = centred
    expect(run(w, 400)).toBe('settled');
    expect(w.count).toBe(1);
    expect(towerTop(w)).toBeLessThan(BASE_Y);
  });

  it('a present dropped far off to the side falls', () => {
    const w = createStackWorld(rng);
    w.phase = Math.PI / 2; // full swing to the right
    dropPresent(w);
    expect(run(w, 600)).toBe('fell');
  });

  it('centred drops build a tall tower', () => {
    const w = createStackWorld(rng);
    for (let n = 0; n < 6; n++) {
      w.phase = 0;
      w.hanging = { w: 70, h: 40, color: 0 };
      dropPresent(w);
      expect(run(w, 500)).not.toBe('fell');
    }
    expect(w.count).toBe(6);
  });
});
