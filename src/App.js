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

// taken from YagoLopez
// https://gist.github.com/YagoLopez
// https://gist.github.com/YagoLopez/1c2fe87d255fc64d5f1bf6a920b67484
function findInObject(obj, key) {
  let objects = [];
  const keys = Object.keys(obj || {});

  for (let i = 0; i < keys.length; i += 1) {
    const _key = keys[i];
    if (Object.prototype.hasOwnProperty.call(obj, _key)) {
      if (typeof obj[_key] === 'object') {
        objects = [...objects, ...findInObject(obj[_key], key)];
      } else if (_key === key) {
        objects.push(obj[_key]);
      }
    }
  }

  return objects;
}

function App() {
  const [uri, setUri] = useState(
    'https://tabs.ultimate-guitar.com/tab/the-cranberries/dreams-chords-1485486'
  );

  const [chords, setChords] = useState("paste a ultimate-guitar.com link and press `Load Song`..\r\nExample song:\r\nCapo 3\r\n\r\n[Intro]\r\n| [ch]Bb[/ch]   | [ch]C/D[/ch]\r\n\r\n[Verse 1]\r\n[tab][ch]A[/ch]        [ch]C[/ch]\r\n  Example song lyrics line[/tab]\r\n");
  const [artist, setArtist] = useState('Example Artist');
  const [song, setSong] = useState('Example Song');

  const [parsingStyle, setParsingStyle] = useState(undefined);
  const [halftoneStyle, setHalftoneStyle] = useState('FLATS');
  const [simplify, setSimplify] = useState(false);

  const [transposeStep, setTransposeStep] = useState(0);
  const [transposedChords, setTransposedChords] = useState(chords);

  const renderChords = useCallback(() => formatChords(transposedChords), [transposedChords]);
  const downloadPdf = useCallback(() => {
    generatePDF(artist, song, transposedChords, uri)}, [
    artist,
    song,
    transposedChords,
    uri
  ]);

  const loadSong = useCallback(() => {
    fetch(`${corsURI}${uri}`)
      .then(res => res.text())
      .then(text => {
        const div = document.createElement('div');
        div.innerHTML = text;

        const [store] = div.getElementsByClassName('js-store');
        const storeJson = store.getAttribute('data-content');

        const storeData = JSON.parse(storeJson);

        const [parsedSongName] = findInObject(storeData, 'song_name');
        const [parsedArtistName] = findInObject(storeData, 'artist_name');
        const [parsedChords] = findInObject(storeData, 'content');

        setArtist(parsedArtistName);
        setSong(parsedSongName);
        setChords(parsedChords);
      });
  }, [uri]);

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
        <TextInput value={uri} onChange={e => setUri(e.target.value)} />

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
          <Button primary onClick={loadSong} label="LOAD SONG" />
          <Button primary onClick={downloadPdf} label="DOWNLOAD PDF" />
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
      </div>

      <div className="sheet">
        <div className="artist">{artist}</div>
        <div className="song">{song}</div>
        <div className="chords" dangerouslySetInnerHTML={renderChords(transposedChords)}></div>
        <div className="artist">Editor</div>
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
