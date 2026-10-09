import { circleHitsRect, type Rect } from '../maze/logic';

export const W = 360;
export const H = 540;
export const BALL_R = 8;
export const HOLE_R = 14;
export const MAX_SPEED = 650;
const B = 16;

export interface Level {
  par: number;
  tee: { x: number; y: number };
  hole: { x: number; y: number };
  walls: Rect[];
  ice: Rect[];
}

const border: Rect[] = [
  { x: 0, y: 0, w: W, h: B },
  { x: 0, y: H - B, w: W, h: B },
  { x: 0, y: 0, w: B, h: H },
  { x: W - B, y: 0, w: B, h: H },
];

export const LEVELS: Record<1 | 2 | 3, Level> = {
  1: {
    par: 2,
    tee: { x: 180, y: 470 },
    hole: { x: 180, y: 80 },
    walls: [...border, { x: 110, y: 250, w: 140, h: 20 }],
    ice: [],
  },
  2: {
    par: 3,
    tee: { x: 60, y: 480 },
    hole: { x: 290, y: 85 },
    walls: [...border, { x: 16, y: 360, w: 200, h: 20 }, { x: 144, y: 220, w: 200, h: 20 }],
    ice: [{ x: 16, y: 40, w: 328, h: 110 }],
  },
  3: {
    par: 4,
    tee: { x: 300, y: 480 },
    hole: { x: 60, y: 60 },
    walls: [
      ...border,
      { x: 16, y: 400, w: 240, h: 20 },
      { x: 120, y: 300, w: 224, h: 20 },
      { x: 16, y: 200, w: 240, h: 20 },
      { x: 120, y: 100, w: 224, h: 20 },
    ],
    ice: [{ x: 16, y: 222, w: 328, h: 76 }],
  },
};

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export type BallState = 'moving' | 'stopped' | 'sunk';

export function speedOf(b: Ball) {
  return Math.hypot(b.vx, b.vy);
}

function bounce(b: Ball, wall: Rect) {
  const nx0 = Math.max(wall.x, Math.min(b.x, wall.x + wall.w));
  const ny0 = Math.max(wall.y, Math.min(b.y, wall.y + wall.h));
  let nx = b.x - nx0;
  let ny = b.y - ny0;
  let d = Math.hypot(nx, ny);
  if (d === 0) {
    // centre is inside the wall: push out along the shallowest axis
    const left = b.x - wall.x;
    const right = wall.x + wall.w - b.x;
    const top = b.y - wall.y;
    const bottom = wall.y + wall.h - b.y;
    const m = Math.min(left, right, top, bottom);
    nx = m === left ? -1 : m === right ? 1 : 0;
    ny = m === top ? -1 : m === bottom ? 1 : 0;
    d = 1;
    b.x += nx * (m + BALL_R);
    b.y += ny * (m + BALL_R);
  } else {
    nx /= d;
    ny /= d;
    b.x = nx0 + nx * BALL_R;
    b.y = ny0 + ny * BALL_R;
  }
  const vn = b.vx * nx + b.vy * ny;
  if (vn < 0) {
    b.vx -= 1.8 * vn * nx;
    b.vy -= 1.8 * vn * ny;
  }
}

/** Advances the ball by dt seconds. */
export function stepBall(b: Ball, dt: number, level: Level): BallState {
  const steps = Math.max(1, Math.ceil((speedOf(b) * dt) / 3));
  const h = dt / steps;
  for (let i = 0; i < steps; i++) {
    b.x += b.vx * h;
    b.y += b.vy * h;
    for (const w of level.walls) if (circleHitsRect(b.x, b.y, BALL_R, w)) bounce(b, w);
    const onIce = level.ice.some((r) => b.x > r.x && b.x < r.x + r.w && b.y > r.y && b.y < r.y + r.h);
    const k = Math.exp(-(onIce ? 0.25 : 1.3) * h);
    b.vx *= k;
    b.vy *= k;
    if (Math.hypot(b.x - level.hole.x, b.y - level.hole.y) < HOLE_R && speedOf(b) < 380) return 'sunk';
  }
  if (speedOf(b) < 10) {
    b.vx = b.vy = 0;
    return 'stopped';
  }
  return 'moving';
}
