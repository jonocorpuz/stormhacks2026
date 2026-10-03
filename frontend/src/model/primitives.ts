// Primitives: semantic types built only from blocks (flat, no nesting).
// Static, global data. Field keys must stay stable once shipped.

import type { BlockId } from './blocks'

export interface FieldDef {
  /** Identity: what items store the value under. */
  key: string
  /** Human name of the meaning (forms, column headers). */
  label: string
  /** Storage shape + validation. */
  block: BlockId
  /** Flagged (not blocked) when missing. */
  required: boolean
  /** Semantics, for AI mapping. */
  description?: string
}

export interface PrimitiveDef {
  id: string
  name: string
  fields: FieldDef[]
}

export const NOTE: PrimitiveDef = {
  id: 'note',
  name: 'Note',
  fields: [
    {
      key: 'title',
      label: 'Title',
      block: 'text',
      required: false,
      description: 'Short headline summarizing the note',
    },
    {
      key: 'body',
      label: 'Body',
      block: 'longtext',
      required: false,
      description: 'Free-form content of the note',
    },
  ],
}

export const PRIMITIVES: readonly PrimitiveDef[] = [NOTE]

export function findPrimitive(id: string): PrimitiveDef | undefined {
  return PRIMITIVES.find((p) => p.id === id)
}

/** Throws on unknown id — that's a code bug, not user error. */
export function getPrimitive(id: string): PrimitiveDef {
  const def = findPrimitive(id)
  if (!def) throw new Error(`Unknown primitive: ${id}`)
  return def
}
