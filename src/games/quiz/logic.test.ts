import { describe, expect, it } from 'vitest';
import { correctAnswers, correctProblems } from './logic';

describe('quiz correct answers', () => {
  it('accepts a single index or a list', () => {
    expect(correctAnswers(2)).toEqual([2]);
    expect(correctAnswers([0, 2, 3])).toEqual([0, 2, 3]);
  });
  it('reports bad values', () => {
    expect(correctProblems(1)).toEqual([]);
    expect(correctProblems([0, 3])).toEqual([]);
    expect(correctProblems([])).toHaveLength(1);
    expect(correctProblems([4])).toHaveLength(1);
    expect(correctProblems(-1)).toHaveLength(1);
  });
});
