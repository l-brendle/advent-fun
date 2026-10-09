export const W = 360;
export const H = 540;
export const GROUND = 40;
export const SLEIGH_X = 90;
export const OB_W = 64;
export const GAP = 160;
export const GRAVITY = 1000;
export const FLAP = -330;
export const SPACING = 210;

export interface Obstacle {
  x: number;
  /** y of the gap center */
  gap: number;
  passed: boolean;
}

export function makeWorld() {
  return { y: H / 2 - 30, vy: 0, obstacles: [] as Obstacle[], travelled: 0, score: 0, t: 0 };
}
export type World = ReturnType<typeof makeWorld>;

export function newObstacle(x: number, rng: () => number = Math.random): Obstacle {
  const margin = 60 + GAP / 2;
  return { x, gap: margin + rng() * (H - GROUND - 2 * margin), passed: false };
}

/** Sleigh hit-box (slightly smaller than the sprite). */
export function crashed(w: World): boolean {
  const left = SLEIGH_X - 20;
  const right = SLEIGH_X + 20;
  const top = w.y - 12;
  const bottom = w.y + 14;
  if (bottom >= H - GROUND) return true;
  return w.obstacles.some((o) => {
    const ol = o.x + 6;
    const or = o.x + OB_W - 6;
    if (right < ol || left > or) return false;
    return top < o.gap - GAP / 2 || bottom > o.gap + GAP / 2;
  });
}

/** Advances the world; returns true when a new obstacle was passed. */
export function stepWorld(w: World, dt: number, speed: number, rng = Math.random): boolean {
  w.t += dt;
  w.vy += GRAVITY * dt;
  w.y += w.vy * dt;
  if (w.y < 14) {
    w.y = 14;
    w.vy = 0;
  }
  const dx = 130 * speed * dt;
  w.travelled += dx;
  for (const o of w.obstacles) o.x -= dx;
  w.obstacles = w.obstacles.filter((o) => o.x > -OB_W);
  const last = w.obstacles[w.obstacles.length - 1];
  if (!last || last.x < W + 20 - SPACING) w.obstacles.push(newObstacle(last ? last.x + SPACING : W + 80, rng));
  let scored = false;
  for (const o of w.obstacles) {
    if (!o.passed && o.x + OB_W < SLEIGH_X - 20) {
      o.passed = true;
      w.score++;
      scored = true;
    }
  }
  return scored;
}
