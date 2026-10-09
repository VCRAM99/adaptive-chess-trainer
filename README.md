# Adaptive Chess Trainer

Adaptive Chess Trainer is a browser chess application. You play against a Stockfish opponent whose target strength follows an estimated rating, then review the game with a custom move-quality scale.

The live app is [https://adaptive-chess-trainer.vercel.app/chesstrainer/app/](https://adaptive-chess-trainer.vercel.app/chesstrainer/app/). Production builds use `/chesstrainer/app/`. See [Hosting](#hosting).

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
| `npm run preview` | Serve the production build at `/chesstrainer/app/` |
| `npm run lint` | Run ESLint |

## Third-party software

Opponent play and move analysis use the lite single-threaded Stockfish.js 19 worker in `public/stockfish/`. Piece artwork is credited in [`public/pieces/ATTRIBUTION.md`](public/pieces/ATTRIBUTION.md). Notices, the GPLv3 text, and corresponding-source information are in [`THIRD_PARTY_LICENSES.md`](THIRD_PARTY_LICENSES.md).

## Hosting

The app is deployed on its own Vercel project:

[https://adaptive-chess-trainer.vercel.app/chesstrainer/app/](https://adaptive-chess-trainer.vercel.app/chesstrainer/app/)

`vite.config.ts` sets Vite `base` to `/chesstrainer/app/` for production builds and to `/` for local development. `vercel.json` redirects `/` and `/chesstrainer/app` to `/chesstrainer/app/`, then rewrites that prefix onto the built files. Refreshing the app URL loads the game screen. Game and profile navigation stays in React state.

`npm run preview` serves the production build at `http://localhost:4173/chesstrainer/app/`.

Production needs the same environment variables as local development. Vite inlines them at build time. Email confirmation, password recovery, and Google sign-in return to the current origin plus the Vite base. On the live site that is `https://adaptive-chess-trainer.vercel.app/chesstrainer/app/`.

## Project status

The training app, guest profiles, Supabase email and Google sign-in, revision-checked cloud saves, and the Vitest suite are in this repository. Version `0.0.0` in `package.json` is still the development version.
