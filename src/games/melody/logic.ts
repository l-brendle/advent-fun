export type SongId = 'jingle-bells' | 'silent-night' | 'merry-christmas';

/** [MIDI pitch, length in beats]. All songs are in C major. */
type Song = { bpm: number; notes: [number, number][] };

const [C4, D4, E4, F4, G4, A4, B4, C5, D5, E5, F5] = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77];

export const SONGS: Record<SongId, Song> = {
  'jingle-bells': {
    bpm: 112,
    notes: [
      [E4, 1], [E4, 1], [E4, 2], [E4, 1], [E4, 1], [E4, 2],
      [E4, 1], [G4, 1], [C4, 1.5], [D4, 0.5], [E4, 4],
      [F4, 1], [F4, 1], [F4, 1.5], [F4, 0.5], [F4, 1], [E4, 1], [E4, 1], [E4, 0.5], [E4, 0.5],
      [E4, 1], [D4, 1], [D4, 1], [E4, 1], [D4, 2], [G4, 2],
    ],
  },
  'silent-night': {
    bpm: 108,
    notes: [
      [G4, 1.5], [A4, 0.5], [G4, 1], [E4, 3],
      [G4, 1.5], [A4, 0.5], [G4, 1], [E4, 3],
      [D5, 2], [D5, 1], [B4, 3],
      [C5, 2], [C5, 1], [G4, 3],
      [A4, 2], [A4, 1], [C5, 1.5], [B4, 0.5], [A4, 1],
      [G4, 1.5], [A4, 0.5], [G4, 1], [E4, 3],
    ],
  },
  'merry-christmas': {
    bpm: 150,
    notes: [
      [G4, 1],
      [C5, 1], [C5, 0.5], [D5, 0.5], [C5, 0.5], [B4, 0.5], [A4, 1], [A4, 1], [A4, 1],
      [D5, 1], [D5, 0.5], [E5, 0.5], [D5, 0.5], [C5, 0.5], [B4, 1], [G4, 1], [G4, 1],
      [E5, 1], [E5, 0.5], [F5, 0.5], [E5, 0.5], [D5, 0.5], [C5, 1], [A4, 1], [G4, 0.5], [G4, 0.5],
      [A4, 1], [D5, 1], [B4, 1], [C5, 3],
    ],
  },
};

export const SONG_IDS = Object.keys(SONGS) as SongId[];

const MAJOR = new Set([0, 2, 4, 5, 7, 9, 11]);

/** Pitches of the C-major scale between lo and hi (inclusive), lowest first. */
export function scaleBetween(lo: number, hi: number): number[] {
  const out: number[] = [];
  for (let p = lo; p <= hi; p++) if (MAJOR.has(p % 12)) out.push(p);
  return out;
}

export interface TrackNote {
  /** Index into `scale` (0 = lowest). */
  step: number;
  /** Seconds from the song start. */
  start: number;
  dur: number;
}

export interface Track {
  scale: number[];
  notes: TrackNote[];
  /** End of the last note, seconds. */
  length: number;
  /** Sum of all note durations, seconds. */
  noteTime: number;
}

/** Turns a song into timed notes on a scale that has one spare step above and below. */
export function buildTrack(id: SongId, tempo = 1): Track {
  const song = SONGS[id];
  const spb = 60 / (song.bpm * tempo);
  const pitches = song.notes.map((n) => n[0]);
  const scale = scaleBetween(Math.min(...pitches) - 2, Math.max(...pitches) + 2);
  const notes: TrackNote[] = [];
  let t = 0;
  for (const [p, beats] of song.notes) {
    notes.push({ step: scale.indexOf(p), start: t, dur: beats * spb });
    t += beats * spb;
  }
  return { scale, notes, length: t, noteTime: t };
}

export function midiToFreq(p: number): number {
  return 440 * Math.pow(2, (p - 69) / 12);
}

/** Maps a vertical position (0 = top) to a scale step (0 = lowest, drawn at the bottom). */
export function stepFromY(y: number, h: number, steps: number): number {
  const band = Math.floor((y / h) * steps);
  return Math.min(steps - 1, Math.max(0, steps - 1 - band));
}

export function noteAt(track: Track, t: number): TrackNote | undefined {
  return track.notes.find((n) => t >= n.start && t < n.start + n.dur);
}

/** Time during [t0, t1] in which the played step matched the melody. */
export function hitTime(track: Track, t0: number, t1: number, step: number | null): number {
  if (step === null) return 0;
  let hit = 0;
  for (const n of track.notes) {
    if (n.step !== step) continue;
    hit += Math.max(0, Math.min(t1, n.start + n.dur) - Math.max(t0, n.start));
  }
  return hit;
}
