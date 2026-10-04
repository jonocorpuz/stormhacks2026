// Thin Gemini proxy. Holds no type knowledge: prompt + schema come from frontend/src/model,
// so new primitives flow through automatically. Request/response shape: frontend/src/extractor/extractor.ts.
// Shared by Express (server/index.js, prod) and Vite dev middleware (frontend/vite.config.js).
// No deps on purpose: Vite loads this from frontend/, where server/node_modules isn't resolvable.

import {
  CAPTURE_IMAGE_TYPES,
  buildExtractionPrompt,
  buildExtractionSchema,
  buildMockExtraction,
  extractablePrimitives,
  parseExtraction,
} from '../frontend/src/model/index.ts';

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

/** Error message for a bad ExtractRequest, or null. */
function requestProblem(body) {
  if (typeof body !== 'object' || body === null) return 'expected JSON object';
  if (!CAPTURE_IMAGE_TYPES.includes(body.mimeType)) return 'Unsupported image type';
  if (typeof body.data !== 'string' || !body.data) return 'missing image data';
  if (!Array.isArray(body.primitiveIds) || !body.primitiveIds.length) return 'missing primitiveIds';
  return null;
}

/** Returns ExtractResponse: { ok: true, drafts } | { ok: false, error }. */
export async function extract(body, env) {
  const problem = requestProblem(body);
  if (problem) return { ok: false, error: `Invalid request: ${problem}` };

  const primitives = extractablePrimitives().filter((p) => body.primitiveIds.includes(p.id));
  if (primitives.length === 0) return { ok: false, error: 'No extractable primitives requested' };

  // Offline fallback: no key or MOCK_LLM_RESPONSES=true → placeholder draft, no network.
  if (!env.GEMINI_API_KEY || env.MOCK_LLM_RESPONSES === 'true') {
    console.warn('[extract] mock response (no GEMINI_API_KEY or MOCK_LLM_RESPONSES=true)');
    return { ok: true, drafts: buildMockExtraction(primitives) };
  }

  let res;
  try {
    res = await fetchWithRetry(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inlineData: { mimeType: body.mimeType, data: body.data } },
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
  } catch (err) {
    // Network down (offline, DNS) → fall back instead of crashing the request.
    console.warn('[extract] Gemini unreachable, mock response:', err.message);
    return { ok: true, drafts: buildMockExtraction(primitives) };
  }

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
