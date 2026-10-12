import { describe, expect, it } from 'vitest';
import { LEVELS, type LevelId, clampItem, createSim, flipItem, hitItem, stepSim, type Item, type SimResult } from './logic';

function simulate(level: LevelId, items: Item[]): SimResult {
  const s = createSim(LEVELS[level], items);
  let r: SimResult = 'run';
  for (let n = 0; r === 'run' && n < 60 * 31; n++) r = stepSim(s);
  return r;
}

const it_ = (kind: Item['kind'], x: number, y: number, dir: 1 | -1 = 1, vertical = true): Item => ({ kind, x, y, dir, vertical });

/** One known solution per level (found with a random search over placements). */
const SOLUTIONS: Record<LevelId, Item[]> = {
  1: [it_('slide', 70, 150), it_('belt', 230, 444)],
  2: [it_('slide', 243, 153), it_('trampoline', 120, 196), it_('belt', 26, 128)],
  3: [it_('slide', 274, 108, -1), it_('trampoline', 251, 299), it_('belt', 194, 195, -1), it_('wall', 62, 67, 1, false)],
  // levels 4+5 (decks with gaps): found by an optimiser; with any single part removed it found no solution at all
  4: [it_('belt', 241, 176, -1), it_('belt', 71, 405), it_('slide', 72, 110), it_('trampoline', 82, 107)],
  5: [it_('belt', 248, 152, -1), it_('belt', 134, 272), it_('slide', 65, 72), it_('slide', 323, 372, -1), it_('trampoline', 80, 77)],
};

describe('contraption', () => {
  for (const lv of [1, 2, 3, 4, 5] as const) {
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

  it('levels 4 and 5 need every part of the known solution', () => {
    for (const lv of [4, 5] as const) {
      SOLUTIONS[lv].forEach((_, drop) => {
        expect(simulate(lv, SOLUTIONS[lv].filter((__, j) => j !== drop)), `level ${lv} without part ${drop}`).toBe('failed');
      });
    }
  });

  it('parts cannot be placed above a level’s minY', () => {
    expect(clampItem(it_('belt', 100, 100), 100, 10, LEVELS[4].minY).y).toBe(LEVELS[4].minY);
  });

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
