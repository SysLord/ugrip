import React, { useState, useCallback, useEffect } from 'react';

import {
  TextInput,
  Button,
  Select,
  RangeInput,
  CheckBox,
  RadioButtonGroup,
  Box,
  Text
} from 'grommet';

import { parse, transpose, prettyPrint } from 'chord-magic';

import generatePDF from './lib/generate-pdf';
import { parseUltimateGuitarHtml } from './lib/ultimate-guitar';

import './App.css';

const corsURI = process.env.REACT_APP_CORS_SERVER;

function formatChords(chords) {
  let formattedChords = chords;

  formattedChords = formattedChords.replace(/\[ch\]/g, '<b>');
  formattedChords = formattedChords.replace(/\[\/ch\]/g, '</b>');

  formattedChords = formattedChords.replace(/\[tab\]/g, '<div>');
  formattedChords = formattedChords.replace(/\[\/tab\]/g, '</div>');

  return { __html: formattedChords };
}

function App() {
  const [uri, setUri] = useState(
    'https://tabs.ultimate-guitar.com/tab/the-cranberries/dreams-chords-1485486'
  );
  const [manualSource, setManualSource] = useState('');
  const [showManualSource, setShowManualSource] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [loadMessage, setLoadMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [chords, setChords] = useState("paste a ultimate-guitar.com link and press `Load Song`..\r\nExample song:\r\nCapo 3\r\n\r\n[Intro]\r\n| [ch]Bb[/ch]   | [ch]C/D[/ch]\r\n\r\n[Verse 1]\r\n[tab][ch]A[/ch]        [ch]C[/ch]\r\n  Example song lyrics line[/tab]\r\n");
  const [artist, setArtist] = useState('Example Artist');
  const [song, setSong] = useState('Example Song');

  const [parsingStyle, setParsingStyle] = useState(undefined);
  const [halftoneStyle, setHalftoneStyle] = useState('SHARPS');
  const [simplify, setSimplify] = useState(false);

  const [transposeStep, setTransposeStep] = useState(0);
  const [transposedChords, setTransposedChords] = useState(chords);

  const renderChords = useCallback(() => formatChords(transposedChords), [transposedChords]);
  const downloadPdf = useCallback(() => { generatePDF(artist, song, transposedChords, uri, fileName(artist, song)) }, [artist, song, transposedChords, uri]);
  const downloadTxt = useCallback(() => { generateTxtFile(artist, song, transposedChords, uri, fileName(artist, song)) }, [artist, song, transposedChords, uri]);

  const applySongData = useCallback(({ artist: nextArtist, song: nextSong, chords: nextChords }) => {
    setArtist(nextArtist);
    setSong(nextSong);
    setChords(nextChords);
    setLoadError('');
    setLoadMessage(`Loaded "${nextSong}" by ${nextArtist}.`);
  }, []);

  function fileName(artist, song) {
    const fileName = `${artist}_${song}`;
    // artist /artist_song  song  -->  artist-artist_song-song
    const fileNameForStorage = fileName
        .replace(/\s/g, '-')
        .replace(/[^-\w]/g, '')
        .replace(/-+/g, '-')
        .toLocaleLowerCase();

    return fileNameForStorage;
  }

  // Story raw source as simple as possible, so that a human can copy-paste chords easily (not true for JSON with \\n)
  function generateTxtFile(artist, song, transposedChords, uri, fileName) {
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
    a.download = fileName  + ".txt";
    document.body.appendChild(a);
    try {
      a.click();
    } finally {
      try { document.body.removeChild(a); } catch(e) { console.log(e); }
      try { URL.revokeObjectURL(hrefUrl); } catch(e) { console.log(e); }
    }
  }

  const loadSong = useCallback(async () => {
    setIsLoading(true);
    setLoadMessage('Loading song...');
    setLoadError('');

    try {
      const response = await fetch(`${corsURI}${uri}`);
      const text = await response.text();

      if (!response.ok) {
        throw new Error(`Song request failed with HTTP ${response.status}.`);
      }

      applySongData(parseUltimateGuitarHtml(text));
      setShowManualSource(false);
    } catch (error) {
      console.error('Failed to load song from URL', error);
      setLoadMessage('');
      setLoadError(error.message);
      setShowManualSource(true);
    } finally {
      setIsLoading(false);
    }
  }, [applySongData, uri]);

  const loadManualSource = useCallback(() => {
    try {
      applySongData(parseUltimateGuitarHtml(manualSource));
      setShowManualSource(false);
    } catch (error) {
      console.error('Failed to load pasted Ultimate Guitar HTML', error);
      setLoadMessage('');
      setLoadError(error.message);
    }
  }, [applySongData, manualSource]);

  useEffect(() => {
    const parseOptions = {};

    let transChords = chords.split(/\[ch\]|\[\/ch\]/g);
    let regex = [];

    switch (parsingStyle) {
      case 'NORTHERN EUROPEAN':
        parseOptions.naming = 'NorthernEuropean';
        break;

      case 'SOUTHERN EUROPEAN':
        parseOptions.naming = 'SouthernEuropean';
        break;

      case 'NORMAL':
      default:
        break;
    }

    for (let i = 1; i <= transChords.length; i += 2) {
      const chord = transChords[i];

      if (chord) {
        try {
          let tones = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];

          if (halftoneStyle === 'FLATS') {
            tones = ['A', 'Bb', 'B', 'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab'];
          }

          const parsedChord = parse(chord, parseOptions);
          const transChord = transpose(parsedChord, transposeStep);

          if (simplify) {
            delete transChord.extended;
            delete transChord.suspended;
            delete transChord.added;
            delete transChord.overridingRoot;
          }

          const prettyChord = prettyPrint(parsedChord, { naming: tones });
          const prettyTransChord = prettyPrint(transChord, { naming: tones });

          const chordsDiff = prettyTransChord.length - prettyChord.length;
          const chordsDiffPos = Math.abs(chordsDiff);

          const replacer = chordsDiff >= 0 ? '-'.repeat(chordsDiff) : ' '.repeat(chordsDiffPos);

          transChords[i] = `[ch]${prettyTransChord}[/ch]`;
          transChords[i] += replacer;

          if (chordsDiff >= 0) {
            regex.push(replacer + ' '.repeat(chordsDiff));
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.info('failed to transpose', chord);
        }
      }
    }

    regex = regex.filter(r => r.length > 1);
    regex = [...new Set(regex)];

    transChords = transChords
      .join('')
      .replace(new RegExp(regex.join('|'), 'gm'), '')
      .replace(new RegExp('-+(\\n|\\r|\\S)', 'gm'), '$1')
      .replace(/\[\/ch\]\s\[ch\]/g, '[/ch]  [ch]')
      .replace(/\[\/ch\]\[ch\]/g, '[/ch] [ch]')
      .replace(/\[\/ch\](\w)/g, '[/ch] $1');

    setTransposedChords(transChords);
  }, [transposeStep, chords, parsingStyle, halftoneStyle, simplify]);

  return (
    <>
      <div className="controls">
        <TextInput
          value={uri}
          placeholder="Paste an Ultimate Guitar URL, for example https://tabs.ultimate-guitar.com/tab/the-cranberries/dreams-chords-1485486"
          onChange={e => setUri(e.target.value)}
        />

        <Box className="box-1" pad="none">
          <Text>{`TRANSPOSE: ${transposeStep}`}</Text>
          <RangeInput
            style={{ minWidth: '200px' }}
            min={-12}
            max={12}
            step={1}
            value={transposeStep}
            onChange={e => setTransposeStep(parseInt(e.currentTarget.value, 10))}
          />
        </Box>

        <Box className="box-2" pad="none" style={{ flexDirection: 'row' }}>
          <Button primary onClick={loadSong} disabled={isLoading} label={isLoading ? 'LOADING...' : 'LOAD SONG'} />
          <Button primary onClick={downloadPdf} label="DOWNLOAD PDF" />
          <Button secondary onClick={downloadTxt} label="DOWNLOAD RAW" />
        </Box>

        <Select
          options={['NORMAL', 'NORTHERN EUROPEAN', 'SOUTHERN EUROPEAN']}
          placeholder={'PARSING STYLE'}
          value={parsingStyle}
          onChange={({ option }) => setParsingStyle(option)}
        />

        <Box className="box-3" pad="none" style={{ flexDirection: 'row' }}>
          <RadioButtonGroup
            name="halftoneStyle"
            options={['SHARPS', 'FLATS']}
            value={halftoneStyle}
            onChange={e => setHalftoneStyle(e.currentTarget.value)}
          />

          <CheckBox
            label="SIMPLIFY"
            checked={simplify}
            onChange={e => setSimplify(e.target.checked)}
          />
        </Box>

        {(loadMessage || loadError) && (
          <Box className="box-4" pad="none">
            {loadMessage && <Text color="status-ok">{loadMessage}</Text>}
            {loadError && <Text color="status-critical">{loadError}</Text>}
          </Box>
        )}

        {showManualSource && (
          <Box className="box-5" pad="none">
            <Text>
              Automatic loading is blocked for some Ultimate Guitar pages. Paste the HTML response from your browser here to continue.
            </Text>
            <textarea
              id="manual-source"
              name="manual-source"
              rows={10}
              value={manualSource}
              onChange={e => setManualSource(e.target.value)}
            />
            <Button primary onClick={loadManualSource} label="LOAD PASTED HTML" />
          </Box>
        )}
      </div>

      <div className="sheet">
        <div className="artist">{artist}</div>
        <div className="song">{song}</div>
        <div className="chords" dangerouslySetInnerHTML={renderChords(transposedChords)}></div>
        <div className="artist">Editor</div>
        <div>
            <input value={artist} onChange={e => setArtist(e.target.value) } />
        </div>
        <div>
            <input value={song} onChange={e => setSong(e.target.value) } />
        </div>
        <textarea
          id = 'editarea'
          name='editarea'
          style={{ whiteSpace: 'pre' }}
          rows={20}
          cols={100}
          value={transposedChords}
          onChange={e => setTransposedChords(e.target.value.replaceAll("\n", "\r\n") /* took me like 3 friggin hours to debug this */ ) }
        />
      </div>
    </>
  );
}

export default App;
