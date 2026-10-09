import { useEffect, useRef, useState } from 'react';
import type { FlappyDay } from '../../config/types';
import { GameCanvas, getCtx } from '../../components/GameCanvas';
import { GameMessage } from '../../components/GameMessage';
import { useGameLoop } from '../../lib/useGameLoop';
import type { GameProps } from '../GameProps';
import { FLAP, GAP, GROUND, H, OB_W, SLEIGH_X, W, crashed, makeWorld, stepWorld, type World } from './logic';

type Phase = 'ready' | 'playing' | 'lost' | 'won';

export default function Flappy({ config, strings, onComplete }: GameProps<FlappyDay>) {
  const target = config.targetScore ?? 10;
  const speed = config.speed ?? 1;
  const canvas = useRef<HTMLCanvasElement>(null);
  const world = useRef(makeWorld());
  const [phase, setPhase] = useState<Phase>('ready');
  const [score, setScore] = useState(0);
  const phaseRef = useRef<Phase>('ready');
  phaseRef.current = phase;
  const timer = useRef<number>();
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const flap = () => {
    if (phaseRef.current === 'ready') setPhase('playing');
    if (phaseRef.current === 'ready' || phaseRef.current === 'playing') world.current.vy = FLAP;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!(e.target instanceof HTMLButtonElement)) flap();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const restart = () => {
    world.current = makeWorld();
    setScore(0);
    setPhase('ready');
  };

  useGameLoop((dt) => {
    const w = world.current;
    if (phaseRef.current === 'playing') {
      if (stepWorld(w, dt, speed)) {
        setScore(w.score);
        if (w.score >= target) {
          phaseRef.current = 'won';
          setPhase('won');
          timer.current = window.setTimeout(onComplete, 800);
        }
      }
      if (phaseRef.current === 'playing' && crashed(w)) {
        phaseRef.current = 'lost';
        setPhase('lost');
      }
    } else if (phaseRef.current === 'ready') {
      w.t += dt;
      w.y = H / 2 - 30 + Math.sin(w.t * 4) * 8;
    }
    draw(getCtx(canvas.current!), w, phaseRef.current);
  });

  return (
    <div>
      <div className="hud">
        <span>
          {strings.score}: {score}/{target}
        </span>
      </div>
      <div className="game-wrap">
        <GameCanvas ref={canvas} w={W} h={H} onPointerDown={flap} />
        {phase === 'ready' && (
          <div className="flappy-hint">{strings.tapToStart}</div>
        )}
        {phase === 'lost' && <GameMessage title={strings.gameOver} button={strings.tryAgain} onClick={restart} />}
      </div>
    </div>
  );
}

function cloud(ctx: CanvasRenderingContext2D, x: number, bottom: number) {
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#c9d8ee';
  ctx.lineWidth = 2;
  ctx.fillRect(x + 8, -10, OB_W - 16, Math.max(0, bottom - 10));
  for (const cx of [x + 14, x + OB_W / 2, x + OB_W - 14]) {
    ctx.beginPath();
    ctx.arc(cx, bottom - 12, 18, 0, Math.PI * 2);
    ctx.fill();
  }
}

function tree(ctx: CanvasRenderingContext2D, x: number, top: number) {
  const base = H - GROUND;
  const body = base - top - 12;
  const tiers = Math.max(2, Math.floor(body / 45));
  ctx.fillStyle = '#6b3f1e';
  ctx.fillRect(x + OB_W / 2 - 6, base - 14, 12, 14);
  for (let i = 0; i < tiers; i++) {
    const y0 = top + (i * body) / tiers;
    const th = (body / tiers) * 1.5;
    const half = (OB_W / 2) * (0.55 + (0.45 * (i + 1)) / tiers);
    ctx.fillStyle = i % 2 ? '#1d7a44' : '#2a9d5c';
    ctx.beginPath();
    ctx.moveTo(x + OB_W / 2, y0);
    ctx.lineTo(x + OB_W / 2 + half, y0 + th);
    ctx.lineTo(x + OB_W / 2 - half, y0 + th);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#f4c542';
  ctx.beginPath();
  ctx.arc(x + OB_W / 2, top + 2, 5, 0, Math.PI * 2);
  ctx.fill();
}

function draw(ctx: CanvasRenderingContext2D, w: World, phase: Phase) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#1b2a6b');
  sky.addColorStop(1, '#8fc1ec');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff7c2';
  ctx.beginPath();
  ctx.arc(300, 80, 26, 0, Math.PI * 2);
  ctx.fill();

  for (const o of w.obstacles) {
    cloud(ctx, o.x, o.gap - GAP / 2);
    tree(ctx, o.x, o.gap + GAP / 2);
  }

  ctx.fillStyle = '#f4f8ff';
  ctx.fillRect(0, H - GROUND, W, GROUND);
  ctx.fillStyle = '#dbe6f5';
  const off = w.travelled % 40;
  for (let x = -off; x < W; x += 40) ctx.fillRect(x, H - GROUND, 20, 6);

  ctx.save();
  ctx.translate(SLEIGH_X, w.y);
  ctx.rotate(Math.max(-0.4, Math.min(0.9, w.vy / 600)) * (phase === 'ready' ? 0 : 1));
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '40px serif';
  ctx.fillText('🛷', 0, 6);
  ctx.font = '22px serif';
  ctx.fillText('🎅', -2, -12);
  ctx.restore();
}
