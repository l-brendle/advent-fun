# Advent Calendar 🎄

A playful, mobile-friendly advent calendar: 24 doors, each hiding a text, an image or a mini-game.
Only doors whose date has been reached can be opened (based on the visitor's device clock).

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/
npm test           # unit tests
```

## Configure the days

Everything lives in **`src/config/calendar.config.ts`** — language, title, year, the default
celebration screen and the content of each day (1–24). The file is typed, so your editor
autocompletes the options and `npm run build` fails on mistakes.

Texts can be a plain string or `{ de: '…', en: '…' }` (one language is enough — it is used for both). Put images in `public/images/` and
reference them as `'/images/<file>'`.

| `type`     | What it is                          | Options                                              |
|------------|-------------------------------------|------------------------------------------------------|
| `text`     | A message                           | `text`                                               |
| `image`    | A picture with optional caption     | `image`, `caption`, `alt`                            |
| `quiz`     | "Who wants to be a millionaire?"    | `question`, `answers` (4), `correct` (0–3 or a list like `[0, 2]`), `joker` |
| `scramble` | Unscramble a word                   | `word`, `hint`                                       |
| `memory`   | Find the pairs                      | `pairs` (4–10), `images`                             |
| `sliding`  | Sliding tile puzzle                 | `size` (3/4), `image`                                |
| `jigsaw`   | Drag pieces to the right place      | `image`, `grid` (default 5)                          |
| `maze`     | Drag Santa to the present           | `size` (4–14), `seed`                                |
| `catch`    | Catch presents, avoid coal          | `targetCount`, `speed`, `coalRatio`                  |
| `flappy`   | Fly the sleigh past trees & clouds  | `targetScore`, `speed`                               |
| `minigolf` | Putt the ball into the hole         | `level` (1–5; 4 and 5 have moving blocks)            |
| `snowball` | Slingshot snowballs at the house    | `level` (1–4, 4 is the hardest), `shots`             |

Every day also accepts `title`, `doorColor` and `doorImage`. Games accept `intro` and
`celebration: { text, image }` (shown after winning; falls back to `defaultCelebration`).

```ts
3: {
  type: 'quiz',
  question: 'How many reindeer pull the sleigh?',
  answers: ['6', '8', '10', '12'],
  correct: 1,
  celebration: { text: 'Correct!', image: '/images/win.gif' },
},
```

## Testing the locking

Add these to the URL (only for you — the real visitors just see today's date):

- `?preview=1` — all doors open
- `?today=2026-12-08` — pretend it is that day

> The lock is client-side, so a determined visitor can change their device clock or read the
> config in the page source. Fine for a family/friends calendar; don't put secrets in it.

## Deploy (Vercel)

Import the repo in Vercel — `vercel.json` already sets `npm run build` and `dist`.
