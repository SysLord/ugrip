export function fileName(artist, song) {
  const rawFileName = `${artist}_${song}`;
  // artist /artist_song  song  -->  artist-artist_song-song
  const fileNameForStorage = rawFileName
      .replace(/\s/g, '-')
      .replace(/[^-\w]/g, '')
      .replace(/-+/g, '-')
      .toLocaleLowerCase();

  return fileNameForStorage;
}

// Store raw source as simple as possible, so that a human can copy-paste chords easily (not true for JSON with \\n)
export function generateTxtFile(artist, song, transposedChords, uri, fileName) {
  const text = [
    'ug_Format:RawV1',
    `ug_url:${uri}`,
    `ug_artist:${artist}`,
    `ug_song:${song}`,
    `ug_chords:${transposedChords}`
  ].join('\n');

  const a = document.createElement('a');
  const hrefUrl = new Blob([text], { type: 'text/plain' });
  a.href = URL.createObjectURL(hrefUrl);
  a.download = fileName + ".txt";
  document.body.appendChild(a);
  try {
    a.click();
  } finally {
    try { document.body.removeChild(a); } catch(e) { console.log(e); }
    try { URL.revokeObjectURL(hrefUrl); } catch(e) { console.log(e); }
  }
}
