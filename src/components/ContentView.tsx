import { Suspense, useState } from 'react';
import type { CalendarConfig, DayConfig, Lang } from '../config/types';
import { isGameDay } from '../config/types';
import { tx, type Strings } from '../i18n/strings';
import { gameRegistry } from '../games/registry';
import { Celebration } from './Celebration';

interface Props {
  day: DayConfig | undefined;
  calendar: CalendarConfig;
  lang: Lang;
  strings: Strings;
  onCompleted: () => void;
  onClose: () => void;
}

export function ContentView({ day, calendar, lang, strings, onCompleted, onClose }: Props) {
  const [attempt, setAttempt] = useState(0);
  const [won, setWon] = useState(false);

  if (!day) return <p className="content-text">{strings.emptyDay}</p>;

  const heading = day.title ? <h2 className="content-title">{tx(day.title, lang)}</h2> : null;

  if (day.type === 'text') {
    return (
      <div className="content">
        {heading}
        <p className="content-text">{tx(day.text, lang)}</p>
      </div>
    );
  }

  if (day.type === 'image') {
    return (
      <div className="content">
        {heading}
        <img className="content-img" src={day.image} alt={tx(day.alt ?? day.caption, lang)} />
        {day.caption && <p className="content-text">{tx(day.caption, lang)}</p>}
      </div>
    );
  }

  if (isGameDay(day)) {
    if (won) {
      const c = day.celebration ?? calendar.defaultCelebration;
      return (
        <Celebration
          text={tx(c.text ?? calendar.defaultCelebration.text, lang) || strings.defaultWin}
          image={c.image ?? calendar.defaultCelebration.image}
          strings={strings}
          onClose={onClose}
          onPlayAgain={() => {
            setWon(false);
            setAttempt((a) => a + 1);
          }}
        />
      );
    }
    const Game = gameRegistry[day.type] as
      | React.ComponentType<{ config: typeof day; lang: Lang; strings: Strings; onComplete: () => void }>
      | undefined;
    return (
      <div className="content game">
        {heading}
        <p className="intro">{tx(day.intro, lang) || strings.intro[day.type]}</p>
        {Game ? (
          <Suspense fallback={<p className="intro">{strings.loading}</p>}>
            <Game
              key={attempt}
              config={day}
              lang={lang}
              strings={strings}
              onComplete={() => {
                onCompleted();
                setWon(true);
              }}
            />
          </Suspense>
        ) : (
          <p className="content-text">🚧 {day.type}</p>
        )}
      </div>
    );
  }
  return null;
}
