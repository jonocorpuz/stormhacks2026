// Capture: raw immutable input (screenshot, later pdf/text/url) that items are extracted from.
//
// TODO(capture): inactive. Captures are built and fed to the extractor, but NOT persisted —
// no board.captures, items keep captureId: null, source bytes discarded after extraction.
// Activating needs a storage decision (localStorage quota too small for images → IndexedDB/backend).

export type CaptureKind = 'image'

export interface Capture {
  id: string
  kind: CaptureKind
  /** Original filename, for status messages. */
  name: string | null
  mimeType: string
  /** Base64 bytes, no data-URL prefix. */
  data: string
  createdAt: number
}

export const CAPTURE_IMAGE_TYPES: readonly string[] = ['image/png', 'image/jpeg', 'image/webp']

/** Gemini inline-data limit. */
export const CAPTURE_MAX_BYTES = 20 * 1024 * 1024

export function createCapture(
  kind: CaptureKind,
  mimeType: string,
  data: string,
  name: string | null = null,
): Capture {
  return { id: crypto.randomUUID(), kind, name, mimeType, data, createdAt: Date.now() }
}

/** Why a capture can't be extracted, or null if it can. User-facing message. */
export function captureProblem(capture: Capture): string | null {
  if (!CAPTURE_IMAGE_TYPES.includes(capture.mimeType)) return 'Not supported (images only)'
  // base64 → bytes ≈ length * 3/4
  if ((capture.data.length * 3) / 4 > CAPTURE_MAX_BYTES) return 'Too large (max 20MB)'
  return null
}
