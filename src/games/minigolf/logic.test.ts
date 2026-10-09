import { describe, expect, it } from 'vitest';
import { circleHitsRect } from '../maze/logic';
import { createRng } from '../../lib/random';
import { BALL_R, H, HOLE_R, LEVELS, W, moverRect, speedOf, stepBall, type Ball, type Level } from './logic';

function simulate(ball: Ball, level: Level, seconds = 15) {
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

const CELL = 6;
const cols = Math.ceil(W / CELL);
const rows = Math.ceil(H / CELL);

/** Grid BFS distance (in cells) from the hole over cells the ball centre can occupy. */
function distanceField(level: Level, t: number | null) {
  const rects = [...level.walls, ...(t === null ? [] : (level.movers ?? []).map((m) => moverRect(m, t)))];
  const free = (cx: number, cy: number) =>
    !rects.some((r) => circleHitsRect(cx * CELL + CELL / 2, cy * CELL + CELL / 2, BALL_R, r));
  const dist = new Array<number>(cols * rows).fill(Infinity);
  const start = Math.floor(level.hole.y / CELL) * cols + Math.floor(level.hole.x / CELL);
  dist[start] = 0;
  const queue = [start];
  for (let q = 0; q < queue.length; q++) {
    const i = queue[q];
    const cx = i % cols;
    const cy = Math.floor(i / cols);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      const j = ny * cols + nx;
      if (dist[j] !== Infinity || !free(nx, ny)) continue;
      dist[j] = dist[i] + 1;
      queue.push(j);
    }
  }
  return (x: number, y: number) => dist[Math.floor(y / CELL) * cols + Math.floor(x / CELL)] ?? Infinity;
}

describe('minigolf moving blocks', () => {
  it('moves blocks around their base position and never covers the tee or hole', () => {
    for (const lv of [4, 5] as const) {
      const level = LEVELS[lv];
      expect(level.movers?.length).toBeGreaterThan(0);
      for (const m of level.movers!) {
        const xs = new Set<number>();
        for (let t = 0; t < 12; t += 0.05) {
          const r = moverRect(m, t);
          xs.add(Math.round(r.x + r.y));
          expect(circleHitsRect(level.tee.x, level.tee.y, BALL_R, r)).toBe(false);
          expect(circleHitsRect(level.hole.x, level.hole.y, HOLE_R, r)).toBe(false);
        }
        expect(xs.size).toBeGreaterThan(10);
      }
    }
  });

  it('keeps a path from tee to hole open at every moment', () => {
    for (const lv of [4, 5] as const) {
      const level = LEVELS[lv];
      for (let t = 0; t < 20; t += 0.25) {
        const d = distanceField(level, t);
        expect(d(level.tee.x, level.tee.y), `level ${lv} at t=${t}`).toBeLessThan(Infinity);
      }
    }
  });

  it('a moving block knocks the ball away', () => {
    const level: Level = {
      ...LEVELS[1],
      walls: [],
      ice: [],
      movers: [{ x: 100, y: 100, w: 20, h: 100, ax: 60, ay: 0, period: 4 }],
    };
    const ball = { x: 135, y: 150, vx: 0, vy: 0 };
    let t = 0;
    for (let i = 0; i < 4 * 60; i++, t += 1 / 60) stepBall(ball, 1 / 60, level, t);
    expect(ball.x).toBeGreaterThan(135 + 5); // got pushed right by the passing block
  });

  it('can be won by a random-search bot (levels are solvable)', { timeout: 120_000 }, () => {
    const field = new Map(([1, 4, 5] as const).map((lv) => [lv, distanceField(LEVELS[lv], null)]));
    for (const lv of [1, 4, 5] as const) {
      const level = LEVELS[lv];
      const dist = field.get(lv)!;
      let won = false;
      for (let attempt = 0; attempt < 12 && !won; attempt++) {
        const rng = createRng(attempt * 7919 + lv);
        let ball: Ball = { x: level.tee.x, y: level.tee.y, vx: 0, vy: 0 };
        let t = rng() * 10;
        for (let stroke = 0; stroke < 12 && !won; stroke++) {
          let best: { ball: Ball; t: number; d: number } | null = null;
          for (let k = 0; k < 70 && !won; k++) {
            const a = rng() * Math.PI * 2;
            const v = 120 + rng() * 530;
            const b: Ball = { x: ball.x, y: ball.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v };
            let tt = t + rng() * 2;
            let r: ReturnType<typeof stepBall> = 'moving';
            for (let i = 0; i < 8 * 60 && r === 'moving'; i++, tt += 1 / 60) r = stepBall(b, 1 / 60, level, tt);
            if (r === 'sunk') won = true;
            else {
              const d = dist(b.x, b.y);
              if (!best || d < best.d) best = { ball: b, t: tt, d };
            }
          }
          if (best) (ball = best.ball), (t = best.t);
        }
      }
      expect(won, `level ${lv} bot should find a way in`).toBe(true);
    }
  });
});
