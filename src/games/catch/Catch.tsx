import { useEffect, useRef, useState } from 'react';
import type { CatchDay } from '../../config/types';
import { GameCanvas, getCtx, toLogical } from '../../components/GameCanvas';
import { GameMessage } from '../../components/GameMessage';
import { useGameLoop } from '../../lib/useGameLoop';
import type { GameProps } from '../GameProps';
import { H, SACK_HALF, SACK_Y, W, makeWorld, stepWorld } from './logic';

type Phase = 'ready' | 'playing' | 'lost' | 'won';

export default function Catch({ config, strings, onComplete }: GameProps<CatchDay>) {
  const target = config.targetCount ?? 15;
  const speed = config.speed ?? 1;
  const coalRatio = Math.min(0.8, Math.max(0, config.coalRatio ?? 0.25));

  const canvas = useRef<HTMLCanvasElement>(null);
  const world = useRef(makeWorld());
  const keys = useRef(new Set<string>());
  const [phase, setPhase] = useState<Phase>('ready');
  const [hud, setHud] = useState({ caught: 0, lives: 3 });
  const phaseRef = useRef<Phase>('ready');
  phaseRef.current = phase;
  const timer = useRef<number>();
  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    const dn = (e: KeyboardEvent) => {
      if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        keys.current.add(e.key);
      }
    };
    const upk = (e: KeyboardEvent) => keys.current.delete(e.key);
    window.addEventListener('keydown', dn);
    window.addEventListener('keyup', upk);
    return () => {
      window.removeEventListener('keydown', dn);
      window.removeEventListener('keyup', upk);
    };
  }, []);

  const start = () => {
    world.current = makeWorld();
    setHud({ caught: 0, lives: 3 });
    setPhase('playing');
  };

  const steer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    world.current.sack = Math.min(W - SACK_HALF, Math.max(SACK_HALF, toLogical(e, canvas.current!, W, H).x));
  };

  useGameLoop((dt) => {
    const w = world.current;
    if (phaseRef.current === 'playing') {
      if (keys.current.has('ArrowLeft')) w.sack = Math.max(SACK_HALF, w.sack - 320 * dt);
      if (keys.current.has('ArrowRight')) w.sack = Math.min(W - SACK_HALF, w.sack + 320 * dt);
      const res = stepWorld(w, dt, speed, coalRatio);
      if (res.caught) w.caught++;
      if (res.hitCoal) w.lives--;
      if (res.caught || res.hitCoal) {
        setHud({ caught: w.caught, lives: w.lives });
        if (w.caught >= target) {
          phaseRef.current = 'won';
          setPhase('won');
          timer.current = window.setTimeout(onComplete, 700);
        } else if (w.lives <= 0) {
          phaseRef.current = 'lost';
          setPhase('lost');
        }
      }
    }
    draw(getCtx(canvas.current!), w);
  });

  return (
    <div>
      <div className="hud">
        <span>
          🎁 {hud.caught}/{target}
        </span>
        <span>{'❤️'.repeat(Math.max(0, hud.lives)) || '💔'}</span>
      </div>
      <div className="game-wrap">
        <GameCanvas ref={canvas} w={W} h={H} onPointerDown={steer} onPointerMove={steer} />
        {phase === 'ready' && <GameMessage text={strings.intro.catch} button={strings.tapToStart} onClick={start} />}
        {phase === 'lost' && <GameMessage title={strings.gameOver} button={strings.tryAgain} onClick={start} />}
      </div>
    </div>
  );
}

function draw(ctx: CanvasRenderingContext2D, w: ReturnType<typeof makeWorld>) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#16215b');
  sky.addColorStop(1, '#4b6fb5');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 24; i++) ctx.fillRect((i * 83) % W, (i * 57) % (H - 60), 2, 2);
  ctx.fillStyle = '#f4f8ff';
  ctx.fillRect(0, H - 34, W, 34);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '30px serif';
  for (const it of w.items) {
    if (it.coal) {
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.moveTo(it.x - 12, it.y + 6);
      ctx.lineTo(it.x - 7, it.y - 11);
      ctx.lineTo(it.x + 6, it.y - 12);
      ctx.lineTo(it.x + 13, it.y + 2);
      ctx.lineTo(it.x + 4, it.y + 12);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      ctx.fillRect(it.x - 4, it.y - 7, 5, 3);
    } else {
      ctx.fillText(it.face, it.x, it.y);
    }
  }
  // sack
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.moveTo(w.sack - SACK_HALF, SACK_Y - 4);
  ctx.lineTo(w.sack + SACK_HALF, SACK_Y - 4);
  ctx.lineTo(w.sack + SACK_HALF - 8, SACK_Y + 30);
  ctx.quadraticCurveTo(w.sack, SACK_Y + 40, w.sack - SACK_HALF + 8, SACK_Y + 30);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f4c542';
  ctx.fillRect(w.sack - SACK_HALF - 2, SACK_Y - 8, SACK_HALF * 2 + 4, 8);
}
