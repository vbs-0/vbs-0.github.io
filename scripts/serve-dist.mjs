#!/usr/bin/env node
/**
 * Serves dist/ with the Node standard library. Used by the browser tests instead of `astro preview`,
 * so the test job starts a server that cannot wait on a build or a framework.
 *   node scripts/serve-dist.mjs [port]
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve('dist');
const port = Number(process.argv[2] ?? 4322);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.webmanifest': 'application/manifest+json',
};

function fileFor(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  // Drop leading slashes, then refuse anything that tries to climb out of dist.
  const rel = normalize(decoded).replace(/^[/]+/, '');
  if (rel.startsWith('..')) return join(root, '404.html');
  let file = join(root, rel);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file) && existsSync(`${file}.html`)) file = `${file}.html`;
  return file;
}

createServer((req, res) => {
  const file = fileFor(req.url ?? '/');
  const ok = existsSync(file) && statSync(file).isFile();
  const target = ok ? file : join(root, '404.html');
  res.writeHead(ok ? 200 : 404, { 'content-type': types[extname(target)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
  createReadStream(target).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`serving dist on http://127.0.0.1:${port}`));
