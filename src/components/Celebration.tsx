import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { Strings } from '../i18n/strings';

interface Props {
  text: string;
  image?: string;
  strings: Strings;
  onPlayAgain: () => void;
  onClose: () => void;
}

export function Celebration({ text, image, strings, onPlayAgain, onClose }: Props) {
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const end = Date.now() + 1200;
    const colors = ['#d62839', '#2a9d5c', '#f4c542', '#ffffff'];
    (function frame() {
      confetti({ particleCount: 5, angle: 60, spread: 60, origin: { x: 0, y: 0.8 }, colors, zIndex: 2000 });
      confetti({ particleCount: 5, angle: 120, spread: 60, origin: { x: 1, y: 0.8 }, colors, zIndex: 2000 });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, []);

  return (
    <div className="celebration">
      <div className="celebration-emoji" aria-hidden>🎉</div>
      <h2 className="celebration-text">{text}</h2>
      {image && <img className="celebration-img" src={image} alt="" />}
      <div className="btn-row">
        <button className="btn btn-primary" onClick={onPlayAgain}>
          {strings.playAgain}
        </button>
        <button className="btn" onClick={onClose}>
          {strings.close}
        </button>
      </div>
    </div>
  );
}
