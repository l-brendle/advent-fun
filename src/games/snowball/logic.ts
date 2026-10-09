import { Bodies, Body, Composite, Engine } from 'matter-js';

export const W = 480;
export const H = 320;
export const GROUND_Y = 290;
export const ANCHOR = { x: 70, y: 222 };
export const MAX_PULL = 55;
/** Launch velocity (px per physics step) per px of pull. */
export const POWER = 0.22;
/** Gravity in px/step² (matter default: 0.001 * 16.67²). */
export const GRAVITY = 0.2778;
export const BALL_R = 11;
export const STEP_MS = 1000 / 60;

export type Kind = 'wood' | 'ice' | 'stone' | 'heavy';
export interface BlockDef {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: Kind;
}
export interface LevelDef {
  blocks: BlockDef[];
  house: { x: number; y: number; heavy?: boolean };
}

const HOUSE_W = 38;
const HOUSE_H = 30;

function tower(cx: number, storeys: 1 | 2): LevelDef {
  const blocks: BlockDef[] = [
    { x: cx - 30, y: GROUND_Y - 25, w: 16, h: 50, kind: 'wood' },
    { x: cx + 30, y: GROUND_Y - 25, w: 16, h: 50, kind: 'wood' },
    { x: cx, y: GROUND_Y - 55, w: 100, h: 10, kind: 'wood' },
  ];
  if (storeys === 1) return { blocks, house: { x: cx, y: GROUND_Y - 60 - HOUSE_H / 2 } };
  blocks.push(
    { x: cx - 22, y: GROUND_Y - 80, w: 14, h: 40, kind: 'ice' },
    { x: cx + 22, y: GROUND_Y - 80, w: 14, h: 40, kind: 'ice' },
    { x: cx, y: GROUND_Y - 105, w: 70, h: 10, kind: 'wood' },
  );
  return { blocks, house: { x: cx, y: GROUND_Y - 110 - HOUSE_H / 2 } };
}

/** Tall, narrow tower behind a high stone wall, with a heavy weight beside the house. */
function fortress(): LevelDef {
  const cx = 412;
  return {
    blocks: [
      { x: 292, y: GROUND_Y - 90, w: 14, h: 180, kind: 'stone' },
      { x: cx - 24, y: GROUND_Y - 25, w: 14, h: 50, kind: 'wood' },
      { x: cx + 24, y: GROUND_Y - 25, w: 14, h: 50, kind: 'wood' },
      { x: cx, y: GROUND_Y - 55, w: 80, h: 10, kind: 'wood' },
      { x: cx - 18, y: GROUND_Y - 80, w: 12, h: 40, kind: 'ice' },
      { x: cx + 18, y: GROUND_Y - 80, w: 12, h: 40, kind: 'ice' },
      { x: cx, y: GROUND_Y - 105, w: 60, h: 10, kind: 'wood' },
      { x: cx - 14, y: GROUND_Y - 125, w: 10, h: 30, kind: 'wood' },
      { x: cx + 14, y: GROUND_Y - 125, w: 10, h: 30, kind: 'wood' },
      { x: cx, y: GROUND_Y - 145, w: 64, h: 10, kind: 'wood' },
      { x: cx + 17, y: GROUND_Y - 158, w: 16, h: 16, kind: 'heavy' },
    ],
    house: { x: cx - 12, y: GROUND_Y - 150 - HOUSE_H / 2, heavy: true },
  };
}

export const LEVELS: Record<1 | 2 | 3 | 4, LevelDef> = {
  1: tower(390, 1),
  2: tower(390, 2),
  3: (() => {
    const t = tower(415, 1);
    t.blocks.push({ x: 320, y: GROUND_Y - 45, w: 14, h: 90, kind: 'stone' });
    return t;
  })(),
  4: fortress(),
};

const MATERIAL: Record<Kind, Matter.IBodyDefinition> = {
  wood: { density: 0.0012, friction: 0.6, restitution: 0.05 },
  ice: { density: 0.0009, friction: 0.08, restitution: 0.1 },
  stone: { isStatic: true, friction: 0.8 },
  heavy: { density: 0.004, friction: 0.7, restitution: 0.05 },
};

export interface SnowWorld {
  engine: Engine;
  house: Body;
  /** Height the house started at; it counts as knocked down once it has dropped well below. */
  houseStartY: number;
  ball: Body | null;
}

export function createWorld(level: LevelDef): SnowWorld {
  const engine = Engine.create();
  engine.positionIterations = 10;
  engine.velocityIterations = 8;
  const ground = Bodies.rectangle(W / 2, GROUND_Y + 40, W * 3, 80, { isStatic: true, label: 'ground', friction: 1 });
  const blocks = level.blocks.map((b) => Bodies.rectangle(b.x, b.y, b.w, b.h, { ...MATERIAL[b.kind], label: b.kind }));
  const house = Bodies.rectangle(level.house.x, level.house.y, HOUSE_W, HOUSE_H, {
    label: 'house',
    density: level.house.heavy ? 0.002 : 0.0011,
    friction: 0.6,
    restitution: 0.05,
  });
  Composite.add(engine.world, [ground, ...blocks, house]);
  return { engine, house, houseStartY: level.house.y, ball: null };
}

export function fire(w: SnowWorld, pos: { x: number; y: number }, vel: { x: number; y: number }) {
  const ball = Bodies.circle(pos.x, pos.y, BALL_R, {
    label: 'ball',
    density: 0.006,
    restitution: 0.3,
    friction: 0.4,
    frictionAir: 0,
  });
  Body.setVelocity(ball, vel);
  Composite.add(w.engine.world, ball);
  w.ball = ball;
}

export function removeBall(w: SnowWorld) {
  if (w.ball) Composite.remove(w.engine.world, w.ball);
  w.ball = null;
}

export function step(w: SnowWorld) {
  Engine.update(w.engine, STEP_MS);
}

/** The gingerbread house has been knocked down: dropped well below its start (or off the map). */
export function houseDown(w: SnowWorld): boolean {
  const { x, y } = w.house.position;
  return y > Math.min(GROUND_Y - 19, w.houseStartY + 26) || x < -40 || x > W + 40;
}

/** Clamps a pull offset to MAX_PULL and returns it with the matching launch velocity. */
export function pullToShot(dx: number, dy: number) {
  const len = Math.hypot(dx, dy);
  const k = len > MAX_PULL ? MAX_PULL / len : 1;
  const px = dx * k;
  const py = dy * k;
  return { pull: { x: px, y: py }, vel: { x: -px * POWER, y: -py * POWER } };
}

/** Predicted flight path (dots) for the aiming guide. */
export function trajectory(start: { x: number; y: number }, vel: { x: number; y: number }, points = 14, every = 3) {
  const out: { x: number; y: number }[] = [];
  let { x, y } = start;
  let vy = vel.y;
  for (let i = 1; i <= points * every; i++) {
    vy += GRAVITY;
    x += vel.x;
    y += vy;
    if (i % every === 0) out.push({ x, y });
  }
  return out;
}
