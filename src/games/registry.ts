import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { GameType } from '../config/types';

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyGame = LazyExoticComponent<ComponentType<any>>;

const g = (loader: () => Promise<{ default: ComponentType<any> }>): AnyGame => lazy(loader);

/** Maps a config `type` to its (code-split) game component. */
export const gameRegistry: Partial<Record<GameType, AnyGame>> = {
  quiz: g(() => import('./quiz/Quiz')),
  scramble: g(() => import('./scramble/Scramble')),
  memory: g(() => import('./memory/Memory')),
  sliding: g(() => import('./sliding/Sliding')),
  jigsaw: g(() => import('./jigsaw/Jigsaw')),
  maze: g(() => import('./maze/Maze')),
  // @games
};
