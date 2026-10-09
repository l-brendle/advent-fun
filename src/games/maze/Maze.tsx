import { useEffect, useMemo, useRef } from 'react';
import type { MazeDay } from '../../config/types';
import { GameCanvas, getCtx, toLogical } from '../../components/GameCanvas';
import { createRng, randomSeed } from '../../lib/random';
import { useGameLoop } from '../../lib/useGameLoop';
import type { GameProps } from '../GameProps';
import { generateMaze, moveCircle, wallRects } from './logic';

const PAD = 10;
const S = 360;
const W = S + PAD * 2;

export default function Maze({ config, onComplete }: GameProps<MazeDay>) {
  const n = Math.max(4, Math.min(14, config.size ?? 8));
  const cs = S / n;
  const r = Math.min(cs * 0.3, 14);
  const t = Math.max(3, cs * 0.12);
  const walls = useMemo(
    () => wallRects(generateMaze(n, createRng(config.seed ?? randomSeed())), n, cs, t),
    [n, cs, t, config.seed],
  );

  const canvas = useRef<HTMLCanvasElement>(null);
  const santa = useRef({ x: cs / 2, y: cs / 2 });
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const won = useRef(false);
  const timer = useRef<number>();
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = toLogical(e, canvas.current!, W, W);
    return { x: p.x - PAD, y: p.y - PAD };
  };

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (won.current) return;
    const p = pos(e);
    if (Math.hypot(p.x - santa.current.x, p.y - santa.current.y) > Math.max(cs, 36)) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { dx: p.x - santa.current.x, dy: p.y - santa.current.y };
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drag.current || won.current) return;
    const p = pos(e);
    moveCircle(santa.current, p.x - drag.current.dx, p.y - drag.current.dy, r, walls);
    const gx = (n - 0.5) * cs;
    if (Math.hypot(santa.current.x - gx, santa.current.y - gx) < cs * 0.35) {
      won.current = true;
      drag.current = null;
      timer.current = window.setTimeout(onComplete, 500);
    }
  };
  const up = () => {
    drag.current = null;
  };

  useGameLoop(() => {
    const ctx = getCtx(canvas.current!);
    ctx.fillStyle = '#fffdf5';
    ctx.fillRect(0, 0, W, W);
    ctx.save();
    ctx.translate(PAD, PAD);
    // start / goal tiles
    ctx.fillStyle = '#d9f2e0';
    ctx.fillRect(0, 0, cs, cs);
    ctx.fillStyle = '#ffe3e6';
    ctx.fillRect((n - 1) * cs, (n - 1) * cs, cs, cs);
    ctx.fillStyle = '#b3262f';
    for (const w of walls) {
      ctx.beginPath();
      ctx.roundRect(w.x, w.y, w.w, w.h, t / 2);
      ctx.fill();
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${cs * 0.6}px serif`;
    ctx.fillText('🎁', (n - 0.5) * cs, (n - 0.5) * cs + 2);
    ctx.font = `${r * 2.4}px serif`;
    ctx.fillText('🎅', santa.current.x, santa.current.y + 2);
    ctx.restore();
  });

  return (
    <div className="game-wrap">
      <GameCanvas
        ref={canvas}
        w={W}
        h={W}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      />
    </div>
  );
}
