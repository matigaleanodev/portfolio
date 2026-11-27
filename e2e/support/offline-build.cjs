// Precarga para compilar y prerenderizar sin salida de red:
//   NODE_OPTIONS="--require=$PWD/e2e/support/offline-build.cjs" npm run build
// Responde la hoja de Google Fonts que Angular incrusta con una copia versionada y
// rechaza cualquier otra conexión que no sea local. Con PORTFOLIO_NETWORK_LOG se
// registran los destinos rechazados.
const fs = require('node:fs');
const https = require('node:https');
const net = require('node:net');
const path = require('node:path');
const { Readable } = require('node:stream');

const stylesheet = path.join(__dirname, '..', 'fixtures', 'google-fonts.css');
const localHosts = new Set(['localhost', '127.0.0.1', '::1']);

const httpsGet = https.get;
https.get = function (input, options, callback) {
  const url = new URL(input);
  const families = url.searchParams.getAll('family');
  const isFontSheet =
    url.hostname === 'fonts.googleapis.com' &&
    families.length > 0 &&
    families.every((family) => /^IBM Plex (Mono|Sans):/.test(family));
  if (!isFontSheet) return httpsGet.apply(this, arguments);

  const response = Readable.from([fs.readFileSync(stylesheet, 'utf8')]);
  response.statusCode = 200;
  const done = typeof options === 'function' ? options : callback;
  queueMicrotask(() => done(response));
  return response;
};

const connect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  // Node puede entregar los argumentos ya normalizados en un arreglo.
  const [first, second] = Array.isArray(args[0]) ? args[0] : args;
  const options =
    typeof first === 'object' ? first : { port: first, host: second, path: undefined };
  const host = typeof options.host === 'string' ? options.host : 'localhost';
  if (options.path || localHosts.has(host)) return connect.apply(this, args);

  const target = `${host}:${options.port}`;
  if (process.env.PORTFOLIO_NETWORK_LOG) {
    fs.appendFileSync(process.env.PORTFOLIO_NETWORK_LOG, `${target}\n`);
  }
  process.nextTick(() => this.destroy(new Error(`Conexión bloqueada sin red: ${target}`)));
  return this;
};
