import type { GameDay, Lang } from '../config/types';
import type { Strings } from '../i18n/strings';

export interface GameProps<T extends GameDay = GameDay> {
  config: T;
  lang: Lang;
  strings: Strings;
  /** Call once when the player has won. */
  onComplete: () => void;
}
