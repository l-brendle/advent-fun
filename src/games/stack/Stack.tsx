import { useEffect, useRef, useState } from 'react';
import type { StackDay } from '../../config/types';
import { GameCanvas, getCtx } from '../../components/GameCanvas';
import { GameMessage } from '../../components/GameMessage';
import { useGameLoop } from '../../lib/useGameLoop';
import type { GameProps } from '../GameProps';
import {
  BASE_W,
  BASE_Y,
  COLORS,
  GROUND_Y,
  H,
  PIVOT,
  STEP_MS,
  W,
  createStackWorld,
  dropPresent,
  hangPos,
  stepStack,
  updateCamera,
  type PresentSpec,
  type StackWorld,
} from './logic';

type Phase = 'ready' | 'playing' | 'lost' | 'won';

export default function Stack({ config, strings, onComplete }: GameProps<StackDay>) {
  const target = Math.min(40, Math.max(2, Math.round(config.height ?? 8)));
  const speed = config.speed ?? 1;
  const canvas = useRef<HTMLCanvasElement>(null);
  const world = useRef<StackWorld>(createStackWorld());
  const [phase, setPhase] = useState<Phase>('ready');
  const [count, setCount] = useState(0);
  const phaseRef = useRef<Phase>('ready');
  const acc = useRef(0);
  const timer = useRef<number>();
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const setPhaseBoth = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const start = () => {
    world.current = createStackWorld();
    acc.current = 0;
    setCount(0);
    setPhaseBoth('playing');
  };

  const drop = () => {
    if (phaseRef.current === 'playing') dropPresent(world.current);
  };

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === ' ' && phaseRef.current === 'playing') {
        e.preventDefault();
        dropPresent(world.current);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);

  useGameLoop((dt) => {
    const w = world.current;
    if (phaseRef.current === 'playing') {
      acc.current += dt * 1000;
      for (let n = 0; acc.current >= STEP_MS && n < 4; n++, acc.current -= STEP_MS) {
        const ev = stepStack(w, speed);
        if (ev === 'settled') {
          setCount(w.count);
          if (w.count >= target) {
            setPhaseBoth('won');
            timer.current = window.setTimeout(onComplete, 900);
          }
        } else if (ev === 'fell' && phaseRef.current === 'playing') {
          setPhaseBoth('lost');
        }
      }
      updateCamera(w);
    }
    draw(getCtx(canvas.current!), w, phaseRef.current === 'playing' || phaseRef.current === 'won');
  });

  return (
    <div>
      <div className="hud">
        <span>
          🎁 {count}/{target}
        </span>
      </div>
      <div className="game-wrap">
        <GameCanvas ref={canvas} w={W} h={H} onPointerDown={drop} />
        {phase === 'ready' && <GameMessage text={strings.intro.stack} button={strings.tapToStart} onClick={start} />}
        {phase === 'lost' && <GameMessage title={strings.gameOver} text={strings.stackFell} button={strings.tryAgain} onClick={start} />}
      </div>
    </div>
  );
}

function drawPresent(ctx: CanvasRenderingContext2D, spec: PresentSpec, cx: number, cy: number, angle: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  const { w, h } = spec;
  ctx.fillStyle = COLORS[spec.color % COLORS.length];
  ctx.strokeStyle = 'rgba(0,0,0,.35)';
  ctx.lineWidth = 1.5;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.strokeRect(-w / 2, -h / 2, w, h);
  ctx.fillStyle = 'rgba(255,255,255,.88)';
  ctx.fillRect(-4, -h / 2, 8, h);
  ctx.fillRect(-w / 2, -3, w, 6);
  ctx.fillStyle = 'rgba(255,255,255,.95)';
  ctx.beginPath();
  ctx.ellipse(-7, -h / 2 - 3, 7, 4.5, -0.5, 0, Math.PI * 2);
  ctx.ellipse(7, -h / 2 - 3, 7, 4.5, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function draw(ctx: CanvasRenderingContext2D, w: StackWorld, active: boolean) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#16215b');
  sky.addColorStop(1, '#5b7fc4');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 26; i++) ctx.fillRect((i * 83) % W, (i * 57) % (H - 80), 2, 2);

  const cam = w.camTop;
  ctx.save();
  ctx.translate(0, -cam);

  // ground and pedestal
  ctx.fillStyle = '#f4f8ff';
  ctx.fillRect(-20, GROUND_Y, W + 40, 600);
  ctx.fillStyle = '#c9d6ea';
  ctx.fillRect(W / 2 - BASE_W / 2, BASE_Y, BASE_W, GROUND_Y - BASE_Y);
  ctx.fillStyle = '#fff';
  ctx.fillRect(W / 2 - BASE_W / 2 - 4, BASE_Y - 4, BASE_W + 8, 8);

  for (const p of w.presents) drawPresent(ctx, p, p.body.position.x, p.body.position.y, p.body.angle);
  ctx.restore();

  // crane: rope from the pivot to the hanging present
  ctx.fillStyle = '#e9a824';
  ctx.fillRect(0, 0, W, 10);
  ctx.fillStyle = '#b57d12';
  ctx.fillRect(0, 10, W, 3);
  if (active) {
    const h = hangPos(w.phase, w.camTop);
    const sx = h.x;
    const sy = h.y - w.camTop;
    ctx.strokeStyle = '#2b2b2b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PIVOT.x, 10);
    ctx.lineTo(sx, sy - (w.hanging ? w.hanging.h / 2 + 8 : 6));
    ctx.stroke();
    ctx.fillStyle = '#444';
    ctx.beginPath();
    ctx.arc(sx, sy - (w.hanging ? w.hanging.h / 2 + 8 : 6), 4, 0, Math.PI * 2);
    ctx.fill();
    if (w.hanging) drawPresent(ctx, w.hanging, sx, sy, h.angle);
  }
}
