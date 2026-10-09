/** Normalises the `correct` config value (one index or a list) to a list of indexes. */
export function correctAnswers(correct: number | number[]): number[] {
  return Array.isArray(correct) ? correct : [correct];
}

/** Problems with a quiz's `correct` value (empty = fine). */
export function correctProblems(correct: number | number[]): string[] {
  const list = correctAnswers(correct);
  const problems: string[] = [];
  if (list.length === 0) problems.push('"correct" must contain at least one answer');
  if (list.some((i) => !Number.isInteger(i) || i < 0 || i > 3)) problems.push('"correct" values must be 0-3');
  return problems;
}
