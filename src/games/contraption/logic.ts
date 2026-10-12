import { Bodies, Body, Composite, Engine, Query } from 'matter-js';

export const W = 360;
export const H = 480;
export const FLOOR = 450;
export const STEP_MS = 1000 / 60;
export const PRESENT = 24;
export const BELT_SPEED = 2.4;
export const TREE_HALF = 38;

export type ItemKind = 'belt' | 'trampoline' | 'wall' | 'slide';

export interface Item {
  kind: ItemKind;
  x: number;
  y: number;
  /** Belt: travel direction. Slide: which way it descends. */
  dir: 1 | -1;
  /** Wall only. */
  vertical: boolean;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  angle?: number;
}

export interface LevelDef {
  start: { x: number; y: number };
  treeX: number;
  fixed: Rect[];
  items: Item[];
}

const item = (kind: ItemKind, x: number, y: number, dir: 1 | -1 = 1, vertical = true): Item => ({ kind, x, y, dir, vertical });

export const SLIDE_ANGLE = 0.42;

/** Geometry of a placed item. */
export function itemRect(it: Item): Required<Rect> {
  switch (it.kind) {
    case 'belt':
      return { x: it.x, y: it.y, w: 120, h: 12, angle: 0 };
    case 'trampoline':
      return { x: it.x, y: it.y, w: 64, h: 10, angle: 0 };
    case 'wall':
      return it.vertical ? { x: it.x, y: it.y, w: 12, h: 80, angle: 0 } : { x: it.x, y: it.y, w: 80, h: 12, angle: 0 };
    case 'slide':
      return { x: it.x, y: it.y, w: 110, h: 8, angle: it.dir * SLIDE_ANGLE };
  }
}

/** Tap action: reverse a belt, mirror a slide, turn a wall. */
export function flipItem(it: Item): Item {
  if (it.kind === 'belt' || it.kind === 'slide') return { ...it, dir: it.dir === 1 ? -1 : 1 };
  if (it.kind === 'wall') return { ...it, vertical: !it.vertical };
  return it;
}

export function hitItem(it: Item, px: number, py: number, pad = 12): boolean {
  const r = itemRect(it);
  const dx = px - r.x;
  const dy = py - r.y;
  const c = Math.cos(-r.angle);
  const s = Math.sin(-r.angle);
  const lx = dx * c - dy * s;
  const ly = dx * s + dy * c;
  return Math.abs(lx) <= r.w / 2 + pad && Math.abs(ly) <= r.h / 2 + pad;
}

export function clampItem(it: Item, x: number, y: number): Item {
  return { ...it, x: Math.min(W - 24, Math.max(24, x)), y: Math.min(FLOOR - 8, Math.max(24, y)) };
}

const FIXED_FLOOR: Rect[] = [
  { x: W / 2, y: FLOOR + 20, w: W + 400, h: 40 },
  { x: -10, y: H / 2, w: 20, h: H * 2 },
  { x: W + 10, y: H / 2, w: 20, h: H * 2 },
];

export type LevelId = 1 | 2 | 3 | 4 | 5;

export const LEVELS: Record<LevelId, LevelDef> = {
  1: {
    start: { x: 50, y: 50 },
    treeX: 300,
    fixed: [],
    items: [item('slide', 90, 250), item('belt', 160, 430)],
  },
  2: {
    start: { x: 50, y: 50 },
    treeX: 305,
    fixed: [{ x: 190, y: 315, w: 14, h: 270 }],
    items: [item('slide', 110, 410, -1), item('trampoline', 60, 300), item('belt', 270, 200)],
  },
  3: {
    start: { x: 310, y: 50 },
    treeX: 55,
    fixed: [
      { x: 185, y: 330, w: 14, h: 240 },
      { x: 120, y: 190, w: 100, h: 12 },
    ],
    items: [item('slide', 250, 400), item('trampoline', 300, 330), item('belt', 80, 300), item('wall', 40, 150)],
  },
  4: {
    start: { x: 310, y: 40 },
    treeX: 50,
    fixed: [
      { x: 250, y: 150, w: 130, h: 12 },
      { x: 175, y: 330, w: 14, h: 240 },
      { x: 95, y: 240, w: 110, h: 12 },
    ],
    items: [item('slide', 300, 420), item('slide', 60, 400, -1), item('belt', 250, 330), item('trampoline', 100, 430), item('wall', 300, 250)],
  },
  5: {
    start: { x: 40, y: 40 },
    treeX: 180,
    fixed: [
      { x: 125, y: 385, w: 12, h: 130 },
      { x: 235, y: 385, w: 12, h: 130 },
      { x: 95, y: 190, w: 100, h: 12 },
      { x: 270, y: 260, w: 100, h: 12 },
    ],
    items: [item('belt', 60, 440), item('belt', 300, 440), item('slide', 200, 120), item('slide', 300, 150, -1), item('trampoline', 60, 330), item('trampoline', 300, 380)],
  },
};

