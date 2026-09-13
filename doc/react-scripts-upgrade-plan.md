# Fixing NODE_OPTIONS=--openssl-legacy-provider

## Root cause
`react-scripts` is pinned to `3.4.1`, which bundles Webpack 4. Webpack 4's
hashing uses an MD4 call that OpenSSL 3 (Node 17+) rejects. The
`--openssl-legacy-provider` flag (see `start:legacy-openssl` in
`package.json`) is a workaround, not a fix.

## Real fix
Bump `react-scripts` to `^5.0.1` (Webpack 5, no OpenSSL issue).

## Impact assessment
- No `craco.config.js` or webpack overrides in the repo — stock CRA setup,
  direct upgrade path.
- React stays at 16.13, which CRA5 supports fine — no React major-version
  migration needed.
- Likely touch points: version bump, possibly minor eslint/CRA config
  warnings, remove the now-unneeded `start:legacy-openssl` script.
- Realistic risk: one or two build warnings/config quirks (e.g. asset
  import behavior, jest config defaults) needing a quick fix-up — nothing
  structural.

**Verdict:** small-to-medium job, not a rewrite.

## TODO
- [ ] Bump `react-scripts` to `^5.0.1` in `package.json`
- [ ] Run `npm run build` and `npm run start`, fix whatever breaks
- [ ] Remove `start:legacy-openssl` script once no longer needed
