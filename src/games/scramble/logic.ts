import { shuffle } from '../../lib/random';

/** Letters of the word without spaces, upper-cased. */
export function wordLetters(word: string): string[] {
  return word.toUpperCase().split('').filter((c) => c !== ' ');
}

/** Shuffles the letters; never returns the solved order (when that is possible). */
export function scrambleLetters(letters: string[], rng: () => number = Math.random): string[] {
  if (new Set(letters).size <= 1) return [...letters];
  const solved = letters.join('');
  for (let i = 0; i < 50; i++) {
    const out = shuffle(letters, rng);
    if (out.join('') !== solved) return out;
  }
  return [...letters.slice(1), letters[0]];
}
