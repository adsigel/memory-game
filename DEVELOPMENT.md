# Memory Game — Development Notes

## Overview

A daily memory card game built for a grandparent, featuring photos of their grandkids. Each day, a new puzzle is generated from a seeded shuffle of photos so every player sees the same puzzle on the same day.

---

## Requirements

- **Daily puzzle**: Each day generates a unique, deterministic set of card pairs — the same puzzle for all players on the same date.
- **Photo cards**: Cards display family photos (grandkid images) stored in `/public/images/`.
- **Card flip mechanic**: Cards start face-down. Tapping two cards that match keeps them revealed; mismatched cards flip back after 1.6 seconds.
- **Feedback messages**: Friendly, encouraging messages are shown on match, mismatch, and game completion. After a mismatch the message updates to clearly prompt the player to try again.
- **Guess counter**: Tracks the number of two-card attempts per session.
- **Two difficulty levels**:
  - **Easy** — 2 pairs, 2×2 grid
  - **Harder** — 6 pairs, 3×4 grid
- **Progressive flow**: After completing Easy, the player is offered a "Start Harder" button. After completing Harder, the player is reminded to come back tomorrow.
- **Easy recap**: While playing or after completing Harder, the player can view their completed Easy puzzle, then return to Harder — via a toggle link in a consistent location below the grid.
- **No-scroll layout**: The full game (header, message banner, card grid) fits on an iPhone SE screen without vertical scrolling.
- **Analytics**: Amplitude event tracking for `puzzle_viewed`, `guess_made`, and `puzzle_completed`.
- **Testing controls**: A "Simulate Next Day" button in the UI advances the date to test different daily puzzles.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4 |
| Language | TypeScript 5 |
| Analytics | Amplitude (`@amplitude/analytics-browser`) |

---

## Project Structure

```
/
├── public/
│   └── images/          # Grandkid photos served as static assets
├── src/
│   ├── app/
│   │   ├── layout.tsx   # Root layout
│   │   ├── page.tsx     # Home page — renders <MemoryGame />
│   │   └── globals.css
│   ├── components/
│   │   └── MemoryGame.tsx   # Main game component
│   └── lib/
│       ├── puzzle.ts    # Daily puzzle generation (seeded shuffle)
│       ├── images.ts    # List of all available photo paths
│       └── amplitude.ts # Amplitude initialization and track wrapper
├── assets/              # Source/original assets (not served directly)
├── start-dev.sh         # Convenience script to start the dev server
└── next.config.ts
```

---

## Running Locally

### Prerequisites

- Node.js 18+
- npm

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

Or use the included convenience script (sets PATH for Homebrew Node):

```bash
./start-dev.sh
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Other scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build for production |
| `npm run start` | Run the production build |
| `npm run lint` | Run ESLint |

---

## Adding Photos

1. Copy new images into `public/images/`.
2. Add the path to the `ALL_IMAGES` array in [src/lib/images.ts](src/lib/images.ts).

The puzzle generator will automatically include the new images in the daily rotation.

---

## Analytics

Amplitude is initialized once on the client via `initAmplitude()` (called on mount in `MemoryGame.tsx`). The wrapper in [src/lib/amplitude.ts](src/lib/amplitude.ts) guards against SSR and duplicate initialization.

### Events

| Event | When it fires | Properties |
|---|---|---|
| `puzzle_viewed` | A puzzle is loaded (on date change or difficulty start) | `puzzle_id`, `difficulty` |
| `guess_made` | Player flips two cards | `puzzle_id`, `difficulty`, `correct` (boolean) |
| `puzzle_completed` | All pairs matched | `puzzle_id`, `difficulty`, `guesses_needed` |

### puzzle_id format

`puzzle_id` is `"{date}-{difficulty}"`, e.g. `"2026-04-07-easy"`. This ties every event to a specific daily puzzle and difficulty.
