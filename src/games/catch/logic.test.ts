import { describe, expect, it } from 'vitest';
import { H, SACK_Y, makeWorld, spawnItem, stepWorld } from './logic';

describe('catch', () => {
  it('catches a gift above the sack', () => {
    const w = makeWorld();
    w.spawnIn = 99;
    w.items.push({ x: w.sack, y: SACK_Y - 5, coal: false, face: '🎁' });
    const r = stepWorld(w, 0.05, 1, 0);
    expect(r.caught).toBe(true);
    expect(w.items).toHaveLength(0);
  });
  it('registers coal as a hit, not a catch', () => {
    const w = makeWorld();
    w.spawnIn = 99;
    w.items.push({ x: w.sack + 10, y: SACK_Y - 5, coal: true, face: '' });
    const r = stepWorld(w, 0.05, 1, 1);
    expect(r).toEqual({ caught: false, hitCoal: true });
  });
  it('lets missed items fall away', () => {
    const w = makeWorld();
    w.spawnIn = 99;
    w.items.push({ x: 5, y: H + 29, coal: false, face: '🎁' });
    stepWorld(w, 0.2, 1, 0);
    expect(w.items).toHaveLength(0);
  });
  it('spawns coal according to the ratio', () => {
    expect(spawnItem(1).coal).toBe(true);
    expect(spawnItem(0).coal).toBe(false);
  });
});
