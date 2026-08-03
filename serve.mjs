// Minimal static server for previewing dist/ locally.
// Mirrors the Cloudflare "auto-trailing-slash" html_handling behaviour so local
// preview matches production: /docs/foo is served from dist/docs/foo.html.
//
//   node serve.mjs [port]

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist');
const PORT = Number(process.argv[2] || 8787);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

const send = (res, code, body, type) => {
  res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(body);
};

http
  .createServer((req, res) => {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);
    const rel = path.normalize(url).replace(/^([/\\])+/, '');
    const base = path.join(DIST, rel);

    const candidates = [
      url.endsWith('/') ? path.join(base, 'index.html') : base,
      base + '.html',
      path.join(base, 'index.html'),
    ];

    for (const file of candidates) {
      if (!file.startsWith(DIST)) continue;
      if (fs.existsSync(file) && fs.statSync(file).isFile()) {
        return send(res, 200, fs.readFileSync(file), TYPES[path.extname(file)] || 'application/octet-stream');
      }
    }

    const notFound = path.join(DIST, '404.html');
    if (fs.existsSync(notFound)) return send(res, 404, fs.readFileSync(notFound), TYPES['.html']);
    send(res, 404, 'Not found', TYPES['.txt']);
  })
  .listen(PORT, () => console.log(`  preview: http://localhost:${PORT}`));
