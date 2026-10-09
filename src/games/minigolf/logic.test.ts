import { describe, expect, it } from 'vitest';
import { circleHitsRect } from '../maze/logic';
import { BALL_R, H, HOLE_R, LEVELS, W, speedOf, stepBall, type Ball } from './logic';

function simulate(ball: Ball, level: (typeof LEVELS)[1], seconds = 15) {
  let r: ReturnType<typeof stepBall> = 'moving';
  for (let i = 0; i < seconds * 60 && r === 'moving'; i++) r = stepBall(ball, 1 / 60, level);
  return r;
}

describe('minigolf', () => {
  it('has tee and hole clear of walls in every level', () => {
    for (const level of Object.values(LEVELS)) {
      for (const w of level.walls) {
        expect(circleHitsRect(level.tee.x, level.tee.y, BALL_R, w)).toBe(false);
        expect(circleHitsRect(level.hole.x, level.hole.y, HOLE_R, w)).toBe(false);
      }
    }
  });
  it('rolls to a stop and never leaves the course', () => {
    for (const lv of [1, 2, 3] as const) {
      const level = LEVELS[lv];
      for (let a = 0; a < 360; a += 30) {
        const ball = { x: level.tee.x, y: level.tee.y, vx: Math.cos(a) * 650, vy: Math.sin(a) * 650 };
        for (let i = 0; i < 20 * 60; i++) {
          stepBall(ball, 1 / 60, level);
          expect(ball.x).toBeGreaterThan(0);
          expect(ball.x).toBeLessThan(W);
          expect(ball.y).toBeGreaterThan(0);
          expect(ball.y).toBeLessThan(H);
        }
        expect(speedOf(ball)).toBeLessThan(40);
      }
    }
  });
  it('sinks a slow ball rolling over the hole', () => {
    const level = LEVELS[1];
    const ball = { x: level.hole.x, y: level.hole.y + 60, vx: 0, vy: -150 };
    expect(simulate(ball, level)).toBe('sunk');
  });
  it('bounces off a wall', () => {
    const level = LEVELS[1];
    const ball = { x: 180, y: 300, vx: 0, vy: -400 };
    for (let i = 0; i < 30; i++) stepBall(ball, 1 / 60, level);
    expect(ball.vy).toBeGreaterThan(0);
  });
  it('slides further on ice', () => {
    const run = (ice: boolean) => {
      const level = { ...LEVELS[1], walls: [], ice: ice ? [{ x: -500, y: -500, w: 2000, h: 2000 }] : [] };
      const ball = { x: 100, y: 100, vx: 200, vy: 0 };
      simulate(ball, level);
      return ball.x;
    };
    expect(run(true)).toBeGreaterThan(run(false) + 100);
  });
});
