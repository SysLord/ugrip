# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page React app (Create React App, `react-scripts@3.4.1`) that pulls chords/lyrics from ultimate-guitar.com, lets you transpose/simplify/reformat them, and exports a PDF or raw text file.

## Commands

- `npm install` — install dependencies.
- `npm run start` — dev server (`react-scripts start`). Requires Node <17 (see "Node version constraints" below).
- `npm run start:legacy-openssl` — same, with `NODE_OPTIONS=--openssl-legacy-provider` baked in; use when `start` crashes with an OpenSSL "digital envelope routines" error on newer Node.
- `npm run build` — production build (`GENERATE_SOURCEMAP=false react-scripts build`).
- `npm run serve` — serve the built `build/` folder (via `serve`).
- `npm run cors` — run the local CORS proxy (`docker/cors-anywhere.js`), used by the "LOAD SONG" fetch in dev/docker.
- `npm run deploy` — publish `build/` to GitHub Pages (`gh-pages`).
- There is no `test` or `lint` npm script defined. Run them directly:
  - `npx react-scripts test` — Jest tests (e.g. `src/lib/ultimate-guitar.test.js`). Add `-- --testPathPattern=ultimate-guitar` to scope to one file, or `-- --watchAll=false` for a single non-watch run.
  - `npx eslint src` — lint against `.eslintrc` (airbnb/base + react + prettier).
- Docker (closer to the deployed setup, runs the app + CORS proxy together): `make docker-build` (docker-compose up --build -d, exposes 5000 app / 5001 proxy) and `make docker-stop`.

## Architecture

- **All state lives in `src/App.js`.** No router, no Redux/context — song text, artist/song name, the Ultimate Guitar URL, transpose/parsing/halftone/simplify options, and load status are all `useState` in the single `App` component.
- **Two independent paths feed the same parser**, both ending in `applySongData`:
  - `loadSong`: `fetch(\`${REACT_APP_CORS_SERVER}${uri}\`)` — the automatic path, proxied through a CORS server since Ultimate Guitar doesn't send CORS headers.
  - `loadManualSource`: parses HTML the user pastes in by hand (DevTools → Network → copy response). This exists because Ultimate Guitar frequently returns a Cloudflare "Just a moment..." challenge page instead of the real song page for automated/proxied requests — `parseUltimateGuitarHtml` detects that case and throws a descriptive error rather than failing silently.
  - Both call `parseUltimateGuitarHtml` in `src/lib/ultimate-guitar.js`, which reads Ultimate Guitar's embedded `.js-store` element (`data-content` attribute, a big JSON blob) and recursively searches it for `song_name`, `artist_name`, and `content`.
- **Chord format**: chord text uses Ultimate Guitar's own inline tags — `[ch]...[/ch]` wraps a chord, `[tab]...[/tab]` wraps a tab/lyric block. `App.js` renders this by regexing `[ch]`/`[tab]` into `<b>`/`<div>` for on-screen display, and `generate-pdf.js` strips/splits on the same tags to build a pdfmake document.
- **Transposition** happens in a `useEffect` in `App.js` keyed on `transposeStep`/`chords`/`parsingStyle`/`halftoneStyle`/`simplify`. It splits the raw chord text on `[ch]`/`[/ch]`, runs each chord through `chord-magic` (`parse` → `transpose` → `prettyPrint`), and pads with `-`/spaces so transposed chords keep the same horizontal alignment above the lyrics (chord names can change length, e.g. `C` → `C#m7`).
- **PDF export** (`src/lib/generate-pdf.js`) builds a `pdfmake` doc definition: a QR code linking back to the source URL, artist/song header, then the `[ch]`/`[tab]`-parsed chord body in a monospace font (`vfs_fonts.js` embeds the Roboto Mono font data pdfmake needs).
- **CORS proxy setup**: `docker/cors-anywhere.js` wraps the `cors-anywhere` npm package; `docker/start.sh` runs it (`npm run cors`) alongside the built app (`npm run serve`) as two processes in the same container (ports 5001 and 5000).
- **Env vars**: `REACT_APP_CORS_SERVER` (client-side, baked in at build time — prefixed to the fetched URL) and `CORS_SERVER` (only its port is used server-side; `docker/cors-anywhere.js` always binds to `0.0.0.0`, ignoring `CORS_SERVER`'s hostname — binding to `localhost`/`127.0.0.1` inside the container would make the proxy unreachable through Docker's published port). Set via `.env` locally, or `--build-arg CORS_SERVER=...` / Dockerfile `ARG`/`ENV` for Docker builds.

## Node version constraints

Pinned by `Dockerfile` to `node:16.20.2`, for two reasons documented inline there:
- Needs npm 7+ (Node ≥16's bundled npm) because `styled-components` declares `react-is` as a peer dependency, and npm 6 doesn't auto-install peer deps.
- Must stay below Node 17 to avoid the OpenSSL 3 break in Webpack 4's MD4-based hashing (used by the pinned `react-scripts@3.4.1`) — this is also why `start:legacy-openssl` exists for local dev on newer Node.

The real fix (tracked, not yet done) is upgrading `react-scripts` to `^5.0.1`; see `doc/react-scripts-upgrade-plan.md` for the impact assessment and TODO list.
