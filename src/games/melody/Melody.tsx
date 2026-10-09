import { useEffect, useRef, useState } from 'react';
import type { MelodyDay } from '../../config/types';
import { GameCanvas, getCtx, toLogical } from '../../components/GameCanvas';
import { GameMessage } from '../../components/GameMessage';
import { useGameLoop } from '../../lib/useGameLoop';
import type { GameProps } from '../GameProps';
import { buildTrack, hitTime, midiAtPos, midiToFreq, posFromY, stepFromY, type Track } from './logic';

type Phase = 'ready' | 'waiting' | 'playing' | 'lost' | 'won';

const W = 360;
const H = 480;
const NOW_X = 86;
const PX_PER_SEC = 110;
const LEAD_IN = 1.8;

/** Minimal synth: one triangle oscillator whose pitch follows the finger. */
function createSynth() {
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  const ctx = new Ctor();
  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(ctx.destination);
  let osc: OscillatorNode | null = null;
  return {
    on(freq: number) {
      void ctx.resume();
      if (!osc) {
        osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        osc.connect(gain);
        osc.start();
      }
      osc.frequency.setTargetAtTime(freq, ctx.currentTime, 0.015);
      gain.gain.setTargetAtTime(0.28, ctx.currentTime, 0.02);
    },
    off() {
      gain.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
    },
    close() {
      try {
        osc?.stop();
      } catch {
        /* already stopped */
      }
      void ctx.close();
    },
  };
}

export default function Melody({ config, strings, onComplete }: GameProps<MelodyDay>) {
  const need = Math.min(1, Math.max(0.1, config.threshold ?? 0.6));
  const track = useRef<Track>(buildTrack(config.song ?? 'jingle-bells', config.tempo ?? 1));
  const canvas = useRef<HTMLCanvasElement>(null);
  const synth = useRef<ReturnType<typeof createSynth>>(null);
  const game = useRef({ t: -LEAD_IN, hit: 0, held: false, step: 0, pos: 0 });
  const [phase, setPhase] = useState<Phase>('ready');
  const [pct, setPct] = useState(0);
  const phaseRef = useRef<Phase>('ready');
  phaseRef.current = phase;
  const timer = useRef<number>();

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      synth.current?.close();
    },
    [],
  );

  const reset = () => {
    game.current = { t: -LEAD_IN, hit: 0, held: false, step: 0, pos: 0 };
    setPct(0);
    setPhase('waiting');
  };

  const pitch = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const g = game.current;
    const y = toLogical(e, canvas.current!, W, H).y;
    const n = track.current.scale.length;
    g.step = stepFromY(y, H, n);
    g.pos = posFromY(y, H, n);
    // the sound follows the finger continuously (not snapped to the scale); only the hit check uses the nearest step
    if (g.held) synth.current?.on(midiToFreq(midiAtPos(track.current.scale, g.pos)));
  };

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (phaseRef.current !== 'waiting' && phaseRef.current !== 'playing') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    synth.current ??= createSynth();
    game.current.held = true;
    pitch(e);
    if (phaseRef.current === 'waiting') {
      phaseRef.current = 'playing';
      setPhase('playing');
    }
  };

  const release = () => {
    game.current.held = false;
    synth.current?.off();
  };

  useGameLoop((dt) => {
    const g = game.current;
    const tr = track.current;
    if (phaseRef.current === 'playing') {
      const t0 = g.t;
      g.t += dt;
      g.hit += hitTime(tr, t0, g.t, g.held ? g.step : null);
      const now = Math.round((g.hit / tr.noteTime) * 100);
      setPct((p) => (p === now ? p : now));
      if (g.t >= tr.length + 0.3) {
        release();
        const ok = g.hit / tr.noteTime >= need;
        phaseRef.current = ok ? 'won' : 'lost';
        setPhase(phaseRef.current);
        if (ok) timer.current = window.setTimeout(onComplete, 900);
      }
    }
    draw(getCtx(canvas.current!), tr, g, phaseRef.current === 'waiting', strings.melodyHold);
  });

  const needPct = Math.round(need * 100);
  return (
    <div>
      <div className="hud">
        <span>
          🎵 {pct}% / {needPct}%
        </span>
      </div>
      <div className="game-wrap">
        <GameCanvas
          ref={canvas}
          w={W}
          h={H}
          onPointerDown={down}
          onPointerMove={pitch}
          onPointerUp={release}
          onPointerCancel={release}
        />
        {phase === 'ready' && <GameMessage text={strings.intro.melody} button={strings.tapToStart} onClick={reset} />}
        {phase === 'lost' && (
          <GameMessage
            title={strings.gameOver}
            text={strings.melodyResult(pct, needPct)}
            button={strings.tryAgain}
            onClick={reset}
          />
        )}
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tr: Track,
  g: { t: number; held: boolean; step: number; pos: number },
  waiting: boolean,
  hint: string,
) {
  const n = tr.scale.length;
  const band = H / n;
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#1b1f5e');
  bg.addColorStop(1, '#3d2b6b');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i % 2 ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,0)';
    ctx.fillRect(0, H - (i + 1) * band, W, band);
  }
  const centerY = (s: number) => H - (s + 0.5) * band;

  // notes
  const active = tr.notes.find((x) => g.t >= x.start && g.t < x.start + x.dur);
  for (const note of tr.notes) {
    const x = NOW_X + (note.start - g.t) * PX_PER_SEC;
    const w = note.dur * PX_PER_SEC - 3;
    if (x > W || x + w < 0) continue;
    const y = centerY(note.step) - band * 0.36;
    const isActive = note === active;
    const matching = isActive && g.held && g.step === note.step;
    ctx.fillStyle = matching ? '#7dff9a' : isActive ? '#ffd24a' : '#ff6b81';
    ctx.shadowColor = matching ? '#7dff9a' : 'transparent';
    ctx.shadowBlur = matching ? 14 : 0;
    ctx.beginPath();
    ctx.roundRect(x, y, w, band * 0.72, 8);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // now line + finger marker
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ctx.fillRect(NOW_X - 1, 0, 2, H);
  if (g.held) {
    ctx.fillStyle = active && active.step === g.step ? '#7dff9a' : '#fff';
    ctx.beginPath();
    ctx.arc(NOW_X, centerY(g.pos), 11, 0, Math.PI * 2);
    ctx.fill();
  }

  if (waiting) {
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.fillRect(0, H / 2 - 30, W, 60);
    ctx.fillStyle = '#fff';
    ctx.font = '700 17px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(hint, W / 2, H / 2);
  }
}
