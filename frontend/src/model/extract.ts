// Extraction contract, derived from primitives: prompt + enforced JSON schema in,
// drafts out. Pure — the actual AI call lives behind the Extractor interface.
// Adding a primitive (with fields + descriptions) automatically widens what the AI can produce.

import { getBlock, type BlockId } from './blocks'
import type { FieldValues } from './item'
import { PRIMITIVES, type PrimitiveDef } from './primitives'

/** One item the AI wants created. Fields stored as-is; soft validation flags oddities on read. */
export interface ExtractionDraft {
  primitiveId: string
  fields: FieldValues
}

/** Primitives the AI may target. Ones with no fields have nothing to map onto. */
export function extractablePrimitives(primitives: readonly PrimitiveDef[] = PRIMITIVES): PrimitiveDef[] {
  return primitives.filter((p) => p.fields.length > 0)
}

/** JSON Schema per block = storage shape the AI must produce. */
const BLOCK_JSON_SCHEMA: Record<BlockId, Record<string, unknown>> = {
  text: { type: 'string' },
  longtext: { type: 'string' },
  // Entries: { id, title, isChecked } (see components/blocks/ListBlock). id added in parse.
  list: {
    type: 'array',
    items: {
      type: 'object',
      properties: { title: { type: 'string' }, isChecked: { type: 'boolean' } },
      required: ['title', 'isChecked'],
    },
  },
}

export function buildExtractionPrompt(primitives: readonly PrimitiveDef[]): string {
  const types = primitives
    .map((p) => {
      const fields = p.fields
        .map((f) => `  - ${f.key} (${f.label}, ${f.block})${f.description ? `: ${f.description}` : ''}`)
        .join('\n')
      return `- primitiveId "${p.id}" (${p.name}):\n${fields}`
    })
    .join('\n')

  return `You are given an image a user saved. Map it onto the known item types below.
Pick the single best-matching type, even if none fits well, and fill its fields from what is visible.
Return exactly one item. Only use the listed field keys. Omit fields you cannot fill — never guess or invent.
text = short single line; longtext = multi-line, preserve useful detail; list = one entry per line item.

Item types:
${types}`
}

/** JSON Schema (Gemini responseJsonSchema subset) for `{ items: [{ primitiveId, fields }] }`. */
export function buildExtractionSchema(primitives: readonly PrimitiveDef[]): Record<string, unknown> {
  const variants = primitives.map((p) => ({
    type: 'object',
    properties: {
      primitiveId: { type: 'string', enum: [p.id] },
      fields: {
        type: 'object',
        properties: Object.fromEntries(
          p.fields.map((f) => [
            f.key,
            { ...BLOCK_JSON_SCHEMA[f.block], description: f.description ?? f.label },
          ]),
        ),
        additionalProperties: false,
      },
    },
    required: ['primitiveId', 'fields'],
  }))

  return {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: variants.length === 1 ? variants[0] : { anyOf: variants },
      },
    },
    required: ['items'],
  }
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

/** List entries need ids for the UI; AI doesn't produce them. */
const withId = (entry: unknown) =>
  isRecord(entry) && typeof entry.id !== 'string' ? { id: crypto.randomUUID(), ...entry } : entry

/**
 * Turn raw AI output into drafts. Throws on malformed shape or unknown primitiveId
 * (schema-enforced, so that's a bug). Empty values omitted; everything else kept as-is.
 */
export function parseExtraction(raw: unknown, primitives: readonly PrimitiveDef[]): ExtractionDraft[] {
  if (!isRecord(raw) || !Array.isArray(raw.items)) throw new Error('Extraction: expected { items: [] }')

  return raw.items.map((entry) => {
    if (!isRecord(entry) || typeof entry.primitiveId !== 'string' || !isRecord(entry.fields)) {
      throw new Error('Extraction: malformed item')
    }
    const def = primitives.find((p) => p.id === entry.primitiveId)
    if (!def) throw new Error(`Extraction: unknown primitive ${entry.primitiveId}`)

    const fields: FieldValues = {}
    for (const [key, value] of Object.entries(entry.fields)) {
      const field = def.fields.find((f) => f.key === key)
      const empty = field
        ? getBlock(field.block).isEmpty(value)
        : value === null || value === undefined || value === ''
      if (empty) continue
      fields[key] = field?.block === 'list' && Array.isArray(value) ? value.map(withId) : value
    }
    return { primitiveId: def.id, fields }
  })
}
