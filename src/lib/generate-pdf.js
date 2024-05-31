import pdfMake from 'pdfmake/build/pdfmake';
import vfsFonts from './vfs_fonts';

pdfMake.vfs = vfsFonts.pdfMake.vfs;

pdfMake.fonts = {
  'Roboto Mono': {
    normal: 'RobotoMono-Regular.ttf',
    bold: 'RobotoMono-Bold.ttf',
  },
};

const isOdd = i => i % 2 === 1;

function processChords(chords) {
  let formattedChords = chords;
  
  formattedChords = formattedChords.replace(/\[tab\]/g, '');
  formattedChords = formattedChords.replace(/\[\/tab\]/g, '');

  let processedChords = formattedChords.split(/\n/g).map(w => w.split(/\[ch\]|\[\/ch\]/g));

  for (let i = 0; i < processedChords.length; i += 1) {
    const processedChord = processedChords[i];
    
    if (processedChord.length === 1) {
      processedChords[i] = processedChord[0];
    } else {
      for (let j = 0; j < processedChord.length; j += 1) {
        const chord = processedChord[j];
        
        if (isOdd(j)) {
          processedChord[j] = { text: chord, bold: true };
        }
      }

      processedChords[i] = {
        text: processedChord
      };
    }
  }

  return processedChords;
}

export default (artist, song, chords, url, fileName) => {

//  const artistSongClassic = [
//    { text: artist, style: 'artist' },
//    { text: song, style: 'song' }
//  ];
  const songFirst = [
    { text: song, style: 'artist' },
    { text: artist, style: 'song' },
  ];
//  const artistSongUrlLessSpace = [
//    { text: song + ' (' + artist +')', style: 'song' },
//  ];

  const docDefinition = {
    pageSize: 'A4',

    content: [
      {
        columns: [
          {
            width: 'auto',
            stack: [
              {
                qr: url, fit: '45', margin: [ 0, 0, 10, 0 ]
              }
            ]
          },
          {
            width: '*',
            stack: songFirst
          }
        ]
      },
      ' ',
      ...processChords(chords)
    ],

    defaultStyle: {
      font: 'Roboto Mono',
      fontSize: 8,
      preserveLeadingSpaces: true
    },

    styles: {
      artist: {
        fontSize: 12,
        bold: true
      },
      song: {
        fontSize: 10
      }
    },

    pageBreakBefore: (currentNode, followingNodesOnPage, nodesOnNextPage, previousNodesOnPage) => {
      const isLastOnPage = followingNodesOnPage.length === 0;
      const isNotLastOfAll = nodesOnNextPage.length !== 0;

      return isLastOnPage && isNotLastOfAll && Array.isArray(currentNode.text);
    }
  };

  pdfMake.createPdf(docDefinition).download(fileName);
};