import { shuffle } from '../../lib/random';

/** Board: tile numbers 1..n²-1 in row-major order, 0 is the gap. */
export function solvedBoard(n: number): number[] {
  return Array.from({ length: n * n }, (_, i) => (i + 1) % (n * n));
}

export function isSolved(board: number[]): boolean {
  return board.every((v, i) => v === (i + 1) % board.length);
}

export function neighbors(index: number, n: number): number[] {
  const r = Math.floor(index / n);
  const c = index % n;
  const out: number[] = [];
  if (r > 0) out.push(index - n);
  if (r < n - 1) out.push(index + n);
  if (c > 0) out.push(index - 1);
  if (c < n - 1) out.push(index + 1);
  return out;
}

/** Slides the tile at `index` into the gap if adjacent; otherwise returns null. */
export function tryMove(board: number[], n: number, index: number): number[] | null {
  const gap = board.indexOf(0);
  if (!neighbors(gap, n).includes(index)) return null;
  const next = [...board];
  [next[gap], next[index]] = [next[index], next[gap]];
  return next;
}

/** Shuffles by playing random legal moves backwards, so the result is always solvable. */
export function shuffledBoard(n: number, rng: () => number = Math.random, moves = 150): number[] {
  let board = solvedBoard(n);
  let prevGap = -1;
  for (let i = 0; i < moves || isSolved(board); i++) {
    const gap = board.indexOf(0);
    const options = neighbors(gap, n).filter((x) => x !== prevGap);
    const pick = shuffle(options, rng)[0];
    board = tryMove(board, n, pick)!;
    prevGap = gap;
  }
  return board;
}

/** Standard 15-puzzle solvability test (used by tests). */
export function isSolvable(board: number[], n: number): boolean {
  const tiles = board.filter((v) => v !== 0);
  let inv = 0;
  for (let i = 0; i < tiles.length; i++) for (let j = i + 1; j < tiles.length; j++) if (tiles[i] > tiles[j]) inv++;
  if (n % 2 === 1) return inv % 2 === 0;
  const gapRowFromBottom = n - Math.floor(board.indexOf(0) / n);
  return (inv + gapRowFromBottom) % 2 === 1;
}
