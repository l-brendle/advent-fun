import type { Lang, LocalizedText } from '../config/types';

const strings = {
  de: {
    close: 'Schließen',
    playAgain: 'Nochmal spielen',
    tryAgain: 'Nochmal versuchen',
    lockedToast: (days: number) =>
      days === 1 ? 'Nur noch 1 Tag Geduld! 🤫' : `Noch ${days} Tage Geduld! 🤫`,
    countdown: (days: number) =>
      days === 1 ? 'Noch 1 Tag bis zum ersten Türchen!' : `Noch ${days} Tage bis zum ersten Türchen!`,
    previewBanner: 'Vorschau-Modus: alle Türchen sind offen',
    door: (n: number) => `Türchen ${n}`,
    doorLocked: 'noch verschlossen',
    emptyDay: 'Hier ist heute nichts drin … oder doch? 🎁',
    loading: 'Lädt …',
    defaultWin: 'Geschafft! 🎉',
    // games
    quizJoker: '50:50',
    quizWrong: 'Leider falsch!',
    scrambleHint: 'Tipp',
    scrambleReveal: 'Buchstabe aufdecken',
    scrambleWrong: 'Das passt noch nicht …',
    moves: 'Züge',
    pairs: 'Paare',
    score: 'Punkte',
    lives: 'Leben',
    caught: 'Gefangen',
    shots: 'Schneebälle',
    strokes: 'Schläge',
    par: 'Par',
    tapToStart: 'Tippen zum Starten',
    melodyHold: 'Halte gedrückt zum Starten ♪',
    melodyResult: (pct: number, need: number) => `${pct}% getroffen – du brauchst ${need}%.`,
    gameOver: 'Oh nein!',
    outOfShots: 'Keine Schneebälle mehr!',
    intro: {
      quiz: 'Wer wird Millionär? Wähle die richtige Antwort!',
      scramble: 'Bring die Buchstaben in die richtige Reihenfolge.',
      memory: 'Finde alle Pärchen!',
      sliding: 'Schiebe die Teile, bis das Bild stimmt.',
      jigsaw: 'Ziehe die Teile an die richtige Stelle.',
      maze: 'Bring den Weihnachtsmann zum Geschenk!',
      catch: 'Fang die Geschenke – aber keine Kohle!',
      flappy: 'Tippe, damit der Schlitten fliegt!',
      minigolf: 'Ziehe zurück und lass los, um zu schlagen.',
      snowball: 'Ziehe die Schleuder und triff das Lebkuchenhaus!',
      melody: 'Halte gedrückt und bewege den Finger auf und ab – triff die Töne der Melodie!',
    },
  },
  en: {
    close: 'Close',
    playAgain: 'Play again',
    tryAgain: 'Try again',
    lockedToast: (days: number) =>
      days === 1 ? 'Just 1 more day! 🤫' : `${days} more days to wait! 🤫`,
    countdown: (days: number) =>
      days === 1 ? '1 day until the first door!' : `${days} days until the first door!`,
    previewBanner: 'Preview mode: all doors are unlocked',
    door: (n: number) => `Door ${n}`,
    doorLocked: 'still locked',
    emptyDay: 'Nothing in here today … or is there? 🎁',
    loading: 'Loading …',
    defaultWin: 'You did it! 🎉',
    quizJoker: '50:50',
    quizWrong: 'Sorry, wrong!',
    scrambleHint: 'Hint',
    scrambleReveal: 'Reveal a letter',
    scrambleWrong: 'Not quite yet …',
    moves: 'Moves',
    pairs: 'Pairs',
    score: 'Score',
    lives: 'Lives',
    caught: 'Caught',
    shots: 'Snowballs',
    strokes: 'Strokes',
    par: 'Par',
    tapToStart: 'Tap to start',
    melodyHold: 'Press and hold to start ♪',
    melodyResult: (pct: number, need: number) => `${pct}% hit – you need ${need}%.`,
    gameOver: 'Oh no!',
    outOfShots: 'Out of snowballs!',
    intro: {
      quiz: 'Who wants to be a millionaire? Pick the right answer!',
      scramble: 'Put the letters in the right order.',
      memory: 'Find all the pairs!',
      sliding: 'Slide the tiles until the picture is complete.',
      jigsaw: 'Drag the pieces to the right spot.',
      maze: 'Guide Santa to the present!',
      catch: 'Catch the presents – but no coal!',
      flappy: 'Tap to make the sleigh fly!',
      minigolf: 'Pull back and release to putt.',
      snowball: 'Pull the slingshot and hit the gingerbread house!',
      melody: 'Press and hold, then slide up and down – hit the notes of the melody!',
    },
  },
} satisfies Record<Lang, unknown>;

export type Strings = (typeof strings)['de'];

export function getStrings(lang: Lang): Strings {
  return strings[lang];
}

export function resolveLang(setting: Lang | 'auto'): Lang {
  if (setting !== 'auto') return setting;
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'de';
  return nav.toLowerCase().startsWith('de') ? 'de' : 'en';
}

export function tx(text: LocalizedText | undefined, lang: Lang): string {
  if (text === undefined) return '';
  if (typeof text === 'string') return text;
  const other: Lang = lang === 'de' ? 'en' : 'de';
  return text[lang] ?? text[other] ?? '';
}
