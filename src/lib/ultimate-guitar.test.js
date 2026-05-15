import { parseUltimateGuitarHtml } from './ultimate-guitar';

describe('parseUltimateGuitarHtml', () => {
  test('extracts song data from the js-store payload', () => {
    const html = `
      <html>
        <body>
          <div
            class="js-store"
            data-content='{"store":{"page":{"data":{"tab_view":{"meta":{"song_name":"Dreams","artist_name":"The Cranberries","content":"[ch]G[/ch] hello"}}}}}}'
          ></div>
        </body>
      </html>
    `;

    expect(parseUltimateGuitarHtml(html)).toEqual({
      song: 'Dreams',
      artist: 'The Cranberries',
      chords: '[ch]G[/ch] hello'
    });
  });

  test('raises a clear error for the Cloudflare challenge page', () => {
    const html = `
      <html>
        <head>
          <title>Just a moment...</title>
          <meta http-equiv="refresh" content="360" />
        </head>
        <body>
          <script src="/cdn-cgi/challenge-platform/h/b/orchestrate/chl_page/v1"></script>
        </body>
      </html>
    `;

    expect(() => parseUltimateGuitarHtml(html)).toThrow(
      /Cloudflare challenge/
    );
  });
});
