import { useEffect, useMemo, useRef, useState } from 'react';
import type { QuizDay } from '../../config/types';
import { tx } from '../../i18n/strings';
import { shuffle } from '../../lib/random';
import type { GameProps } from '../GameProps';
import { correctAnswers } from './logic';
import './quiz.css';

const LETTERS = ['A', 'B', 'C', 'D'];
/** Wait for the chosen answer's blink animation (3 × 0.5 s, see quiz.css) before celebrating. */
const BLINK_TOTAL_MS = 1500;

export default function Quiz({ config, lang, strings, onComplete }: GameProps<QuizDay>) {
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [removed, setRemoved] = useState<number[]>([]);
  const [imageFailed, setImageFailed] = useState(false);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const correct = correctAnswers(config.correct);
  const wrongAnswers = [0, 1, 2, 3].filter((i) => !correct.includes(i));
  const jokerAvailable = (config.joker ?? true) && removed.length === 0 && wrongAnswers.length > 0;

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    timers.current.push(
      window.setTimeout(() => {
        setRevealed(true);
        if (correct.includes(i)) timers.current.push(window.setTimeout(onComplete, BLINK_TOTAL_MS));
      }, 1400),
    );
  };

  const joker = useMemo(
    () => () => {
      setRemoved(shuffle(wrongAnswers).slice(0, 2));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.correct],
  );

  const retry = () => {
    setPicked(null);
    setRevealed(false);
  };

  const wrong = revealed && picked !== null && !correct.includes(picked);

  return (
    <div className="quiz">
      <div className="quiz-question">{tx(config.question, lang)}</div>
      {config.image && !imageFailed && (
        <img
          className="quiz-image"
          src={config.image}
          alt={tx(config.imageAlt, lang)}
          draggable={false}
          onError={() => setImageFailed(true)}
        />
      )}
      <div className="quiz-answers">
        {config.answers.map((a, i) => {
          // Once revealed, every answer shows its colour; the ones that weren't picked are dimmed.
          const state = revealed
            ? `${correct.includes(i) ? 'correct' : 'wrong'} ${i === picked ? 'chosen' : 'dim'}`
            : picked === i
              ? 'picked'
              : '';
          return (
            <button
              key={i}
              className={`quiz-answer ${state}`}
              disabled={picked !== null || removed.includes(i)}
              style={{ visibility: removed.includes(i) ? 'hidden' : 'visible' }}
              onClick={() => pick(i)}
            >
              <b>{LETTERS[i]}:</b> {tx(a, lang)}
            </button>
          );
        })}
      </div>
      {jokerAvailable && picked === null && (
        <button className="btn quiz-joker" onClick={joker}>
          {strings.quizJoker}
        </button>
      )}
      <p className="wrong-msg">{wrong ? strings.quizWrong : ''}</p>
      {wrong && (
        <button className="btn btn-primary" onClick={retry}>
          {strings.tryAgain}
        </button>
      )}
    </div>
  );
}
