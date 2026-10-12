import { useEffect, useRef, useState } from 'react';
import type { ContraptionDay } from '../../config/types';
import { GameCanvas, getCtx, toLogical } from '../../components/GameCanvas';
import { GameMessage } from '../../components/GameMessage';
import { useGameLoop } from '../../lib/useGameLoop';
import type { GameProps } from '../GameProps';
import {
  FLOOR,
  H,
  LEVELS,
  PRESENT,
  STEP_MS,
  TREE_HALF,
  W,
  clampItem,
  createSim,
  flipItem,
  hitItem,
  itemRect,
  stepSim,
  type Item,
  type LevelDef,
  type Sim,
} from './logic';

type Phase = 'intro' | 'edit' | 'run' | 'missed' | 'won';

export default function Contraption({ config, strings, onComplete }: GameProps<ContraptionDay>) {
  const level = LEVELS[config.level ?? 1];
  const canvas = useRef<HTMLCanvasElement>(null);
  const items = useRef<Item[]>(level.items.map((i) => ({ ...i })));
  const sim = useRef<Sim | null>(null);
  const acc = useRef(0);
  const clock = useRef(0);
  const drag = useRef<{ index: number; dx: number; dy: number; sx: number; sy: number; moved: boolean } | null>(null);
  const [phase, setPhase] = useState<Phase>('intro');
  const phaseRef = useRef<Phase>('intro');
  const timer = useRef<number>();
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const setPhaseBoth = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const run = () => {
    sim.current = createSim(level, items.current);
    acc.current = 0;
    setPhaseBoth('run');
  };
  const stop = () => {
    sim.current = null;
    setPhaseBoth('edit');
  };
  const reset = () => {
    items.current = level.items.map((i) => ({ ...i }));
  };

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (phaseRef.current !== 'edit') return;
    const p = toLogical(e, canvas.current!, W, H);
    for (let i = items.current.length - 1; i >= 0; i--) {
      const it = items.current[i];
      if (hitItem(it, p.x, p.y)) {
        e.currentTarget.setPointerCapture(e.pointerId);
        // raise the grabbed part above the others
        items.current.splice(i, 1);
        items.current.push(it);
        drag.current = { index: items.current.length - 1, dx: it.x - p.x, dy: it.y - p.y, sx: p.x, sy: p.y, moved: false };
        return;
      }
    }
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    if (!d) return;
    const p = toLogical(e, canvas.current!, W, H);
    if (Math.hypot(p.x - d.sx, p.y - d.sy) > 5) d.moved = true;
    if (d.moved) items.current[d.index] = clampItem(items.current[d.index], p.x + d.dx, p.y + d.dy, level.minY);
  };
  const up = () => {
    const d = drag.current;
    drag.current = null;
    if (d && !d.moved) items.current[d.index] = flipItem(items.current[d.index]);
  };

  useGameLoop((dt) => {
    clock.current += dt;
    const s = sim.current;
    if (s && phaseRef.current === 'run') {
      acc.current += dt * 1000;
      for (let n = 0; acc.current >= STEP_MS && n < 4 && phaseRef.current === 'run'; n++, acc.current -= STEP_MS) {
        const r = stepSim(s);
        if (r === 'won') {
          setPhaseBoth('won');
          timer.current = window.setTimeout(onComplete, 900);
        } else if (r === 'failed') {
          setPhaseBoth('missed');
        }
      }
    }
    draw(getCtx(canvas.current!), level, items.current, s, phaseRef.current, drag.current?.index ?? -1, clock.current);
  });

  return (
    <div>
      <p className="hud" style={{ fontWeight: 600, opacity: 0.8 }}>
        {strings.contraptionHelp}
      </p>
      <div className="game-wrap">
        <GameCanvas ref={canvas} w={W} h={H} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
        {phase === 'intro' && <GameMessage text={strings.intro.contraption} button={strings.tapToStart} onClick={() => setPhaseBoth('edit')} />}
        {phase === 'missed' && <GameMessage title={strings.gameOver} text={strings.contraptionMiss} button={strings.tryAgain} onClick={stop} />}
      </div>
      <div className="btn-row">
        {(phase === 'edit' || phase === 'intro') && (
          <>
            <button className="btn" onClick={reset} disabled={phase === 'intro'}>
              {strings.contraptionReset}
            </button>
            <button className="btn btn-primary" onClick={run} disabled={phase === 'intro'}>
              {strings.contraptionStart}
            </button>
          </>
        )}
        {phase === 'run' && (
          <button className="btn" onClick={stop}>
            {strings.contraptionStop}
          </button>
        )}
      </div>
    </div>
  );
}

