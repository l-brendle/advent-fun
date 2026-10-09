import { Composite, type Body } from 'matter-js';
import { useEffect, useRef, useState } from 'react';
import type { SnowballDay } from '../../config/types';
import { GameCanvas, getCtx, toLogical } from '../../components/GameCanvas';
import { GameMessage } from '../../components/GameMessage';
import { useGameLoop } from '../../lib/useGameLoop';
import type { GameProps } from '../GameProps';
import {
  ANCHOR,
  BALL_R,
  GROUND_Y,
  H,
  LEVELS,
  STEP_MS,
  W,
  createWorld,
  fire,
  houseDown,
  pullToShot,
  removeBall,
  step,
  trajectory,
  type SnowWorld,
} from './logic';

type Phase = 'ready' | 'flying' | 'won' | 'lost';

export default function Snowball({ config, strings, onComplete }: GameProps<SnowballDay>) {
  const totalShots = config.shots ?? 5;
  const level = LEVELS[config.level ?? 1];
  const canvas = useRef<HTMLCanvasElement>(null);
  const world = useRef<SnowWorld>(createWorld(level));
  const [shots, setShots] = useState(totalShots);
  const [phase, setPhase] = useState<Phase>('ready');
  const shotsRef = useRef(totalShots);
  const phaseRef = useRef<Phase>('ready');
  const acc = useRef(0);
  const ballAge = useRef(0);
  const quiet = useRef(0);
  const endTimer = useRef(0);
  const aim = useRef<{ sx: number; sy: number; dx: number; dy: number } | null>(null);
  const timer = useRef<number>();
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const setPhaseBoth = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const restart = () => {
    world.current = createWorld(level);
    shotsRef.current = totalShots;
    setShots(totalShots);
    endTimer.current = 0;
    setPhaseBoth('ready');
  };

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (phaseRef.current !== 'ready') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = toLogical(e, canvas.current!, W, H);
    aim.current = { sx: p.x, sy: p.y, dx: 0, dy: 0 };
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const a = aim.current;
    if (!a) return;
    const p = toLogical(e, canvas.current!, W, H);
    a.dx = p.x - a.sx;
    a.dy = p.y - a.sy;
  };
  const release = () => {
    const a = aim.current;
    aim.current = null;
    if (!a || phaseRef.current !== 'ready') return;
    const { pull, vel } = pullToShot(a.dx, a.dy);
    if (Math.hypot(pull.x, pull.y) < 8) return;
    fire(world.current, { x: ANCHOR.x + pull.x, y: ANCHOR.y + pull.y }, vel);
    ballAge.current = 0;
    quiet.current = 0;
    shotsRef.current--;
    setShots(shotsRef.current);
    setPhaseBoth('flying');
  };

  useGameLoop((dt) => {
    const w = world.current;
    acc.current += dt * 1000;
    for (let n = 0; acc.current >= STEP_MS && n < 4; n++, acc.current -= STEP_MS) {
      step(w);
      if (phaseRef.current !== 'won' && houseDown(w)) {
        setPhaseBoth('won');
        timer.current = window.setTimeout(onComplete, 1100);
      }
      if (w.ball) {
        const { x, y } = w.ball.position;
        const speed = Math.hypot(w.ball.velocity.x, w.ball.velocity.y);
        ballAge.current++;
        quiet.current = speed < 0.3 ? quiet.current + 1 : 0;
        if (quiet.current > 45 || ballAge.current > 480 || x > W + 60 || x < -60 || y > H + 60) {
          removeBall(w);
          if (phaseRef.current === 'flying') {
            if (shotsRef.current > 0) setPhaseBoth('ready');
            else endTimer.current = 150; // let the tower settle before judging
          }
        }
      }
      if (endTimer.current > 0 && --endTimer.current === 0 && phaseRef.current === 'flying') {
        setPhaseBoth('lost');
      }
    }
    draw(getCtx(canvas.current!), w, aim.current, phaseRef.current === 'ready' && shotsRef.current > 0);
  });

  return (
    <div>
      <div className="hud">
        <span>
          {strings.shots}: {'❄️'.repeat(shots) || '–'}
        </span>
      </div>
      <div className="game-wrap">
        <GameCanvas ref={canvas} w={W} h={H} onPointerDown={down} onPointerMove={move} onPointerUp={release} onPointerCancel={release} />
        {phase === 'lost' && <GameMessage title={strings.gameOver} text={strings.outOfShots} button={strings.tryAgain} onClick={restart} />}
      </div>
    </div>
  );
}

