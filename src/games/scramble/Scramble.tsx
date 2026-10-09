import { useEffect, useMemo, useRef, useState } from 'react';
import type { ScrambleDay } from '../../config/types';
import { tx } from '../../i18n/strings';
import type { GameProps } from '../GameProps';
import { scrambleLetters, wordLetters } from './logic';
import './scramble.css';

export default function Scramble({ config, lang, strings, onComplete }: GameProps<ScrambleDay>) {
  const word = tx(config.word, lang).toUpperCase();
  const letters = useMemo(() => wordLetters(word), [word]);
  const tiles = useMemo(() => scrambleLetters(letters).map((ch, id) => ({ id, ch })), [letters]);

  const [slots, setSlots] = useState<(number | null)[]>(() => letters.map(() => null));
  const [locked, setLocked] = useState<boolean[]>(() => letters.map(() => false));
  const [wrong, setWrong] = useState(false);
  const [solved, setSolved] = useState(false);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const inSlots = new Set(slots.filter((s): s is number => s !== null));

  useEffect(() => {
    if (solved || slots.some((s) => s === null)) return;
    const attempt = slots.map((s) => tiles[s!].ch).join('');
    if (attempt === letters.join('')) {
      setSolved(true);
      timers.current.push(window.setTimeout(onComplete, 900));
    } else {
      setWrong(true);
      timers.current.push(
        window.setTimeout(() => {
          setWrong(false);
          setSlots((cur) => cur.map((s, i) => (locked[i] ? s : null)));
        }, 1000),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots]);

  const busy = wrong || solved;

  const place = (id: number) => {
    if (busy) return;
    const i = slots.indexOf(null);
    if (i < 0) return;
    setSlots(slots.map((s, k) => (k === i ? id : s)));
  };
  const remove = (i: number) => {
    if (busy || locked[i] || slots[i] === null) return;
    setSlots(slots.map((s, k) => (k === i ? null : s)));
  };
  const reveal = () => {
    if (busy) return;
    const i = locked.indexOf(false);
    if (i < 0) return;
    const lockedIds = new Set(slots.filter((_, k) => locked[k]));
    const tile = tiles.find((t) => t.ch === letters[i] && !lockedIds.has(t.id));
    if (!tile) return;
    const next = [...slots];
    const from = next.indexOf(tile.id);
    if (from >= 0) next[from] = null;
    next[i] = tile.id;
    setSlots(next);
    setLocked(locked.map((l, k) => l || k === i));
  };

  let slotIndex = -1;
  return (
    <div className="scramble">
      {config.hint && (
        <p className="scramble-hint">
          💡 {strings.scrambleHint}: {tx(config.hint, lang)}
        </p>
      )}
      <div className={`scramble-slots ${wrong ? 'shake-row' : ''}`}>
        {word.split('').map((ch, k) => {
          if (ch === ' ') return <span key={k} className="scramble-gap" />;
          const i = ++slotIndex;
          const id = slots[i];
          return (
            <button
              key={k}
              className={`tile slot ${locked[i] ? 'locked' : ''} ${solved ? 'ok' : ''}`}
              onClick={() => remove(i)}
              aria-label={id === null ? '_' : tiles[id].ch}
            >
              {id === null ? '' : tiles[id].ch}
            </button>
          );
        })}
      </div>
      <div className="scramble-pool">
        {tiles.map((t) => (
          <button key={t.id} className="tile" disabled={inSlots.has(t.id)} onClick={() => place(t.id)}>
            {t.ch}
          </button>
        ))}
      </div>
      <p className="wrong-msg">{wrong ? strings.scrambleWrong : ''}</p>
      <button className="btn" onClick={reveal} disabled={busy}>
        {strings.scrambleReveal}
      </button>
    </div>
  );
}
