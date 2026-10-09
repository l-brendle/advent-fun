import { createRng, shuffle } from './random';

export function doorOrder(shuffled: boolean, year: number): number[] {
  const days = Array.from({ length: 24 }, (_, i) => i + 1);
  return shuffled ? shuffle(days, createRng(year)) : days;
}
