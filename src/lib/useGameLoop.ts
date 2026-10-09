import { useEffect, useRef } from 'react';

/** Runs `step(dtSeconds)` every animation frame while `active`. dt is capped at 50 ms. */
export function useGameLoop(step: (dt: number) => void, active = true) {
  const stepRef = useRef(step);
  stepRef.current = step;
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();
    const frame = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      stepRef.current(dt);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}
