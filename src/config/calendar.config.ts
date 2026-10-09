import { defineCalendar } from './types';

/**
 * ✏️ THIS IS THE FILE TO EDIT.
 * Each day (1-24) is either a `text`, an `image`, or one of the mini-games.
 * Texts can be a plain string or { de: '...', en: '...' }.
 * Images live in /public/images and are referenced as '/images/<file>'.
 * Test locally with ?preview=1 (all doors open) or ?today=2026-12-08.
 */
export default defineCalendar({
  language: 'de', // 'de' | 'en' | 'auto'
  title: { de: 'Adventskalender', en: 'Advent Calendar' },
  subtitle: { de: '24 Türchen voller Überraschungen', en: '24 doors full of surprises' },
  year: 2026,
  shuffleDoors: true,
  defaultCelebration: {
    text: { de: 'Geschafft! 🎉', en: 'You did it! 🎉' },
  },
  days: {
    1: { type: 'text', text: { de: 'Frohen ersten Dezember! ❄️ Ich wünsche dir eine zauberhafte Adventszeit.', en: 'Happy first of December! ❄️ Wishing you a magical Advent season.' } },
    2: {
      type: 'quiz',
      question: { de: 'Wie viele Rentiere ziehen traditionell den Schlitten des Weihnachtsmanns?', en: "How many reindeer traditionally pull Santa's sleigh?" },
      answers: ['6', '8', '10', '12'],
      correct: 1,
    },
    3: { type: 'scramble', word: 'LEBKUCHEN', hint: { de: 'Süßes Gebäck', en: 'Sweet treat' } },
    4: { type: 'memory', pairs: 6 },
    5: { type: 'sliding', size: 3 },
    6: { type: 'text', text: { de: 'Frohen Nikolaus! 🎅 Hast du deine Stiefel geputzt?', en: 'Happy St. Nicholas Day! 🎅 Did you polish your boots?' } },
    7: { type: 'maze', size: 7 },
    8: { type: 'catch', targetCount: 12 },
    9: { type: 'flappy', targetScore: 8 },
    10: { type: 'minigolf', level: 1 },
    11: { type: 'snowball', level: 1, shots: 5 },
    12: { type: 'jigsaw', image: '/images/sample.svg', grid: 5 },
    13: { type: 'memory', pairs: 8 },
    14: { type: 'sliding', size: 4, image: '/images/sample.svg' },
    15: { type: 'scramble', word: 'SCHNEEMANN', hint: { de: 'Hat eine Karottennase', en: 'Has a carrot nose' } },
    16: { type: 'maze', size: 9 },
    17: { type: 'minigolf', level: 2 },
    18: { type: 'catch', targetCount: 20, speed: 1.3 },
    19: { type: 'snowball', level: 2, shots: 5 },
    20: { type: 'flappy', targetScore: 12 },
    21: { type: 'text', text: { de: 'Die längste Nacht des Jahres – ab jetzt werden die Tage wieder länger. 🌙', en: 'The longest night of the year – the days grow longer from now on. 🌙' } },
    22: { type: 'minigolf', level: 3 },
    23: { type: 'snowball', level: 3, shots: 6 },
    24: { type: 'text', text: { de: 'Frohe Weihnachten! 🎄🎁 Schön, dass es dich gibt.', en: 'Merry Christmas! 🎄🎁 So glad you exist.' } },
    // Jigsaw needs an image, e.g.:
    // 9: { type: 'jigsaw', image: '/images/family.jpg', grid: 5 },
    // Quiz/other games accept: celebration: { text: '...', image: '/images/win.gif' }
  },
});