export interface Sim {
  engine: Engine;
  present: Body;
  solids: Body[];
  belts: Required<Rect>[];
  beltDir: number[];
  tramps: Required<Rect>[];
  treeX: number;
  prevBottom: number;
  stall: number;
  age: number;
}

export function createSim(level: LevelDef, items: Item[]): Sim {
  const engine = Engine.create();
  engine.positionIterations = 8;
  engine.velocityIterations = 6;
  const statics: Body[] = [];
  const mk = (r: Rect, opts: Matter.IChamferableBodyDefinition = {}) =>
    Bodies.rectangle(r.x, r.y, r.w, r.h, { isStatic: true, friction: 0.4, frictionStatic: 0, restitution: 0.1, angle: r.angle ?? 0, ...opts });
  for (const r of [...FIXED_FLOOR, ...level.fixed]) statics.push(mk(r));
  const belts: Required<Rect>[] = [];
  const beltDir: number[] = [];
  const tramps: Required<Rect>[] = [];
  for (const it of items) {
    const r = itemRect(it);
    if (it.kind === 'trampoline') {
      tramps.push(r);
    } else {
      if (it.kind === 'belt') {
        belts.push(r);
        beltDir.push(it.dir);
      }
      statics.push(mk(r, { friction: it.kind === 'slide' ? 0 : 0.4 }));
    }
  }
  const present = Bodies.rectangle(level.start.x, level.start.y, PRESENT, PRESENT, {
    inertia: Infinity,
    friction: 0,
    frictionStatic: 0,
    frictionAir: 0.002,
    restitution: 0.1,
    density: 0.002,
  });
  Composite.add(engine.world, [...statics, present]);
  return { engine, present, solids: statics, belts, beltDir, tramps, treeX: level.treeX, prevBottom: level.start.y + PRESENT / 2, stall: 0, age: 0 };
}

export type SimResult = 'run' | 'won' | 'failed';

export function stepSim(s: Sim): SimResult {
  Engine.update(s.engine, STEP_MS);
  s.age++;
  const p = s.present.position;
  const v = { x: s.present.velocity.x, y: s.present.velocity.y };
  const half = PRESENT / 2;
  const bottom = p.y + half;

  // Matter's own friction makes boxes creep on gentle slopes, so ground friction is applied by hand:
  // anything resting on a flat surface loses horizontal speed.
  if (Query.collides(s.present, s.solids).some((c) => Math.abs(c.normal.y) > 0.95)) {
    v.x *= 0.96;
    Body.setVelocity(s.present, { x: v.x, y: v.y });
  }

  s.belts.forEach((b, i) => {
    const onTop = Math.abs(p.x - b.x) < b.w / 2 + half - 4 && Math.abs(bottom - (b.y - b.h / 2)) < 4;
    if (onTop) Body.setVelocity(s.present, { x: v.x + (s.beltDir[i] * BELT_SPEED - v.x) * 0.3, y: v.y });
  });
  for (const t of s.tramps) {
    const top = t.y - t.h / 2;
    const over = Math.abs(p.x - t.x) < t.w / 2 + half - 4;
    if (over && v.y > 0.5 && s.prevBottom <= top + 2 && bottom >= top) {
      Body.setVelocity(s.present, { x: v.x, y: -Math.min(12, Math.max(8.5, v.y * 0.9 + 3)) });
    }
  }
  s.prevBottom = bottom;

  if (Math.abs(p.x - s.treeX) < TREE_HALF && p.y > FLOOR - 50) return 'won';
  const speed = Math.hypot(s.present.velocity.x, s.present.velocity.y);
  s.stall = speed < 0.08 ? s.stall + 1 : 0;
  if (s.stall > 80 || p.y > H + 60 || s.age > 60 * 30) return 'failed';
  return 'run';
}
