import { useState } from 'react';

interface Props {
  src: string;
  alt?: string;
}

/** Picture in a door's content; quietly disappears if the file can't be loaded. */
export function DayImage({ src, alt = '' }: Props) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return <img className="content-img" src={src} alt={alt} draggable={false} onError={() => setFailed(true)} />;
}
