import { useEffect, useRef, useState } from 'react';
import type { MinigolfDay } from '../../config/types';
import { GameCanvas, getCtx, toLogical } from '../../components/GameCanvas';
import { useGameLoop } from '../../lib/useGameLoop';
import type { GameProps } from '../GameProps';
import { BALL_R, H, HOLE_R, LEVELS, MAX_SPEED, W, speedOf, stepBall, type Ball, type Level } from './logic';

const MAX_PULL = 110;

export default function Minigolf({ config, strings, onComplete }: GameProps<MinigolfDay>) {
  const level = LEVELS[config.level ?? 1];
  const canvas = useRef<HTMLCanvasElement>(null);
  const ball = useRef<Ball>({ x: level.tee.x, y: level.tee.y, vx: 0, vy: 0 });
  const aim = useRef<{ sx: number; sy: number; cx: number; cy: number } | null>(null);
  const state = useRef<'stopped' | 'moving' | 'sunk'>('stopped');
  const sunkAt = useRef(0);
  const [strokes, setStrokes] = useState(0);
  const timer = useRef<number>();
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (state.current !== 'stopped') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = toLogical(e, canvas.current!, W, H);
    aim.current = { sx: p.x, sy: p.y, cx: p.x, cy: p.y };
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!aim.current) return;
    const p = toLogical(e, canvas.current!, W, H);
    aim.current.cx = p.x;
    aim.current.cy = p.y;
  };
  const release = () => {
    const a = aim.current;
    aim.current = null;
    if (!a) return;
    const dx = a.sx - a.cx;
    const dy = a.sy - a.cy;
    const len = Math.hypot(dx, dy);
    const power = Math.min(len, MAX_PULL) / MAX_PULL;
    if (power < 0.08) return;
    ball.current.vx = (dx / len) * power * MAX_SPEED;
    ball.current.vy = (dy / len) * power * MAX_SPEED;
    state.current = 'moving';
    setStrokes((s) => s + 1);
  };

  useGameLoop((dt) => {
    if (state.current === 'moving') {
      const r = stepBall(ball.current, dt, level);
      if (r === 'sunk') {
        state.current = 'sunk';
        sunkAt.current = performance.now();
        ball.current.x = level.hole.x;
        ball.current.y = level.hole.y;
        timer.current = window.setTimeout(onComplete, 900);
      } else {
        state.current = r;
      }
    }
    draw(getCtx(canvas.current!), level, ball.current, aim.current, state.current, sunkAt.current);
  });

  return (
    <div>
      <div className="hud">
        <span>
          {strings.strokes}: {strokes}
        </span>
        <span>
          {strings.par}: {level.par}
        </span>
      </div>
      <div className="game-wrap">
        <GameCanvas
          ref={canvas}
          w={W}
          h={H}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={release}
          onPointerCancel={() => (aim.current = null)}
        />
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  level: Level,
  b: Ball,
  aim: { sx: number; sy: number; cx: number; cy: number } | null,
  state: string,
  sunkAt: number,
) {
  ctx.fillStyle = '#3fae5a';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,.06)';
  for (let y = 0; y < H; y += 60) ctx.fillRect(0, y, W, 30);

  for (const r of level.ice) {
    ctx.fillStyle = '#bfe6ff';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    for (let i = 0; i < 10; i++) ctx.fillRect(r.x + ((i * 61) % r.w), r.y + ((i * 37) % r.h), 10, 2);
  }

  // hole + flag
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(level.hole.x, level.hole.y, HOLE_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#eee';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(level.hole.x + 6, level.hole.y);
  ctx.lineTo(level.hole.x + 6, level.hole.y - 40);
  ctx.stroke();
  ctx.fillStyle = '#d62839';
  ctx.beginPath();
  ctx.moveTo(level.hole.x + 6, level.hole.y - 40);
  ctx.lineTo(level.hole.x + 26, level.hole.y - 33);
  ctx.lineTo(level.hole.x + 6, level.hole.y - 26);
  ctx.fill();

  for (const w of level.walls) {
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = '#b97b3d';
    ctx.fillRect(w.x, w.y, w.w, Math.min(5, w.h));
  }

  // aim line (opposite of the drag)
  if (aim) {
    const dx = aim.sx - aim.cx;
    const dy = aim.sy - aim.cy;
    const len = Math.hypot(dx, dy);
    if (len > 4) {
      const power = Math.min(len, MAX_PULL) / MAX_PULL;
      const ux = dx / len;
      const uy = dy / len;
      ctx.strokeStyle = `hsl(${120 - power * 120}, 85%, 50%)`;
      ctx.lineWidth = 4;
      ctx.setLineDash([2, 8]);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x + ux * (20 + power * 120), b.y + uy * (20 + power * 120));
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // ball
  const shrink = state === 'sunk' ? Math.max(0, 1 - (performance.now() - sunkAt) / 300) : 1;
  ctx.fillStyle = 'rgba(0,0,0,.25)';
  ctx.beginPath();
  ctx.ellipse(b.x + 2, b.y + 3, BALL_R * shrink, BALL_R * 0.8 * shrink, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(b.x, b.y, BALL_R * shrink, 0, Math.PI * 2);
  ctx.fill();
  if (speedOf(b) === 0 && state === 'stopped' && !aim) {
    ctx.strokeStyle = 'rgba(255,255,255,.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(b.x, b.y, BALL_R + 5 + Math.sin(performance.now() / 250) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }
}
