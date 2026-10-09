import { describe, expect, it } from 'vitest';
import { createRng } from '../lib/random';
import { scrambleLetters, wordLetters } from './scramble/logic';
import { buildDeck, pairCount } from './memory/logic';

describe('scramble', () => {
  it('ignores spaces and upper-cases', () => {
    expect(wordLetters('ab c')).toEqual(['A', 'B', 'C']);
  });
  it('never returns the solved order', () => {
    for (let seed = 0; seed < 200; seed++) {
      const letters = wordLetters('LEBKUCHEN');
      expect(scrambleLetters(letters, createRng(seed)).join('')).not.toBe(letters.join(''));
    }
  });
  it('keeps the same letters', () => {
    const out = scrambleLetters(wordLetters('SCHNEE'));
    expect([...out].sort()).toEqual(wordLetters('SCHNEE').sort());
  });
  it('handles a two-letter word', () => {
    expect(scrambleLetters(['A', 'B']).join('')).toBe('BA');
  });
});

describe('memory', () => {
  it('builds a deck with exactly two cards per pair', () => {
    for (let pairs = 4; pairs <= 10; pairs++) {
      const deck = buildDeck(pairs);
      expect(deck).toHaveLength(pairs * 2);
      for (let p = 0; p < pairs; p++) expect(deck.filter((c) => c.pair === p)).toHaveLength(2);
    }
  });
  it('clamps pair count', () => {
    expect(pairCount(99)).toBe(10);
    expect(pairCount(1)).toBe(4);
    expect(pairCount(undefined)).toBe(6);
    expect(pairCount(8, ['a', 'b', 'c'])).toBe(3);
  });
  it('uses custom images', () => {
    expect(buildDeck(2, ['/a.png', '/b.png']).every((c) => c.isImage)).toBe(true);
  });
});
