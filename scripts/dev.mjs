/**
 * Локальный dev: статика + /api/send-telegram (читает .env.local)
 * Запуск: node scripts/dev.mjs
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function loadEnv() {
  const envPath = path.join(root, '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const m = trimmed.match(/^([A-Z_]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2].trim();
  }
}

loadEnv();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

async function handleApi(body) {
  const mod = await import('../api/send-telegram.js');
  const req = { method: 'POST', body };
  let status = 200;
  let json = {};
  const res = {
    setHeader: () => {},
    status(c) {
      status = c;
      return res;
    },
    json(d) {
      json = d;
    },
    end() {},
  };
  await (mod.default || mod)(req, res);
  return { status, json };
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS' && req.url?.startsWith('/api/')) {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  if (req.method === 'POST' && req.url === '/api/send-telegram') {
    let body = '';
    for await (const chunk of req) body += chunk;
    try {
      const parsed = JSON.parse(body);
      const { status, json } = await handleApi(parsed);
      res.writeHead(status, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(json));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: false, error: e.message }));
    }
  }

  let filePath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  filePath = path.join(root, filePath.replace(/^\//, ''));
  if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    return res.end('Not found');
  }
  const ext = path.extname(filePath);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

const port = 3456;
server.listen(port, () => console.log(`Dev: http://localhost:${port}`));
