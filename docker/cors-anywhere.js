const proxy = require('cors-anywhere');
const url = require('url');

const serverUrlRaw = process.env.CORS_SERVER || 'http://0.0.0.0:8080';
const serverUrl = url.parse(serverUrlRaw, true);
// Bind to all interfaces regardless of the hostname in CORS_SERVER: that value
// is also used as the browser-facing URL (e.g. "localhost"), which binding to
// inside the container would make unreachable via Docker's published port.
const bindHost = '0.0.0.0';

proxy
  .createServer({
    originWhitelist: [], // Allow all origins
    requireHeader: ['origin', 'x-requested-with'],
    removeHeaders: ['cookie', 'cookie2'],
    handleInitialRequest(req, res, location) {
      const target = location ? location.href : req.url;

      console.log(`[proxy] ${req.method} ${target}`);
      res.on('finish', () => {
        console.log(`[proxy] ${req.method} ${target} -> ${res.statusCode}`);
      });

      return false;
    }
  })
  .listen(serverUrl.port, bindHost, () => {
    console.log(`Running CORS Anywhere on ${bindHost}, with port ${serverUrl.port}`);
  });
