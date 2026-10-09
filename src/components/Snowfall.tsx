import { useMemo } from 'react';

export function Snowfall({ count = 40 }: { count?: number }) {
  const flakes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: (i * 97) % 100,
        size: 6 + ((i * 13) % 10),
        dur: 8 + ((i * 7) % 10),
        delay: -((i * 3) % 12),
      })),
    [count],
  );
  return (
    <div className="snowfall" aria-hidden>
      {flakes.map((f, i) => (
        <span
          key={i}
          style={{ left: `${f.left}%`, width: f.size, height: f.size, animationDuration: `${f.dur}s`, animationDelay: `${f.delay}s` }}
        />
      ))}
    </div>
  );
}
