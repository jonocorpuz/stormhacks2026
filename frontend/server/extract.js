// Thin Gemini proxy. Holds no type knowledge: prompt + schema come from src/model,
// so new primitives flow through automatically. Request/response shape: src/extractor/extractor.ts.

import { z } from 'zod';
import {
  CAPTURE_IMAGE_TYPES,
  buildExtractionPrompt,
  buildExtractionSchema,
  extractablePrimitives,
  parseExtraction,
} from '../src/model/index.ts';

const GEMINI_MODEL = 'gemini-3.6-flash'; // 3.8-flash 503'd (overloaded) 2026-10-03; retry later
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Overload / rate-limit / transient errors: retry with backoff (1s, 2s, 4s).
const RETRY_STATUSES = new Set([429, 500, 503]);
const RETRY_DELAYS_MS = [1000, 2000, 4000];

async function fetchWithRetry(url, init) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, init);
    if (res.ok || !RETRY_STATUSES.has(res.status) || attempt >= RETRY_DELAYS_MS.length) return res;
    console.warn(`[extract] Gemini ${res.status}, retry ${attempt + 1}/${RETRY_DELAYS_MS.length}`);
    await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
  }
}

const RequestSchema = z
  .object({
    mimeType: z.string().refine((t) => CAPTURE_IMAGE_TYPES.includes(t), 'Unsupported image type'),
    data: z.string().min(1),
    primitiveIds: z.array(z.string()).min(1),
  })
  .strict();

/** Returns ExtractResponse: { ok: true, drafts } | { ok: false, error }. */
export async function extract(body, env) {
  const req = RequestSchema.safeParse(body);
  if (!req.success) return { ok: false, error: `Invalid request: ${req.error.issues[0]?.message}` };

  if (!env.GEMINI_API_KEY) return { ok: false, error: 'GEMINI_API_KEY not set (frontend/.env)' };

  const primitives = extractablePrimitives().filter((p) => req.data.primitiveIds.includes(p.id));
  if (primitives.length === 0) return { ok: false, error: 'No extractable primitives requested' };

  const res = await fetchWithRetry(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { inline_data: { mime_type: req.data.mimeType, data: req.data.data } },
            { text: buildExtractionPrompt(primitives) },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseJsonSchema: buildExtractionSchema(primitives),
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error('[extract] Gemini error', res.status, detail);
    return { ok: false, error: `Gemini HTTP ${res.status}` };
  }

  // Thinking models may emit thought parts; answer = remaining text parts.
  const parts = (await res.json()).candidates?.[0]?.content?.parts ?? [];
  const text = parts.filter((p) => p.text && !p.thought).map((p) => p.text).join('');
  try {
    return { ok: true, drafts: parseExtraction(JSON.parse(text), primitives) };
  } catch (err) {
    console.error('[extract] bad Gemini output', text);
    return { ok: false, error: err instanceof SyntaxError ? 'Gemini returned non-JSON' : err.message };
  }
}
