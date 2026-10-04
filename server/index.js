// Production server (Render, single web service): built frontend + /api/extract.
// Dev doesn't use this — Vite middleware (frontend/vite.config.js) calls the same extract().
// Run via tsx so extract.js can import the TS model from frontend/src/model.

import express from 'express';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extract } from './extract.js';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '../frontend/dist');
const PORT = process.env.PORT ?? 3000;

const app = express();

// Base64 images: 20MB limit → ~27MB encoded.
app.post('/api/extract', express.json({ limit: '30mb' }), async (req, res) => {
  try {
    const result = await extract(req.body, process.env);
    res.status(result.ok ? 200 : 502).json(result);
  } catch (err) {
    console.error('[api/extract] crashed', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/healthz', (_req, res) => res.send('ok'));

if (existsSync(DIST)) {
  app.use(express.static(DIST));
  // SPA fallback: any other GET → index.html
  app.use((req, res, next) => (req.method === 'GET' ? res.sendFile(join(DIST, 'index.html')) : next()));
} else {
  console.warn(`[server] ${DIST} missing — run \`npm --prefix frontend run build\`. Serving API only.`);
}

app.listen(PORT, () => console.log(`[server] listening on :${PORT}`));
