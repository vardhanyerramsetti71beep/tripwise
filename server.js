// Minimal static file server with security headers. No dependencies.
// Usage: node server.js  (PORT env var, default 8080)

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)));

const MIME = Object.freeze({
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
});

export const SECURITY_HEADERS = Object.freeze({
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self' https://api.open-meteo.com; base-uri 'none'; form-action 'none'; object-src 'none'; frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
});

/** Only these top-level paths are served, so tests, docs and dotfiles stay private. */
const PUBLIC = ['index.html', 'styles.css', 'src'];

/**
 * Maps a URL path to an absolute file path inside ROOT, or null if the
 * request is not allowed (traversal attempts, hidden or non-public files).
 */
export function resolveSafePath(urlPath, root = ROOT) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath.split('?')[0]);
  } catch {
    return null;
  }
  if (decoded.includes('\0')) return null;
  const relative = normalize(decoded === '/' ? '/index.html' : decoded).replace(/^[/\\]+/, '');
  const parts = relative.split(/[/\\]/);
  if (parts.some((p) => p === '..' || p.startsWith('.'))) return null;
  if (!PUBLIC.includes(parts[0])) return null;
  if (!MIME[extname(relative)]) return null;
  const full = resolve(join(root, relative));
  return full.startsWith(root + sep) ? full : null;
}

export function createApp(root = ROOT) {
  return createServer(async (req, res) => {
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.setHeader(k, v);
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    const file = resolveSafePath(req.url ?? '/', root);
    if (!file) {
      res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
      return;
    }
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'Content-Type': MIME[extname(file)], 'Cache-Control': 'no-cache' });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 8080;
  createApp().listen(port, () => console.log(`TripWise running at http://localhost:${port}`));
}
