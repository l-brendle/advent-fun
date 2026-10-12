import { describe, expect, it } from 'vitest';
import { LEVELS, clampItem, createSim, flipItem, hitItem, stepSim, type Item, type SimResult } from './logic';

function simulate(level: 1 | 2 | 3, items: Item[]): SimResult {
  const s = createSim(LEVELS[level], items);
  let r: SimResult = 'run';
  for (let n = 0; r === 'run' && n < 60 * 31; n++) r = stepSim(s);
  return r;
}

const it_ = (kind: Item['kind'], x: number, y: number, dir: 1 | -1 = 1, vertical = true): Item => ({ kind, x, y, dir, vertical });

/** One known solution per level (found with a random search over placements). */
const SOLUTIONS: Record<1 | 2 | 3, Item[]> = {
  1: [it_('slide', 70, 150), it_('belt', 230, 444)],
  2: [it_('slide', 243, 153), it_('trampoline', 120, 196), it_('belt', 26, 128)],
  3: [it_('slide', 274, 108, -1), it_('trampoline', 251, 299), it_('belt', 194, 195, -1), it_('wall', 62, 67, 1, false)],
};

describe('contraption', () => {
  for (const lv of [1, 2, 3] as const) {
    it(`level ${lv} has a solution`, () => {
      expect(simulate(lv, SOLUTIONS[lv])).toBe('won');
    });
    it(`level ${lv} is not solved by its starting layout`, () => {
      expect(simulate(lv, LEVELS[lv].items)).toBe('failed');
    });
    it(`level ${lv} is not solved without any parts`, () => {
      expect(simulate(lv, [])).toBe('failed');
    });
  }

  it('tapping flips belts and slides, turns walls', () => {
    expect(flipItem(it_('belt', 0, 0)).dir).toBe(-1);
    expect(flipItem(it_('slide', 0, 0, -1)).dir).toBe(1);
    expect(flipItem(it_('wall', 0, 0)).vertical).toBe(false);
    expect(flipItem(it_('trampoline', 0, 0))).toEqual(it_('trampoline', 0, 0));
  });

  it('hit testing follows a slide’s rotation and items stay on screen', () => {
    const slide = it_('slide', 100, 100);
    expect(hitItem(slide, 100, 100)).toBe(true);
    expect(hitItem(slide, 100, 160)).toBe(false);
    const c = clampItem(it_('belt', 0, 0), -50, 9999);
    expect(c.x).toBeGreaterThan(0);
    expect(c.y).toBeLessThan(450);
  });
});
