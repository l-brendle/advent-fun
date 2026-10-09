export type Lang = 'de' | 'en';

/** A plain string, or one string per language (a single language is enough; the other falls back to it). */
export type LocalizedText = string | { de: string; en?: string } | { de?: string; en: string };

export interface Celebration {
  text?: LocalizedText;
  /** Path to an image in /public (e.g. '/images/win.gif') or a full URL. */
  image?: string;
}

interface DayBase {
  /** Optional heading shown at the top of the overlay. */
  title?: LocalizedText;
  /** Background color of the door, any CSS color. */
  doorColor?: string;
  /** Image shown on the door once it has been opened. */
  doorImage?: string;
}

interface GameBase extends DayBase {
  /** Short instruction shown above the game. A sensible default is used if omitted. */
  intro?: LocalizedText;
  /** Overrides `defaultCelebration` for this day. */
  celebration?: Celebration;
}

export interface TextDay extends DayBase {
  type: 'text';
  text: LocalizedText;
}

export interface ImageDay extends DayBase {
  type: 'image';
  image: string;
  caption?: LocalizedText;
  alt?: LocalizedText;
}

export type AnswerIndex = 0 | 1 | 2 | 3;

export interface QuizDay extends GameBase {
  type: 'quiz';
  question: LocalizedText;
  answers: [LocalizedText, LocalizedText, LocalizedText, LocalizedText];
  /** Index (0-3) of the correct answer, or a list of indexes when several answers pass. */
  correct: AnswerIndex | AnswerIndex[];
  /** Show a 50:50 joker button. Default: true */
  joker?: boolean;
}

export interface ScrambleDay extends GameBase {
  type: 'scramble';
  word: LocalizedText;
  hint?: LocalizedText;
}

export interface MemoryDay extends GameBase {
  type: 'memory';
  /** Number of pairs, 4-10. Default: 6 */
  pairs?: number;
  /** Custom card images; otherwise Christmas emoji are used. */
  images?: string[];
}

export interface SlidingDay extends GameBase {
  type: 'sliding';
  /** Image for the tiles; numbers are shown if omitted. */
  image?: string;
  /** Grid size. Default: 3 */
  size?: 3 | 4;
}

export interface JigsawDay extends GameBase {
  type: 'jigsaw';
  image: string;
  /** Pieces per row/column. Default: 5 */
  grid?: number;
}

export interface MazeDay extends GameBase {
  type: 'maze';
  /** Cells per row/column. Default: 8 */
  size?: number;
  /** Same seed = same maze. Random if omitted. */
  seed?: number;
}

export interface CatchDay extends GameBase {
  type: 'catch';
  /** Presents to catch. Default: 15 */
  targetCount?: number;
  /** Speed multiplier. Default: 1 */
  speed?: number;
  /** Share of falling items that are coal, 0-1. Default: 0.25 */
  coalRatio?: number;
}

export interface FlappyDay extends GameBase {
  type: 'flappy';
  /** Obstacles to pass. Default: 10 */
  targetScore?: number;
  /** Speed multiplier. Default: 1 */
  speed?: number;
}

export interface MinigolfDay extends GameBase {
  type: 'minigolf';
  /** Course 1-5 (4 and 5 have moving blocks). Default: 1 */
  level?: 1 | 2 | 3 | 4 | 5;
}

export interface SnowballDay extends GameBase {
  type: 'snowball';
  /** Tower layout 1-4 (4 is the hardest). Default: 1 */
  level?: 1 | 2 | 3 | 4;
  /** Snowballs available. Default: 5 */
  shots?: number;
}

export type GameDay =
  | QuizDay
  | ScrambleDay
  | MemoryDay
  | SlidingDay
  | JigsawDay
  | MazeDay
  | CatchDay
  | FlappyDay
  | MinigolfDay
  | SnowballDay;

export type DayConfig = TextDay | ImageDay | GameDay;
export type GameType = GameDay['type'];

export type DayNumber =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
  | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24;

export interface CalendarConfig {
  /** UI language. 'auto' picks German or English from the browser setting. */
  language: Lang | 'auto';
  title: LocalizedText;
  subtitle?: LocalizedText;
  /** Year whose December the doors unlock in. */
  year: number;
  /** Arrange doors in a random (but always the same) order. */
  shuffleDoors?: boolean;
  defaultCelebration: Celebration;
  days: Partial<Record<DayNumber, DayConfig>>;
}

export function defineCalendar(config: CalendarConfig): CalendarConfig {
  return config;
}

export function isGameDay(day: DayConfig): day is GameDay {
  return day.type !== 'text' && day.type !== 'image';
}
