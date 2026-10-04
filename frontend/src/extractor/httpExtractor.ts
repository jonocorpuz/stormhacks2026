// Calls the dev-server proxy (vite.config.js → server/extract.js → Gemini). Key stays server-side.

import type { Capture, ExtractionDraft, PrimitiveDef } from '../model'
import type { ExtractRequest, ExtractResponse, Extractor } from './extractor'

export class HttpExtractor implements Extractor {
  constructor(private readonly url = '/api/extract') {}

  async extract(capture: Capture, primitives: readonly PrimitiveDef[]): Promise<ExtractionDraft[]> {
    const body: ExtractRequest = {
      mimeType: capture.mimeType,
      data: capture.data,
      primitiveIds: primitives.map((p) => p.id),
    }
    const res = await fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    let payload: ExtractResponse
    try {
      payload = await res.json()
    } catch {
      throw new Error(`Extraction failed (HTTP ${res.status})`)
    }
    if (!payload.ok) throw new Error(payload.error)
    return payload.drafts
  }
}
