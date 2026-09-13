# ugrip

Fork of [hedwiggggg/ugrip](https://github.com/hedwiggggg/ugrip) — unmaintained since 2020 (last upstream commit 2020-07-06). Pulls chords/lyrics from ultimate-guitar.com, lets you transpose/simplify/reformat them, and exports a PDF or raw text file.

## Overview

![Overview](/doc/ugrip_overview.png)

## Changes in this fork

**Fixes**
- Ultimate Guitar now often serves a Cloudflare "Just a moment..." challenge page to automated/proxied requests instead of the real song page. "LOAD SONG" detects this case and shows an error telling you to use the manual paste fallback below, instead of failing silently.
- Fixed the bundled CORS proxy binding to `127.0.0.1` inside the Docker container, which made it unreachable through Docker's published port — now binds to `0.0.0.0`.
- Pinned Node/npm versions (Dockerfile → `node:16.20.2`) to fix a `react-is` peer-dependency install failure under npm 6, and to avoid an OpenSSL 3 / Webpack 4 hashing crash on Node ≥17.
- Fixed the gh-pages deploy branch.

**Features**
- Manual paste-HTML fallback field + "LOAD PASTED HTML" button, for when automatic loading is blocked.
- Raw text file export, alongside the existing PDF export.
- QR code in the generated PDF linking back to the source URL.
- In-app source editor.
- `npm run start:legacy-openssl` script for running the dev server on newer Node versions.
- docker-compose + Makefile setup (`make docker-build` / `make docker-stop`) for running the app and CORS proxy together.

# Run locally (development)

Install dependencies:

```bash
npm install
```

Start the dev server (each of these also shows a ▶ run icon in the IntelliJ/WebStorm gutter next to the `scripts` entry in `package.json`):

```bash
npm run start
```

`npm run start` works on older Node versions. If it crashes with an OpenSSL "digital envelope routines" error (happens on newer Node versions with this old `react-scripts`), use this instead — it's the same script with `NODE_OPTIONS=--openssl-legacy-provider` baked in:

```bash
npm run start:legacy-openssl
```

Open the app (default `http://localhost:3000`) and try "LOAD SONG". Locally there's no `REACT_APP_CORS_SERVER` set by default, so this fetch has nothing to proxy through and will fail (or you'll hit the Cloudflare challenge even with a proxy) — expected, use the manual fallback instead:

1. Go to the Ultimate Guitar song page in your browser.
2. Open DevTools (F12) → Network tab → refresh the page.
3. Open the first HTML request and copy its Response.
4. Paste it into the "Paste the full HTML response for the Ultimate Guitar song page here" box in the app.
5. Click **LOAD PASTED HTML**.

# Run with the CORS proxy (closer to the deployed/server setup)

The proxy (`docker/cors-anywhere.js`) lets "LOAD SONG" fetch Ultimate Guitar pages without a manual paste — as long as Cloudflare doesn't intercept the request with a challenge page.

**Local use only:** the proxy has no allowlist — it will relay a request to any URL you point it at, not just Ultimate Guitar. Treat it as a local/dev convenience behind your own machine; don't expose its port on a public network without an allowlist or other access control in front of it.

**Option A — docker-compose + Makefile.** Also play-button friendly: IntelliJ Ultimate's Docker/Makefile plugin support shows run icons per Makefile target and per docker-compose service.

Build and start (runs `docker-compose up --build -d`, builds the image with `CORS_SERVER=http://localhost:5001/`, and exposes port `5000` for the app, served via `serve`, and `5001` for the CORS proxy):

```bash
make docker-build
```

Stop (runs `docker-compose down`):

```bash
make docker-stop
```

**Option B — plain Docker CLI** (manual terminal, no IDE run icon):

```bash
docker build -t ugrip --build-arg CORS_SERVER=http://0.0.0.0:5001/ .
docker run -p 5000:5000 -p 5001:5001 ugrip
```

# Original Readme
---

This webapp can pull the chords / lyrics from ultimate-guitar.com and create a pdf from it.

--- 

features:
- load songs from ultimate-guitar.com & view the chords
- transpose chords
- simplify chords
- select parsing style (normal / northern european / southern european)
- edit source file
- generate pdf

---

screenshots:

![Screenshot Smartphone](/doc/screenshot_mobile.png)
![Screenshot PC](/doc/screenshot_pc.png)

---

Build the app, then just serve the `build` folder — with [`serve`](https://www.npmjs.com/package/serve), for example, or any other webhost:

```bash
npm run build
```
