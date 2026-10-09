import type { CalendarConfig, DayNumber } from '../config/types';
import type { Strings } from '../i18n/strings';
import { isUnlocked, type Clock } from '../lib/dates';
import { Door } from './Door';

interface Props {
  config: CalendarConfig;
  order: number[];
  clock: Clock;
  opened: number[];
  strings: Strings;
  onOpen: (n: number, el: HTMLElement) => void;
  onLockedClick: (n: number) => void;
}

export function Calendar({ config, order, clock, opened, strings, onOpen, onLockedClick }: Props) {
  return (
    <div className="grid">
      {order.map((n, i) => (
        <Door
          key={n}
          number={n}
          index={i}
          config={config.days[n as DayNumber]}
          unlocked={isUnlocked(n, config.year, clock)}
          opened={opened.includes(n)}
          strings={strings}
          onOpen={onOpen}
          onLockedClick={onLockedClick}
        />
      ))}
    </div>
  );
}
