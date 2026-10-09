import { useEffect, useMemo, useRef, useState } from 'react';
import type { SlidingDay } from '../../config/types';
import type { GameProps } from '../GameProps';
import { isSolved, neighbors, shuffledBoard, tryMove } from './logic';
import './sliding.css';

export default function Sliding({ config, strings, onComplete }: GameProps<SlidingDay>) {
  const n = config.size ?? 3;
  const [board, setBoard] = useState(() => shuffledBoard(n));
  const [moves, setMoves] = useState(0);
  const [done, setDone] = useState(false);
  const timer = useRef<number>();
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const move = (index: number) => {
    if (done) return;
    const next = tryMove(board, n, index);
    if (!next) return;
    setBoard(next);
    setMoves((m) => m + 1);
    if (isSolved(next)) {
      setDone(true);
      timer.current = window.setTimeout(onComplete, 1000);
    }
  };

  // Arrow keys move the tile *towards* the arrow direction into the gap.
  const onKeyDown = (e: React.KeyboardEvent) => {
    const gap = board.indexOf(0);
    const delta = { ArrowUp: n, ArrowDown: -n, ArrowLeft: 1, ArrowRight: -1 }[e.key];
    if (delta === undefined) return;
    const from = gap + delta;
    if (neighbors(gap, n).includes(from)) {
      e.preventDefault();
      move(from);
    }
  };

  const tiles = useMemo(() => Array.from({ length: n * n - 1 }, (_, i) => i + 1), [n]);

  return (
    <div>
      <div className="hud">
        <span>
          {strings.moves}: {moves}
        </span>
      </div>
      <div className="sliding-board" tabIndex={0} onKeyDown={onKeyDown} style={{ ['--n' as string]: n }}>
        {tiles.map((v) => {
          const pos = board.indexOf(v);
          const home = v - 1;
          const correct = pos === home;
          return (
            <button
              key={v}
              className={`slide-tile ${config.image ? 'img' : ''} ${correct && !config.image ? 'ok' : ''}`}
              style={{ left: `${((pos % n) * 100) / n}%`, top: `${(Math.floor(pos / n) * 100) / n}%` }}
              onClick={() => move(pos)}
              aria-label={String(v)}
            >
              {config.image ? (
                <img
                  src={config.image}
                  alt=""
                  draggable={false}
                  style={{ left: `${-(home % n) * 100}%`, top: `${-Math.floor(home / n) * 100}%` }}
                />
              ) : (
                <span>{v}</span>
              )}
            </button>
          );
        })}
        {done && config.image && <img className="slide-full" src={config.image} alt="" />}
      </div>
    </div>
  );
}
