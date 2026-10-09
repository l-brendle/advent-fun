import { useState } from 'react';
import type { DayConfig } from '../config/types';
import type { Strings } from '../i18n/strings';

interface Props {
  number: number;
  config?: DayConfig;
  unlocked: boolean;
  opened: boolean;
  strings: Strings;
  index: number;
  onOpen: (n: number, el: HTMLElement) => void;
  onLockedClick: (n: number) => void;
}

const COLORS = ['#d62839', '#2a9d5c', '#e8a317', '#2f7fc1', '#b5446e', '#e0662b'];

export function Door({ number, config, unlocked, opened, strings, index, onOpen, onLockedClick }: Props) {
  const [shake, setShake] = useState(false);
  const color = config?.doorColor ?? COLORS[(number * 7) % COLORS.length];

  const click = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (unlocked) return onOpen(number, e.currentTarget);
    setShake(true);
    onLockedClick(number);
  };

  const cls = ['door', unlocked ? 'unlocked' : 'locked', opened ? 'opened' : '', shake ? 'shake' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={cls}
      style={{ ['--door' as string]: color, ['--i' as string]: index }}
      aria-label={`${strings.door(number)}${unlocked ? '' : ', ' + strings.doorLocked}`}
      aria-disabled={!unlocked}
      onClick={click}
      onAnimationEnd={() => setShake(false)}
    >
      {opened && config?.doorImage && <img className="door-img" src={config.doorImage} alt="" />}
      <span className="door-num">{number}</span>
      <span className="door-knob" aria-hidden />
      {!unlocked && <span className="door-lock" aria-hidden>🔒</span>}
      {opened && <span className="door-star" aria-hidden>⭐</span>}
    </button>
  );
}