function poly(ctx: CanvasRenderingContext2D, body: Body) {
  ctx.beginPath();
  body.vertices.forEach((v, i) => (i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y)));
  ctx.closePath();
}

const FILL: Record<string, string> = { wood: '#a9702f', ice: '#a8dcf5', stone: '#7b7f8a', heavy: '#3d4048' };

function draw(
  ctx: CanvasRenderingContext2D,
  w: SnowWorld,
  aim: { dx: number; dy: number } | null,
  canAim: boolean,
) {
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  sky.addColorStop(0, '#2b4a8c');
  sky.addColorStop(1, '#bfe0f7');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
  ctx.fillStyle = '#dbe8f7';
  ctx.fillRect(0, GROUND_Y, W, 4);

  // slingshot posts
  ctx.strokeStyle = '#6b3f1e';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(ANCHOR.x, GROUND_Y);
  ctx.lineTo(ANCHOR.x, ANCHOR.y + 14);
  ctx.moveTo(ANCHOR.x, ANCHOR.y + 14);
  ctx.lineTo(ANCHOR.x - 12, ANCHOR.y - 4);
  ctx.moveTo(ANCHOR.x, ANCHOR.y + 14);
  ctx.lineTo(ANCHOR.x + 12, ANCHOR.y - 4);
  ctx.stroke();

  for (const body of Composite.allBodies(w.engine.world)) {
    if (body.label === 'ground') continue;
    if (body.label === 'ball') {
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#9ab';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(body.position.x, body.position.y, BALL_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (body.label === 'house') {
      drawHouse(ctx, body);
    } else {
      ctx.fillStyle = FILL[body.label] ?? '#a9702f';
      ctx.strokeStyle = 'rgba(0,0,0,.35)';
      ctx.lineWidth = 1.5;
      poly(ctx, body);
      ctx.fill();
      ctx.stroke();
    }
  }

  // aiming
  const p = aim ? pullToShot(aim.dx, aim.dy) : null;
  const ballPos = p ? { x: ANCHOR.x + p.pull.x, y: ANCHOR.y + p.pull.y } : ANCHOR;
  if (p) {
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    for (const d of trajectory(ballPos, p.vel)) {
      ctx.beginPath();
      ctx.arc(d.x, d.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (canAim) {
    ctx.strokeStyle = '#4a2a12';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ANCHOR.x - 12, ANCHOR.y - 4);
    ctx.lineTo(ballPos.x, ballPos.y);
    ctx.lineTo(ANCHOR.x + 12, ANCHOR.y - 4);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#9ab';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(ballPos.x, ballPos.y, BALL_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

function drawHouse(ctx: CanvasRenderingContext2D, body: Body) {
  ctx.save();
  ctx.translate(body.position.x, body.position.y);
  ctx.rotate(body.angle);
  ctx.fillStyle = '#b5651d';
  ctx.fillRect(-19, -15, 38, 30);
  // roof
  ctx.fillStyle = '#8c4a12';
  ctx.beginPath();
  ctx.moveTo(-24, -14);
  ctx.lineTo(0, -34);
  ctx.lineTo(24, -14);
  ctx.closePath();
  ctx.fill();
  // icing
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-24, -14);
  ctx.lineTo(0, -34);
  ctx.lineTo(24, -14);
  ctx.moveTo(-19, -15);
  for (let x = -19; x <= 19; x += 6.3) ctx.lineTo(x + 3, -10);
  ctx.stroke();
  ctx.fillStyle = '#5a3210';
  ctx.fillRect(-5, 0, 10, 15);
  ctx.fillStyle = '#d62839';
  ctx.beginPath();
  ctx.arc(-12, -3, 3, 0, Math.PI * 2);
  ctx.arc(12, -3, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
