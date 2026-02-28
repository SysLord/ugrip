# Disclaimer

- The current state of my fixes is an uncleaned mess of attempted quickfix.
  - The public proxy that was used to remove CORS restrictions by the original author hedwiggggg seems to be permanently overloaded.
  - I invested a few hours trying to get the included cors proxy locally to work and then tried to add my own local cors proxy, but I was not successful and not very patient.
- I added a frontend field to manually paste the ultimate guitar page using developer tools in the browser.
 
# TLDR;
locally: `npm run start`

newer npm versions require quickfix: \
`NODE_OPTIONS=--openssl-legacy-provider npm run start`

## How to manually paste website code from ultimate guitar
- Go to ultimate guitar
- F12 developer console > network
- refresh
- use first request html
- paste into second field and press "load"

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

---

or run it with docker

`docker build -t ugrip --build-arg CORS_SERVER=http://0.0.0.0:5001/ .`

`docker run -p 5000:5000 -p 5001:5001 ugrip`