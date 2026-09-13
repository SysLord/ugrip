# Disclaimer

- The current state of my fixes is an uncleaned mess of attempted quickfix.
  - The public proxy that was used to remove CORS restrictions by the original author hedwiggggg seems to be permanently overloaded.
  - I invested a few hours trying to get the included cors proxy locally to work and then tried to add my own local cors proxy, but I was not successful and not very patient.
- Ultimate Guitar now often serves a Cloudflare "Just a moment..." challenge page to automated/proxied requests instead of the real song page. "LOAD SONG" detects this case and shows an error telling you to use the manual paste fallback below, instead of failing silently.
- I added a manual paste-HTML fallback field + "LOAD PASTED HTML" button to the frontend for when automatic loading is blocked.

# Run locally (development)

1. `npm install` — install dependencies.
2. Start the dev server with one of these npm scripts (each shows a ▶ run icon in the IntelliJ/WebStorm gutter next to the `scripts` entry in `package.json`):
   - `npm run start` — plain `react-scripts start`, works on older Node versions.
   - `npm run start:legacy-openssl` — same, with `NODE_OPTIONS=--openssl-legacy-provider` baked in. Use this one if `npm run start` crashes with an OpenSSL/"digital envelope routines" error (happens on newer Node versions with this old `react-scripts`).
   - TODO: claude was not allowed to check which Node/npm version is installed locally, so it can't say up front which of the two scripts you'll need — try `start` first, fall back to `start:legacy-openssl` if it errors.
3. Open the app (default `http://localhost:3000`) and try "LOAD SONG". Locally there's no `REACT_APP_CORS_SERVER` set by default, so this fetch has nothing to proxy through and will fail (or you'll hit the Cloudflare challenge even with a proxy) — expected, use the manual fallback:
   - Go to the Ultimate Guitar song page in your browser.
   - Open DevTools (F12) → Network tab → refresh the page.
   - Open the first HTML request and copy its Response.
   - Paste it into the "Paste the full HTML response for the Ultimate Guitar song page here" box in the app.
   - Click **LOAD PASTED HTML**.

# Run with the CORS proxy (closer to the deployed/server setup)

The proxy (`docker/cors-anywhere.js`) lets "LOAD SONG" fetch Ultimate Guitar pages without a manual paste — as long as Cloudflare doesn't intercept the request with a challenge page.

**Option A — docker-compose + Makefile** (also play-button friendly: IntelliJ Ultimate's Docker/Makefile plugin support shows run icons per Makefile target and per docker-compose service):
- `make docker-build` → runs `docker-compose up --build -d`, builds the image with `CORS_SERVER=http://localhost:5001/`, and exposes port `5000` (app, served via `serve`) and `5001` (CORS proxy).
- `make docker-stop` → runs `docker-compose down`.

**Option B — plain Docker CLI** (manual terminal, no IDE run icon):
```
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

Run `yarn build` to build the app, then just serve the build folder.

(with https://www.npmjs.com/package/serve for example, or any other webhost)
