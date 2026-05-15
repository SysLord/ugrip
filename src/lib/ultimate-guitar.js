function createHtmlDocument(html) {
  const parser = new DOMParser();
  return parser.parseFromString(html, 'text/html');
}

function findInObject(obj, key) {
  let objects = [];
  const keys = Object.keys(obj || {});

  for (let i = 0; i < keys.length; i += 1) {
    const currentKey = keys[i];

    if (Object.prototype.hasOwnProperty.call(obj, currentKey)) {
      if (typeof obj[currentKey] === 'object' && obj[currentKey] !== null) {
        objects = [...objects, ...findInObject(obj[currentKey], key)];
      } else if (currentKey === key) {
        objects.push(obj[currentKey]);
      }
    }
  }

  return objects;
}

function isCloudflareChallenge(document) {
  const title = document.querySelector('title')?.textContent || '';
  const challengeMarker = document.querySelector('meta[http-equiv="refresh"]');
  const challengeScript = document.querySelector('script[src*="challenge-platform"]');

  return (
    title.includes('Just a moment') ||
    Boolean(document.querySelector('[data-cf-beacon]')) ||
    Boolean(challengeMarker && challengeScript)
  );
}

export function parseUltimateGuitarHtml(html) {
  const document = createHtmlDocument(html);

  if (isCloudflareChallenge(document)) {
    throw new Error(
      'Ultimate Guitar blocked the automated request with a Cloudflare challenge. Open the song page in your browser, copy the page HTML from DevTools Network, and paste it into the manual source box.'
    );
  }

  const store = document.querySelector('.js-store');
  const storeJson = store?.getAttribute('data-content');

  if (!storeJson) {
    throw new Error('Could not find Ultimate Guitar song data in the fetched page.');
  }

  const storeData = JSON.parse(storeJson);
  const [song] = findInObject(storeData, 'song_name');
  const [artist] = findInObject(storeData, 'artist_name');
  const [chords] = findInObject(storeData, 'content');

  if (!song || !artist || !chords) {
    throw new Error('The Ultimate Guitar page loaded, but the song data was incomplete.');
  }

  return { song, artist, chords };
}
