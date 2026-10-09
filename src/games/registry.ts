import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { GameType } from '../config/types';
import type { GameProps } from './GameProps';

type AnyGame = LazyExoticComponent<ComponentType<GameProps<never>>>;

/**
 * Maps a config `type` to its game component (code-split).
 * Games register themselves here as they are implemented.
 */
export const gameRegistry: Partial<Record<GameType, AnyGame>> = {};

export function _lazyGame<P>(loader: () => Promise<{ default: ComponentType<P> }>): AnyGame {
  return lazy(loader as never) as unknown as AnyGame;
}
