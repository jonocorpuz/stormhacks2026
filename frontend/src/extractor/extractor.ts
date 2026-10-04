// Extractor: turns a capture into item drafts. Interface only — concrete impl injected in main.jsx.

import type { Capture, ExtractionDraft, PrimitiveDef } from '../model'

export interface Extractor {
  /** Rejects with a user-facing message on failure. */
  extract(capture: Capture, primitives: readonly PrimitiveDef[]): Promise<ExtractionDraft[]>
}

/** Wire contract for POST /api/extract (shared with server/extract.js). */
export interface ExtractRequest {
  mimeType: string
  /** Base64, no data-URL prefix. */
  data: string
  /** Server builds prompt + schema from these; client never sends prompts. */
  primitiveIds: string[]
}

export type ExtractResponse = { ok: true; drafts: ExtractionDraft[] } | { ok: false; error: string }
