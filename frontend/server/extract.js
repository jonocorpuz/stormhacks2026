import { WidgetPayloadSchema } from '../src/types/api.ts';

const GEMINI_MODEL = 'gemini-3.8-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const PROMPT = `You are given a screenshot. Classify it as exactly ONE of the widget types below and extract its data.
Respond with a single JSON object only, using exactly these keys (no extra keys). Use null where a nullable value is not visible.

1. Product / shopping page:
{"type":"consumer_links","title":string,"price":string,"brand":string,"rating":string|null,"reviews":string|null,"previewUrl":string|null,"embedCode":string|null}

2. Source code:
{"type":"code_viewer","title":string,"code":string,"viewUrl":string|null}

3. Receipt / order / invoice:
{"type":"receipt","title":string,"date":string,"total":string,"tax":string|null,"items":[{"name":string,"price":string}]}

4. Map / place / address:
{"type":"location_pin","title":string,"location":string,"directionsAvailable":boolean}`;

const MOCK_WIDGET = {
  type: 'receipt',
  title: 'Mock Coffee Co.',
  date: '2026-10-03',
  total: '$9.45',
  tax: '$0.45',
  items: [
    { name: 'Oat Latte', price: '$5.50' },
    { name: 'Croissant', price: '$3.50' },
  ],
};

export async function extractWidget({ image, mimeType }, env) {
  if (env.MOCK_LLM_RESPONSES === 'true' || !env.GEMINI_API_KEY) {
    return { ok: true, mock: true, data: MOCK_WIDGET };
  }

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ inline_data: { mime_type: mimeType, data: image } }, { text: PROMPT }],
        },
      ],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });

  if (!res.ok) {
    return { ok: false, error: `Gemini HTTP ${res.status}`, raw: await res.text() };
  }

  const body = await res.json();
  const text = body.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Gemini returned non-JSON', raw: text };
  }

  const parsed = WidgetPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return { ok: false, error: 'Schema validation failed', issues: parsed.error.issues, raw: json };
  }
  return { ok: true, data: parsed.data };
}
