# Adaptive Chess Trainer

Adaptive Chess Trainer is a browser chess application. You play against a Stockfish opponent whose target strength follows an estimated rating, then review the game with a custom move-quality scale.

The app runs locally with Vite. Production builds target `/chesstrainer/app/`. See [Deployment](#deployment).

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

## Third-party assets and licenses

The files in `public/stockfish/` are Stockfish.js 19. Their file header identifies them as GPLv3, copyright Chess.com, LLC, based on Stockfish by T. Romstad, M. Costalba, J. Kiiski, G. Linscott, and other contributors.

- Stockfish.js: <https://github.com/nmrugg/stockfish.js>
- Stockfish: <https://github.com/official-stockfish/Stockfish>
- GPLv3: <https://www.gnu.org/licenses/gpl-3.0.html>

This repository does not include a license for the application source, a copy of the GPLv3 text, or the Stockfish source that corresponds to the bundled worker. See the licensing note in the Batch 5.4 report if you are preparing a public distribution.

Chess piece artwork is credited in [`public/pieces/ATTRIBUTION.md`](public/pieces/ATTRIBUTION.md). Modern (Chessnut) is Apache License 2.0. Minimal (Spatial) is MIT.

## Deployment

The chess application is built to be served at `/chesstrainer/app/` on the same domain as the portfolio. This repository does not deploy itself, and it does not own `varunsr.com`.

| URL | What it is |
| --- | --- |
| `https://varunsr.com/` | Portfolio. Not this project. |
| `https://varunsr.com/chesstrainer` | Project landing page. Not this project. |
| `https://varunsr.com/chesstrainer/app/` | This application. |

### Base path

`vite.config.ts` sets Vite `base` to `/chesstrainer/app/` when the mode is `production`, and to `/` otherwise.

- `npm run dev` serves the app at `/`, usually `http://127.0.0.1:5173/`.
- `npm run build` writes a production bundle whose HTML, JS, CSS, and public assets use `/chesstrainer/app/`.
- `npm run preview` serves that bundle at `http://localhost:4173/chesstrainer/app/`. Opening `/` on that server redirects to the base path. `/chesstrainer/app` without the trailing slash is not a file, so the host must redirect it to `/chesstrainer/app/`. Vite's preview server does not add that redirect.

Public assets are joined to that base in application code: the three Stockfish worker scripts, chess piece SVGs, and the header logo. The favicon in `index.html` uses Vite's `%BASE_URL%` placeholder. The Stockfish worker file is unchanged. It still resolves `stockfish-19-lite-single.wasm` from its own script URL, so the WASM file stays next to the worker script.

Game and profile screens are React state. Refreshing `/chesstrainer/app/` reloads the game screen. There is no client route to preserve.

### Environment variables

Production needs the same variables as local development. See [Environment variables](#environment-variables). Vite inlines `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` at build time. Do not commit `.env.local`.

### Authentication redirects

Email confirmation, password recovery, and Google sign-in send the browser to the current origin plus the Vite base. Locally that is `http://127.0.0.1:5173/` or `http://localhost:5173/`. In production it is `https://varunsr.com/chesstrainer/app/`. The app does not hardcode the production domain.

Supabase rejects a `redirectTo` value that is not allowed. In the Supabase dashboard, under Authentication → URL Configuration, add:

- `http://localhost:5173/**`
- `http://127.0.0.1:5173/**`
- `https://varunsr.com/chesstrainer/app/**`

Add any preview-host URL the same way before using it for sign-in. Leave the Supabase project URL, API keys, and database settings unchanged from this repository.

Google OAuth still redirects to the Supabase callback, not to the chess app:

`https://<project-ref>.supabase.co/auth/v1/callback`

In Google Cloud, the OAuth client needs that callback as an authorized redirect URI, and `https://varunsr.com` as an authorized JavaScript origin. `http://localhost:5173` should stay allowed for local development.

### Hosting

Vite's base path only rewrites URLs inside this build. It does not attach the build to `varunsr.com`, and it does not configure the portfolio host. Two workable layouts:

1. **Copy the build onto the portfolio host.** Publish `dist/` so its files are available at `/chesstrainer/app/` (`index.html` at `/chesstrainer/app/index.html`, assets at `/chesstrainer/app/assets/`, Stockfish at `/chesstrainer/app/stockfish/`). The host must serve that directory for both `/chesstrainer/app` and `/chesstrainer/app/`. In-app navigation does not need a fallback to `index.html` for extra paths such as `/profile`.
2. **Deploy this project separately and rewrite on the domain owner.** The portfolio project keeps `varunsr.com`. It rewrites `/chesstrainer/app` and `/chesstrainer/app/*` to this deployment, and the rewrite strips the `/chesstrainer/app` prefix before the request reaches a host whose files live at the site root. The browser URL stays on `varunsr.com`. A rewrite that leaves the prefix in place will 404, because this project's own deployment root contains `assets/` and `stockfish/`, while the HTML requests `/chesstrainer/app/assets/` and `/chesstrainer/app/stockfish/`.

Choose one layout before the first production deploy. This repo has no Vercel, Netlify, or other host config, because the domain and the portfolio live elsewhere.

## Project status

The training app, guest profiles, Supabase email and Google sign-in, revision-checked cloud saves, and the Vitest suite are implemented in this repository. Version `0.0.0` in `package.json` is still the local development version. Nothing here is a hosted production release.
