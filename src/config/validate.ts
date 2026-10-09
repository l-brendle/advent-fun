import { correctProblems } from '../games/quiz/logic';
import type { CalendarConfig } from './types';

/** Logs config problems to the console (dev aid, never throws). */
export function validateConfig(config: CalendarConfig): string[] {
  const problems: string[] = [];
  for (let d = 1; d <= 24; d++) {
    const day = config.days[d as keyof CalendarConfig['days']];
    if (!day) {
      problems.push(`Day ${d}: no content configured`);
      continue;
    }
    if (day.type === 'quiz') for (const m of correctProblems(day.correct)) problems.push(`Day ${d}: quiz ${m}`);
    if (day.type === 'memory' && day.pairs && (day.pairs < 4 || day.pairs > 10))
      problems.push(`Day ${d}: memory "pairs" should be 4-10`);
    if (day.type === 'jigsaw' && !day.image) problems.push(`Day ${d}: jigsaw needs an image`);
  }
  if (problems.length) console.warn('[advent config]\n' + problems.join('\n'));
  return problems;
}
