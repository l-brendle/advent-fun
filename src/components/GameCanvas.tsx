import { forwardRef, type PointerEventHandler } from 'react';

/** Internal pixel density; the canvas is CSS-scaled to fit its container. */
export const CANVAS_SCALE = 2;

interface Props {
  w: number;
  h: number;
  onPointerDown?: PointerEventHandler<HTMLCanvasElement>;
  onPointerMove?: PointerEventHandler<HTMLCanvasElement>;
  onPointerUp?: PointerEventHandler<HTMLCanvasElement>;
  onPointerCancel?: PointerEventHandler<HTMLCanvasElement>;
}

/** Canvas with a logical size of w×h units (draw with ctx from `getCtx`). */
export const GameCanvas = forwardRef<HTMLCanvasElement, Props>(function GameCanvas({ w, h, ...handlers }, ref) {
  return (
    <canvas
      ref={ref}
      className="game-canvas"
      width={w * CANVAS_SCALE}
      height={h * CANVAS_SCALE}
      style={{ width: `min(100%, ${(62 * w) / h}vh)`, aspectRatio: `${w} / ${h}` }}
      {...handlers}
    />
  );
});

export function getCtx(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(CANVAS_SCALE, 0, 0, CANVAS_SCALE, 0, 0);
  return ctx;
}

/** Converts a pointer event to logical canvas coordinates. */
export function toLogical(e: { clientX: number; clientY: number }, canvas: HTMLCanvasElement, w: number, h: number) {
  const r = canvas.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * w, y: ((e.clientY - r.top) / r.height) * h };
}
