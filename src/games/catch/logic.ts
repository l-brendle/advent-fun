export interface Item {
  x: number;
  y: number;
  coal: boolean;
  face: string;
}

export const W = 360;
export const H = 480;
export const SACK_Y = H - 56;
export const SACK_HALF = 40;
const GIFTS = ['🎁', '🧸', '🍭', '🎀'];

export function makeWorld() {
  return { sack: W / 2, items: [] as Item[], spawnIn: 0.6, caught: 0, lives: 3 };
}
export type World = ReturnType<typeof makeWorld>;

export function spawnItem(coalRatio: number, rng: () => number = Math.random): Item {
  const coal = rng() < coalRatio;
  return { x: 24 + rng() * (W - 48), y: -20, coal, face: coal ? '' : GIFTS[Math.floor(rng() * GIFTS.length)] };
}

export interface StepResult {
  caught: boolean;
  hitCoal: boolean;
}

/** Advances falling items by dt seconds; returns what happened this step. */
export function stepWorld(w: World, dt: number, speed: number, coalRatio: number, rng = Math.random): StepResult {
  const res = { caught: false, hitCoal: false };
  w.spawnIn -= dt;
  if (w.spawnIn <= 0) {
    w.items.push(spawnItem(coalRatio, rng));
    w.spawnIn = Math.max(0.35, 0.95 - w.caught * 0.025) / speed;
  }
  const vy = (150 + w.caught * 5) * speed;
  w.items = w.items.filter((it) => {
    it.y += vy * dt;
    const over = it.y >= SACK_Y - 6 && it.y <= SACK_Y + 22 && Math.abs(it.x - w.sack) < SACK_HALF;
    if (over) {
      if (it.coal) res.hitCoal = true;
      else res.caught = true;
      return false;
    }
    return it.y < H + 30;
  });
  return res;
}
