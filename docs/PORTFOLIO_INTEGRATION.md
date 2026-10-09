# Portfolio integration

The chess trainer and the future portfolio are separate deployments. This document records how to put the existing trainer at `https://varunsr.com/chesstrainer/app/` without rebuilding its asset paths.

## URLs

| Surface | URL |
| --- | --- |
| Current production app | `https://adaptive-chess-trainer.vercel.app/chesstrainer/app/` |
| Future public app | `https://varunsr.com/chesstrainer/app/` |
| Future portfolio landing page | `https://varunsr.com/chesstrainer` |
| Portfolio site root | `https://varunsr.com/` |

The landing page is not part of this repository.

## Vite base path

`vite.config.ts` sets `base` to `/chesstrainer/app/` for production builds and `vite preview`. Development and tests use `/`.

Built HTML, JavaScript, CSS, images, piece SVGs, Stockfish files, and licensing files are requested under that base. Application code joins public paths with `publicAssetUrl()` in `src/lib/basePath.ts`. Do not hardcode `adaptive-chess-trainer.vercel.app` or `varunsr.com` in the app.

## Current Vercel routing

This project is its own Vercel deployment. `vercel.json` does three things:

- Redirects `/` to `/chesstrainer/app/`.
- Redirects `/chesstrainer/app` to `/chesstrainer/app/`.
- Rewrites `/chesstrainer/app/` to `/index.html`, and `/chesstrainer/app/:path*` to `/:path*` so files at the deployment root are served under the public base path.

Keep those rules. The rewrite strips the prefix before the file lookup. A request for `/chesstrainer/app/stockfish/stockfish-19-lite-single.wasm` must resolve to `stockfish/stockfish-19-lite-single.wasm` in the build output. The same applies to `/chesstrainer/app/licenses/`.

Refreshing `/chesstrainer/app/` must return the app. Game and profile screens are React state, not URL routes.

## Intended reverse proxy

Leave this Vercel project in place. The portfolio project, which will own `varunsr.com`, should proxy the chess app rather than absorb this repository:

- Browser URL stays `https://varunsr.com/chesstrainer/app/...`.
- The portfolio proxies `/chesstrainer/app` and `/chesstrainer/app/` to this deployment.
- The proxy must preserve the `/chesstrainer/app/` prefix on the public URL. This deployment already expects that prefix and strips it internally.
- `/chesstrainer` itself is the future landing page and should be served by the portfolio, not by this app.
- Do not point the trainer's Vite `base` at `/` when it is shown under `/chesstrainer/app/`. Asset URLs would otherwise leave the app path.

## Static assets and Stockfish

These files must remain available at the public base path:

- `/chesstrainer/app/assets/`
- `/chesstrainer/app/stockfish/stockfish-19-lite-single.js`
- `/chesstrainer/app/stockfish/stockfish-19-lite-single.wasm`
- `/chesstrainer/app/pieces/`
- `/chesstrainer/app/images/`
- `/chesstrainer/app/licenses/`

The worker derives the WASM URL from its own script URL. The `.js` and `.wasm` files must stay in the same directory.

## Authentication

Email confirmation, password recovery, and Google sign-in return to the current origin plus the Vite base. On the future domain that is `https://varunsr.com/chesstrainer/app/`.

Before using that domain for sign-in, add `https://varunsr.com/chesstrainer/app/**` to the Supabase redirect allow list. Google's authorized redirect URI remains the Supabase callback. Add `https://varunsr.com` as a Google authorized JavaScript origin when that domain starts serving the app.

The current Vercel hostname can remain allow-listed while both URLs work. This repository does not change Supabase or Google settings.
