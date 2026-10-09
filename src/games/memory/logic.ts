import { shuffle } from '../../lib/random';

export const EMOJI = ['🎅', '🎄', '⛄', '🎁', '🔔', '🦌', '⭐', '🍪', '🧦', '🕯️'];

export interface Card {
  id: number;
  pair: number;
  face: string;
  isImage: boolean;
}

export function pairCount(requested: number | undefined, images?: string[]): number {
  if (images?.length) return Math.min(requested ?? images.length, images.length);
  return Math.max(4, Math.min(10, requested ?? 6));
}

export function buildDeck(pairs: number, images?: string[], rng: () => number = Math.random): Card[] {
  const faces = images?.length ? images.slice(0, pairs) : EMOJI.slice(0, pairs);
  const cards = faces.flatMap((face, pair) => [0, 1].map(() => ({ pair, face, isImage: !!images?.length })));
  return shuffle(cards, rng).map((c, id) => ({ ...c, id }));
}

export function columnsFor(cardCount: number): number {
  return ({ 8: 4, 10: 5, 12: 4, 14: 4, 16: 4, 18: 6, 20: 5 } as Record<number, number>)[cardCount] ?? 4;
}
