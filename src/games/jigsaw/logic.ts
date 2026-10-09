/** Positions are in units of the board width (board spans 0..1 on both axes). */
export interface Piece {
  id: number;
  col: number;
  row: number;
  x: number;
  y: number;
  z: number;
  placed: boolean;
}

/** A piece snaps when within this fraction of a piece size from its home. */
export const SNAP = 0.35;

export function snapTarget(piece: Pick<Piece, 'col' | 'row'>, grid: number) {
  return { x: piece.col / grid, y: piece.row / grid };
}

/** Pieces scattered in a tray below the board (overlapping rows). */
export function initialPieces(grid: number, shuffle: <T>(a: readonly T[]) => T[]): Piece[] {
  const p = 1 / grid;
  const ids = shuffle(Array.from({ length: grid * grid }, (_, i) => i));
  return Array.from({ length: grid * grid }, (_, id) => ({ id, col: id % grid, row: Math.floor(id / grid) }))
    .map((piece, i) => {
      const slot = ids.indexOf(i);
      const jitter = ((i * 7919) % 100) / 100 - 0.5;
      return {
        ...piece,
        x: Math.min(1 - p, Math.max(0, (slot % grid) * p + jitter * 0.02)),
        y: 1.04 + Math.floor(slot / grid) * 0.6 * p + jitter * 0.02,
        z: 1,
        placed: false,
      };
    });
}