function drawPresent(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const h = PRESENT / 2;
  ctx.fillStyle = '#d62839';
  ctx.strokeStyle = 'rgba(0,0,0,.4)';
  ctx.lineWidth = 1.5;
  ctx.fillRect(x - h, y - h, PRESENT, PRESENT);
  ctx.strokeRect(x - h, y - h, PRESENT, PRESENT);
  ctx.fillStyle = '#fff';
  ctx.fillRect(x - 2.5, y - h, 5, PRESENT);
  ctx.fillRect(x - h, y - 2.5, PRESENT, 5);
  ctx.beginPath();
  ctx.ellipse(x - 4, y - h - 2, 4, 3, -0.5, 0, Math.PI * 2);
  ctx.ellipse(x + 4, y - h - 2, 4, 3, 0.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawTree(ctx: CanvasRenderingContext2D, x: number) {
  ctx.fillStyle = '#6b3f1e';
  ctx.fillRect(x - 6, FLOOR - 14, 12, 14);
  ctx.fillStyle = '#1f7a3d';
  for (let i = 0; i < 3; i++) {
    const top = FLOOR - 96 + i * 26;
    const half = 22 + i * 10;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x + half, top + 42);
    ctx.lineTo(x - half, top + 42);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#ffd34d';
  ctx.beginPath();
  ctx.arc(x, FLOOR - 98, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e63946';
  for (const [dx, dy] of [[-12, -50], [10, -34], [-20, -18], [18, -12]]) {
    ctx.beginPath();
    ctx.arc(x + dx, FLOOR + dy, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawItem(ctx: CanvasRenderingContext2D, it: Item, t: number, active: boolean, lifted: boolean) {
  const r = itemRect(it);
  ctx.save();
  ctx.translate(r.x, r.y);
  ctx.rotate(r.angle);
  if (active) {
    ctx.strokeStyle = lifted ? '#ffd34d' : 'rgba(255,255,255,.75)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(-r.w / 2 - 5, -r.h / 2 - 5, r.w + 10, r.h + 10);
    ctx.setLineDash([]);
  }
  if (it.kind === 'belt') {
    ctx.fillStyle = '#3b3f4a';
    ctx.fillRect(-r.w / 2, -r.h / 2, r.w, r.h);
    ctx.fillStyle = '#f4c542';
    const off = (t * 30 * it.dir) % 16;
    ctx.save();
    ctx.beginPath();
    ctx.rect(-r.w / 2, -r.h / 2, r.w, r.h);
    ctx.clip();
    for (let x = -r.w / 2 - 16 + (off < 0 ? off + 16 : off); x < r.w / 2; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, -4);
      ctx.lineTo(x + 5 * it.dir, 0);
      ctx.lineTo(x, 4);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#f4c542';
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = '#222';
    for (const sx of [-r.w / 2, r.w / 2]) {
      ctx.beginPath();
      ctx.arc(sx, 0, r.h / 2 + 1, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (it.kind === 'trampoline') {
    ctx.fillStyle = '#e63946';
    ctx.fillRect(-r.w / 2, -r.h / 2, r.w, r.h);
    ctx.fillStyle = '#fff';
    ctx.fillRect(-r.w / 2 + 6, -r.h / 2, 8, r.h);
    ctx.fillRect(r.w / 2 - 14, -r.h / 2, 8, r.h);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r.w / 2 + 8, r.h / 2);
    for (let i = 0; i < 6; i++) ctx.lineTo(-r.w / 2 + 8 + i * 2, r.h / 2 + 3 + (i % 2 ? 6 : 0));
    ctx.moveTo(r.w / 2 - 8, r.h / 2);
    for (let i = 0; i < 6; i++) ctx.lineTo(r.w / 2 - 8 - i * 2, r.h / 2 + 3 + (i % 2 ? 6 : 0));
    ctx.stroke();
  } else if (it.kind === 'wall') {
    ctx.fillStyle = '#a4472f';
    ctx.fillRect(-r.w / 2, -r.h / 2, r.w, r.h);
    ctx.strokeStyle = 'rgba(255,255,255,.45)';
    ctx.lineWidth = 1;
    const vertical = r.h > r.w;
    for (let k = -40; k <= 40; k += 13) {
      ctx.beginPath();
      if (vertical) {
        ctx.moveTo(-r.w / 2, k);
        ctx.lineTo(r.w / 2, k);
      } else {
        ctx.moveTo(k, -r.h / 2);
        ctx.lineTo(k, r.h / 2);
      }
      ctx.stroke();
    }
  } else {
    // slide: candy-cane plank
    ctx.fillStyle = '#fff';
    ctx.fillRect(-r.w / 2, -r.h / 2, r.w, r.h);
    ctx.fillStyle = '#e63946';
    for (let x = -r.w / 2; x < r.w / 2; x += 14) ctx.fillRect(x, -r.h / 2, 7, r.h);
    ctx.strokeStyle = 'rgba(0,0,0,.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-r.w / 2, -r.h / 2, r.w, r.h);
  }
  ctx.restore();
}

function draw(
  ctx: CanvasRenderingContext2D,
  level: LevelDef,
  items: Item[],
  sim: Sim | null,
  phase: Phase,
  lifted: number,
  t: number,
) {
  const sky = ctx.createLinearGradient(0, 0, 0, FLOOR);
  sky.addColorStop(0, '#2b4a8c');
  sky.addColorStop(1, '#bfe0f7');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, FLOOR, W, H - FLOOR);
  ctx.fillStyle = '#dbe8f7';
  ctx.fillRect(0, FLOOR, W, 4);

  // goal zone
  ctx.fillStyle = 'rgba(255,211,77,.22)';
  ctx.fillRect(level.treeX - TREE_HALF, FLOOR - 50, TREE_HALF * 2, 50);
  drawTree(ctx, level.treeX);

  for (const f of level.fixed) {
    ctx.fillStyle = '#6c7380';
    ctx.fillRect(f.x - f.w / 2, f.y - f.h / 2, f.w, f.h);
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    ctx.fillRect(f.x - f.w / 2, f.y - f.h / 2, f.w, 3);
  }

  items.forEach((it, i) => drawItem(ctx, it, phase === 'run' ? t : 0, phase === 'edit', i === lifted));

  // start marker (sleigh drops the present here)
  if (phase !== 'run' && phase !== 'won') {
    ctx.font = '26px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🛷', level.start.x, level.start.y - 28);
    drawPresent(ctx, level.start.x, level.start.y);
  } else if (sim) {
    drawPresent(ctx, sim.present.position.x, sim.present.position.y);
  }
}
