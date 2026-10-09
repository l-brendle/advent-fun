import { useEffect, useMemo, useRef, useState } from 'react';
import type { MemoryDay } from '../../config/types';
import type { GameProps } from '../GameProps';
import { buildDeck, columnsFor, pairCount } from './logic';
import './memory.css';

export default function Memory({ config, strings, onComplete }: GameProps<MemoryDay>) {
  const pairs = pairCount(config.pairs, config.images);
  const deck = useMemo(() => buildDeck(pairs, config.images), [pairs, config.images]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const busy = useRef(false);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const flip = (i: number) => {
    if (busy.current || flipped.includes(i) || matched.includes(i)) return;
    const next = [...flipped, i];
    setFlipped(next);
    if (next.length < 2) return;
    setMoves((m) => m + 1);
    const [a, b] = next;
    if (deck[a].pair === deck[b].pair) {
      const all = [...matched, a, b];
      setMatched(all);
      setFlipped([]);
      if (all.length === deck.length) timers.current.push(window.setTimeout(onComplete, 900));
    } else {
      busy.current = true;
      timers.current.push(
        window.setTimeout(() => {
          setFlipped([]);
          busy.current = false;
        }, 900),
      );
    }
  };

  return (
    <div>
      <div className="hud">
        <span>
          {strings.moves}: {moves}
        </span>
        <span>
          {strings.pairs}: {matched.length / 2}/{pairs}
        </span>
      </div>
      <div className="memory-grid" style={{ gridTemplateColumns: `repeat(${columnsFor(deck.length)}, 1fr)` }}>
        {deck.map((c, i) => {
          const up = flipped.includes(i) || matched.includes(i);
          return (
            <button
              key={c.id}
              className={`mem-card ${up ? 'up' : ''} ${matched.includes(i) ? 'done' : ''}`}
              onClick={() => flip(i)}
              aria-label={up ? c.face : '?'}
            >
              <span className="mem-inner">
                <span className="mem-back">❄️</span>
                <span className="mem-front">{c.isImage ? <img src={c.face} alt="" draggable={false} /> : c.face}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
