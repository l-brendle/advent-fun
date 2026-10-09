import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { JigsawDay } from '../../config/types';
import { shuffle } from '../../lib/random';
import type { GameProps } from '../GameProps';
import { SNAP, initialPieces, snapTarget, type Piece } from './logic';
import './jigsaw.css';

interface Drag {
  id: number;
  dx: number;
  dy: number;
}

export default function Jigsaw({ config, onComplete }: GameProps<JigsawDay>) {
  const g = Math.max(2, Math.min(8, config.grid ?? 5));
  const p = 1 / g;
  const stageRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);
  const [pieces, setPieces] = useState<Piece[]>(() => initialPieces(g, shuffle));
  const [drag, setDrag] = useState<Drag | null>(null);
  const zCounter = useRef(1);
  const doneTimer = useRef<number>();

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const placed = pieces.filter((x) => x.placed).length;
  useEffect(() => {
    if (placed === g * g) doneTimer.current = window.setTimeout(onComplete, 900);
    return () => window.clearTimeout(doneTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placed]);

  const stageH = useMemo(() => pieces.reduce((m, x) => Math.max(m, x.y + p), 1 + p), [pieces, p]);
  const trayBottom = 1.04 + (g - 1) * 0.6 * p + p;

  const down = (e: React.PointerEvent, piece: Piece) => {
    if (piece.placed) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const r = stageRef.current!.getBoundingClientRect();
    setDrag({ id: piece.id, dx: (e.clientX - r.left) / width - piece.x, dy: (e.clientY - r.top) / width - piece.y });
    const z = ++zCounter.current;
    setPieces((ps) => ps.map((x) => (x.id === piece.id ? { ...x, z } : x)));
  };
  const move = (e: React.PointerEvent) => {
    if (!drag) return;
    const r = stageRef.current!.getBoundingClientRect();
    const x = Math.min(1 - p, Math.max(0, (e.clientX - r.left) / width - drag.dx));
    const y = Math.min(trayBottom - p, Math.max(0, (e.clientY - r.top) / width - drag.dy));
    setPieces((ps) => ps.map((q) => (q.id === drag.id ? { ...q, x, y } : q)));
  };
  const up = () => {
    if (!drag) return;
    setPieces((ps) =>
      ps.map((q) => {
        if (q.id !== drag.id) return q;
        const t = snapTarget(q, g);
        return Math.hypot(q.x - t.x, q.y - t.y) < p * SNAP ? { ...q, ...t, placed: true, z: 0 } : q;
      }),
    );
    setDrag(null);
  };

  return (
    <div className="jigsaw-wrap">
      <div className="jigsaw-stage" ref={stageRef} style={{ height: stageH * width }}>
        <div className="jigsaw-board" style={{ width, height: width, ['--g' as string]: g }}>
          <img src={config.image} alt="" draggable={false} />
        </div>
        {pieces.map((q) => (
          <div
            key={q.id}
            className={`jigsaw-piece ${q.placed ? 'placed' : ''} ${drag?.id === q.id ? 'dragging' : ''}`}
            style={{ width: p * width, height: p * width, left: q.x * width, top: q.y * width, zIndex: q.z }}
            onPointerDown={(e) => down(e, q)}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
          >
            <img
              src={config.image}
              alt=""
              draggable={false}
              style={{
                width: g * p * width,
                height: g * p * width,
                left: -q.col * p * width,
                top: -q.row * p * width,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
