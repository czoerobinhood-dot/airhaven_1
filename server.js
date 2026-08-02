#!/usr/bin/env node
/*
 * Zero-dependency static file server for the storefront demo.
 *
 *   node server.js                  -> http://0.0.0.0:8080
 *   node server.js --port 3000
 *   node server.js --port 3000 --host 127.0.0.1
 *   PORT=3000 HOST=127.0.0.1 node server.js
 *
 * Serves this directory as-is. Nothing is built, bundled or written to disk,
 * so the same files also work when opened directly over file://.
 */
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const ROOT = __dirname;
const argv = process.argv.slice(2);

function readArg(name, fallback) {
  const flag = `--${name}`;
  const index = argv.indexOf(flag);
  if (index !== -1 && argv[index + 1] && !argv[index + 1].startsWith('--')) return argv[index + 1];
  const inline = argv.find(item => item.startsWith(`${flag}=`));
  if (inline) return inline.slice(flag.length + 1);
  return fallback;
}

const PORT = Number(readArg('port', process.env.PORT || 8080));
const HOST = readArg('host', process.env.HOST || '0.0.0.0');

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  console.error(`Invalid port: ${readArg('port', process.env.PORT || 8080)}`);
  process.exit(1);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8'
};

// Resolve a request path inside ROOT, refusing anything that escapes it.
function resolveWithinRoot(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (decoded.includes('\0')) return null;

  const resolved = path.resolve(ROOT, `.${path.posix.normalize(decoded)}`);
  if (resolved !== ROOT && !resolved.startsWith(ROOT + path.sep)) return null;
  return resolved;
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Length': Buffer.byteLength(body), ...headers });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return send(res, 405, 'Method Not Allowed', { 'Content-Type': MIME['.txt'], Allow: 'GET, HEAD' });
  }

  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let filePath = resolveWithinRoot(requestUrl.pathname);
  if (!filePath) return send(res, 403, 'Forbidden', { 'Content-Type': MIME['.txt'] });

  try {
    let stats = await fsp.stat(filePath);
    if (stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
      stats = await fsp.stat(filePath);
    }

    const headers = {
      'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Content-Length': stats.size,
      // The demo is edited live; never let a stale copy stick around.
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    };

    res.writeHead(200, headers);
    if (req.method === 'HEAD') return res.end();

    const stream = fs.createReadStream(filePath);
    stream.on('error', () => res.destroy());
    stream.pipe(res);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      return send(res, 404, `Not found: ${requestUrl.pathname}`, { 'Content-Type': MIME['.txt'] });
    }
    console.error(error);
    return send(res, 500, 'Internal Server Error', { 'Content-Type': MIME['.txt'] });
  }
});

server.on('error', error => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Try: node server.js --port ${PORT + 1}`);
    process.exit(1);
  }
  throw error;
});

server.listen(PORT, HOST, () => {
  console.log(`Serving ${ROOT}`);
  console.log(`  http://localhost:${PORT}`);
  if (HOST === '0.0.0.0' || HOST === '::') {
    for (const entries of Object.values(os.networkInterfaces())) {
      for (const entry of entries || []) {
        if (entry.family === 'IPv4' && !entry.internal) console.log(`  http://${entry.address}:${PORT}  (LAN)`);
      }
    }
  }
  console.log('Press Ctrl+C to stop.');
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
