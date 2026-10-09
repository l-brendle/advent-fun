import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import calendar from './config/calendar.config';
import { validateConfig } from './config/validate';
import type { DayNumber } from './config/types';
import { getStrings, resolveLang, tx } from './i18n/strings';
import { daysUntil, readClock, unlockDate } from './lib/dates';
import { doorOrder } from './lib/order';
import * as storage from './lib/storage';
import { Calendar } from './components/Calendar';
import { ContentView } from './components/ContentView';
import { Overlay } from './components/Overlay';
import { Snowfall } from './components/Snowfall';

export function App() {
  const lang = useMemo(() => resolveLang(calendar.language), []);
  const strings = getStrings(lang);
  const clock = useMemo(() => readClock(window.location.search), []);
  const order = useMemo(() => doorOrder(!!calendar.shuffleDoors, calendar.year), []);
  const [saved, setSaved] = useState(() => storage.load(calendar.year));
  const [active, setActive] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number>();

  useEffect(() => {
    validateConfig(calendar);
    document.title = tx(calendar.title, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const persist = useCallback((next: typeof saved) => {
    setSaved(next);
    storage.save(calendar.year, next);
  }, []);

  const open = (n: number) => {
    setActive(n);
    if (!saved.opened.includes(n)) persist({ ...saved, opened: [...saved.opened, n] });
  };

  const onLocked = (n: number) => {
    setToast(strings.lockedToast(Math.max(1, daysUntil(n, calendar.year, clock.today))));
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  };

  const untilFirst = daysUntil(1, calendar.year, clock.today);
  const beforeStart = !clock.preview && clock.today < unlockDate(1, calendar.year);

  return (
    <>
      <Snowfall />
      <main className="page">
        <header className="header">
          <h1>{tx(calendar.title, lang)}</h1>
          {calendar.subtitle && <p>{tx(calendar.subtitle, lang)}</p>}
          {beforeStart && <p className="banner">{strings.countdown(untilFirst)}</p>}
          {clock.preview && <p className="banner">{strings.previewBanner}</p>}
        </header>
        <Calendar
          config={calendar}
          order={order}
          clock={clock}
          opened={saved.opened}
          strings={strings}
          onOpen={open}
          onLockedClick={onLocked}
        />
      </main>
      {toast && <div className="toast" role="status">{toast}</div>}
      {active !== null && (
        <Overlay title={strings.door(active)} closeLabel={strings.close} onClose={() => setActive(null)}>
          <ContentView
            key={active}
            day={calendar.days[active as DayNumber]}
            calendar={calendar}
            lang={lang}
            strings={strings}
            onCompleted={() => {
              if (!saved.completed.includes(active))
                persist({ ...saved, completed: [...saved.completed, active] });
            }}
            onClose={() => setActive(null)}
          />
        </Overlay>
      )}
    </>
  );
}
