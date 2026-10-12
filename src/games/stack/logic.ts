import { Bodies, Body, Composite, Engine } from 'matter-js';

export const W = 360;
export const H = 480;
/** World y of the top of the pedestal the tower is built on. */
export const BASE_Y = 410;
export const BASE_W = 120;
export const GROUND_Y = 450;
export const STEP_MS = 1000 / 60;

/** Pendulum: pivot above the screen, present hangs `ROPE` below it. */
export const PIVOT = { x: W / 2, y: -20 };
export const ROPE = 170;
export const MAX_SWING = 0.55;
/** Screen y the top of the tower is kept at (once it grows tall enough to scroll). */
export const TOWER_VIEW_Y = 330;

export const COLORS = ['#d62839', '#2a9d8f', '#f4a261', '#7b5cd6', '#2f80ed', '#e76f9a'];

export interface PresentSpec {
  w: number;
  h: number;
  color: number;
}

export interface Present extends PresentSpec {
  body: Body;
  settled: boolean;
  still: number;
  age: number;
}

export interface StackWorld {
  engine: Engine;
  presents: Present[];
  hanging: PresentSpec | null;
  /** Pendulum phase in radians. */
  phase: number;
  count: number;
  /** World y at the top edge of the screen (<= 0 once scrolled). */
  camTop: number;
  /** Seconds until the next present appears on the hook. */
  wait: number;
  made: number;
}

export function randomSpec(rng: () => number = Math.random, made = 0): PresentSpec {
  return {
    w: Math.round(58 + rng() * 28),
    h: Math.round(34 + rng() * 10),
    color: (made + Math.floor(rng() * 3) + 1) % COLORS.length,
  };
}

export function createStackWorld(rng: () => number = Math.random): StackWorld {
  const engine = Engine.create();
  engine.positionIterations = 10;
  engine.velocityIterations = 8;
  const pedestal = Bodies.rectangle(W / 2, BASE_Y + 20, BASE_W, 40, { isStatic: true, friction: 0.9, label: 'base' });
  const ground = Bodies.rectangle(W / 2, GROUND_Y + 40, W * 6, 80, { isStatic: true, friction: 0.9, label: 'ground' });
  Composite.add(engine.world, [pedestal, ground]);
  return { engine, presents: [], hanging: randomSpec(rng, 0), phase: 0, count: 0, camTop: 0, wait: 0, made: 1 };
}

/** Swing angular speed (rad/s): gets quicker with every stacked present. */
export function swingSpeed(count: number, speed = 1): number {
  return Math.min(4.2, 1.9 + count * 0.1) * speed;
}

export function swingAngle(phase: number): number {
  return MAX_SWING * Math.sin(phase);
}

/** Position of the hanging present in world coordinates. */
export function hangPos(phase: number, camTop: number) {
  const a = swingAngle(phase);
  return { x: PIVOT.x + ROPE * Math.sin(a), y: PIVOT.y + ROPE * Math.cos(a) + camTop, angle: a };
}

export function dropPresent(w: StackWorld) {
  if (!w.hanging) return false;
  const p = hangPos(w.phase, w.camTop);
  const spec = w.hanging;
  const body = Bodies.rectangle(p.x, p.y, spec.w, spec.h, {
    density: 0.0012,
    friction: 0.7,
    frictionStatic: 0.9,
    restitution: 0.02,
    label: 'present',
  });
  Composite.add(w.engine.world, body);
  w.presents.push({ ...spec, body, settled: false, still: 0, age: 0 });
  w.hanging = null;
  w.wait = 0.5;
  return true;
}

export type StackEvent = 'none' | 'settled' | 'fell';

/** Advances physics by one fixed step. */
export function stepStack(w: StackWorld, speed = 1, rng: () => number = Math.random): StackEvent {
  Engine.update(w.engine, STEP_MS);
  const dt = STEP_MS / 1000;
  w.phase += swingSpeed(w.count, speed) * dt;
  if (!w.hanging) {
    w.wait -= dt;
    if (w.wait <= 0) w.hanging = randomSpec(rng, w.made++);
  }
  let ev: StackEvent = 'none';
  for (const p of w.presents) {
    if (p.body.position.y > BASE_Y + 12) return 'fell';
    if (p.settled) continue;
    p.age++;
    p.still = p.body.speed < 0.12 && Math.abs(p.body.angularVelocity) < 0.01 ? p.still + 1 : 0;
    if (p.still >= 30 || p.age > 360) {
      p.settled = true;
      w.count++;
      ev = 'settled';
    }
  }
  return ev;
}

/** World y of the highest point of the settled tower. */
export function towerTop(w: StackWorld): number {
  let top = BASE_Y;
  for (const p of w.presents) if (p.settled) top = Math.min(top, p.body.bounds.min.y);
  return top;
}

/** Eases the camera so the tower top stays in view. */
export function updateCamera(w: StackWorld) {
  const target = Math.min(0, towerTop(w) - TOWER_VIEW_Y);
  w.camTop += (target - w.camTop) * 0.06;
}
