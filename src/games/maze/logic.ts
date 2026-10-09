export interface Cell {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
}
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Perfect maze (recursive backtracker); index = y * n + x. Every cell is reachable. */
export function generateMaze(n: number, rng: () => number): Cell[] {
  const cells: Cell[] = Array.from({ length: n * n }, () => ({ top: true, right: true, bottom: true, left: true }));
  const seen = new Array<boolean>(n * n).fill(false);
  const stack = [0];
  seen[0] = true;
  while (stack.length) {
    const i = stack[stack.length - 1];
    const x = i % n;
    const y = Math.floor(i / n);
    const options: [number, keyof Cell, keyof Cell][] = [];
    if (y > 0 && !seen[i - n]) options.push([i - n, 'top', 'bottom']);
    if (x < n - 1 && !seen[i + 1]) options.push([i + 1, 'right', 'left']);
    if (y < n - 1 && !seen[i + n]) options.push([i + n, 'bottom', 'top']);
    if (x > 0 && !seen[i - 1]) options.push([i - 1, 'left', 'right']);
    if (!options.length) {
      stack.pop();
      continue;
    }
    const [next, a, b] = options[Math.floor(rng() * options.length)];
    cells[i][a] = false;
    cells[next][b] = false;
    seen[next] = true;
    stack.push(next);
  }
  return cells;
}

/** Number of cells reachable from the start through open passages. */
export function reachableCount(cells: Cell[], n: number): number {
  const seen = new Set([0]);
  const queue = [0];
  while (queue.length) {
    const i = queue.shift()!;
    const c = cells[i];
    const x = i % n;
    const next: number[] = [];
    if (!c.top) next.push(i - n);
    if (!c.bottom) next.push(i + n);
    if (!c.left && x > 0) next.push(i - 1);
    if (!c.right && x < n - 1) next.push(i + 1);
    for (const j of next) if (!seen.has(j)) (seen.add(j), queue.push(j));
  }
  return seen.size;
}

/** Walls as thin rectangles of thickness t (cell size cs). */
export function wallRects(cells: Cell[], n: number, cs: number, t: number): Rect[] {
  const rects: Rect[] = [];
  for (let i = 0; i < cells.length; i++) {
    const x = (i % n) * cs;
    const y = Math.floor(i / n) * cs;
    const c = cells[i];
    if (c.top) rects.push({ x: x - t / 2, y: y - t / 2, w: cs + t, h: t });
    if (c.left) rects.push({ x: x - t / 2, y: y - t / 2, w: t, h: cs + t });
    if (i % n === n - 1 && c.right) rects.push({ x: x + cs - t / 2, y: y - t / 2, w: t, h: cs + t });
    if (Math.floor(i / n) === n - 1 && c.bottom) rects.push({ x: x - t / 2, y: y + cs - t / 2, w: cs + t, h: t });
  }
  return rects;
}

export function circleHitsRect(cx: number, cy: number, r: number, rect: Rect): boolean {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r;
}

/** Moves the circle towards (tx, ty) in small steps, sliding along walls instead of crossing them. */
export function moveCircle(p: { x: number; y: number }, tx: number, ty: number, r: number, rects: Rect[]) {
  const hits = (x: number, y: number) => rects.some((w) => circleHitsRect(x, y, r, w));
  const dx = tx - p.x;
  const dy = ty - p.y;
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (r / 3)));
  const sx = dx / steps;
  const sy = dy / steps;
  for (let i = 0; i < steps; i++) {
    if (!hits(p.x + sx, p.y)) p.x += sx;
    if (!hits(p.x, p.y + sy)) p.y += sy;
  }
}
