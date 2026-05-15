const proxy = require('cors-anywhere');
const url = require('url');

const serverUrlRaw = process.env.CORS_SERVER || 'http://0.0.0.0:8080';
const serverUrl = url.parse(serverUrlRaw, true);

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
  .listen(serverUrl.port, serverUrl.hostname, () => {
    console.log(`Running CORS Anywhere on ${serverUrl.hostname}, with port ${serverUrl.port}`);
  });
