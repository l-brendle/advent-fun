interface Props {
  title?: string;
  text?: string;
  button: string;
  onClick: () => void;
}

/** Centered message layered over a game (start screen, game over). */
export function GameMessage({ title, text, button, onClick }: Props) {
  return (
    <div className="game-msg">
      {title && <h3>{title}</h3>}
      {text && <p>{text}</p>}
      <button className="btn btn-primary" onClick={onClick} autoFocus>
        {button}
      </button>
    </div>
  );
}
