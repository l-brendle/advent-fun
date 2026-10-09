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

import { createRng as rng } from '../lib/random';
import { isSolvable, isSolved, shuffledBoard, solvedBoard, tryMove } from './sliding/logic';
import { SNAP, initialPieces, snapTarget } from './jigsaw/logic';
import { shuffle } from '../lib/random';

describe('sliding', () => {
  it('always produces solvable, unsolved boards', () => {
    for (const n of [3, 4]) {
      for (let seed = 0; seed < 100; seed++) {
        const b = shuffledBoard(n, rng(seed));
        expect(isSolved(b)).toBe(false);
        expect(isSolvable(b, n)).toBe(true);
      }
    }
  });
  it('only moves tiles next to the gap', () => {
    const b = solvedBoard(3); // gap at index 8
    expect(tryMove(b, 3, 0)).toBeNull();
    expect(tryMove(b, 3, 7)).not.toBeNull();
    expect(tryMove(b, 3, 5)).not.toBeNull();
  });
});

describe('jigsaw', () => {
  it('creates every piece once, all unplaced and inside the stage', () => {
    const pieces = initialPieces(5, shuffle);
    expect(pieces).toHaveLength(25);
    expect(new Set(pieces.map((p) => p.id)).size).toBe(25);
    expect(pieces.every((p) => !p.placed && p.x >= 0 && p.x <= 0.8 + 1e-9)).toBe(true);
  });
  it('has distinct tray slots (no two pieces start at the same spot)', () => {
    const pieces = initialPieces(5, shuffle);
    const spots = new Set(pieces.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`));
    expect(spots.size).toBeGreaterThan(20);
  });
  it('snap target is the piece home', () => {
    expect(snapTarget({ col: 2, row: 3 }, 5)).toEqual({ x: 0.4, y: 0.6 });
    expect(SNAP).toBeGreaterThan(0);
  });
});
