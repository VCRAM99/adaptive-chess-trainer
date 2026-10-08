# Adaptive Chess Trainer

Adaptive Chess Trainer is a browser chess application. You play against a Stockfish opponent whose target strength follows an estimated rating, then review the game with a custom move-quality scale.

The app runs locally with Vite. It is not deployed. A future public path, `/chesstrainer/app/`, is described under [Planned deployment](#planned-deployment).

## Features

- Play on an interactive board, including promotions, undo during a game, and board orientation.
- Choose a training mode:
  - **Casual** plays below your estimated level.
  - **Echo** plays near your estimated level.
  - **Train** plays above your estimated level.
- Estimate a player rating from completed games and use it when choosing the opponent's target strength.
- Analyze a finished game and label moves on seven tiers, from strongest to weakest: Diamond, Platinum, Gold, Silver, Bronze, Steel, and Wood.
- Keep a guest profile in the browser, including game history and statistics.
- Sign in with email and password or Google through Supabase, then store that account's profile and preferences in the cloud. Guest progress can be imported into an empty account.
- Change the accent color, board theme, and piece set.

## Stack

- React 19 and TypeScript
- Vite
- chess.js for move rules
- [react-chessboard](https://github.com/Clariity/react-chessboard) for the board
- Stockfish 19, through the Stockfish.js worker in `public/stockfish/`
- Supabase for authentication and cloud storage
- Vitest and Testing Library

## Architecture

`src/App.tsx` is the game shell. It owns the live game, review navigation, and account session. Supporting code is split by job:

- `src/engine/` starts the Stockfish workers and reads their UCI output. The live opponent, move analysis, and post-game review each use their own worker.
- `src/lib/` holds move rules, opponent selection, the rating estimate, post-game classification, profiles, preferences, and Supabase persistence.
- `src/components/` and `src/pages/ProfilePage.tsx` render the board, game panel, dialogs, and profile.
- `src/dev/` contains manual opponent-calibration scripts. They are not part of the app or the test script.

Guest data stays in `localStorage`. A signed-in profile is saved through Supabase with a revision check so a stale write does not replace a newer cloud profile.

## Local setup

Requirements: Node.js 24 LTS and npm.

```bash
npm install
cp .env.example .env.local
```

Edit `.env.local` with the URL and publishable key from your Supabase project settings. The app throws on startup if either value is missing. Do not commit `.env.local`.

```bash
npm run dev
```

Vite prints a local URL, usually `http://127.0.0.1:5173/`.

## Environment variables

| Name | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key used by the browser client |

Both names are read in `src/lib/supabase/client.ts`. `.env.example` lists them with non-working placeholders. Copy that file to `.env.local` and replace the placeholders there.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run test` | Run Vitest in watch mode |
| `npm run test:run` | Run the test suite once |
| `npm run build` | Typecheck with `tsc -b`, then build for production |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |

## Third-party assets and licenses

The files in `public/stockfish/` are Stockfish.js 19. Their file header identifies them as GPLv3, copyright Chess.com, LLC, based on Stockfish by T. Romstad, M. Costalba, J. Kiiski, G. Linscott, and other contributors.

- Stockfish.js: <https://github.com/nmrugg/stockfish.js>
- Stockfish: <https://github.com/official-stockfish/Stockfish>
- GPLv3: <https://www.gnu.org/licenses/gpl-3.0.html>

This repository does not include a license for the application source, a copy of the GPLv3 text, or the Stockfish source that corresponds to the bundled worker. See the licensing note in the Batch 5.4 report if you are preparing a public distribution.

Chess piece artwork is credited in [`public/pieces/ATTRIBUTION.md`](public/pieces/ATTRIBUTION.md). Modern (Chessnut) is Apache License 2.0. Minimal (Spatial) is MIT.

## Planned deployment

The production build assumes the site is served from the domain root. Vite's `base` is the default `/`, and the three engine workers load `/stockfish/stockfish-19-lite-single.js`.

The planned location is `/chesstrainer/app/`. Changing the Vite base path and those worker URLs is Milestone 11.3. This batch does not change deployment configuration.

## Project status

The training app, guest profiles, Supabase email and Google sign-in, revision-checked cloud saves, and the Vitest suite are implemented in this repository. Version `0.0.0` in `package.json` is still the local development version. Nothing here is a hosted production release.
