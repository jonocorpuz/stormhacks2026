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

export const RECOMMENDATION_LIST: PrimitiveDef = {
  id: 'recommendation_list',
  name: 'Recommendations',
  fields: [
    {
      key: 'title',
      label: 'Title',
      block: 'text',
      required: false,
      description: 'List title',
    },
    {
      key: 'date',
      label: 'Date',
      block: 'text',
      required: false,
      description: 'Date or subtitle',
    },
    {
      key: 'items',
      label: 'Items',
      block: 'list',
      required: false,
      description: 'List items',
    },
  ],
}

export const CODE_SNIPPET: PrimitiveDef = {
  id: 'code_snippet',
  name: 'Code Snippet',
  fields: [
    {
      key: 'title',
      label: 'Title',
      block: 'text',
      required: false,
      description: 'Title of the snippet',
    },
    {
      key: 'language',
      label: 'Language',
      block: 'text',
      required: false,
      description: 'Programming language',
    },
    {
      key: 'code',
      label: 'Code',
      block: 'longtext',
      required: false,
      description: 'The code snippet',
    },
    {
      key: 'date',
      label: 'Date',
      block: 'text',
      required: false,
      description: 'Date or subtitle',
    },
  ],
}

export const PRIMITIVES: readonly PrimitiveDef[] = [NOTE, RECOMMENDATION_LIST, CODE_SNIPPET]

export function findPrimitive(id: string): PrimitiveDef | undefined {
  return PRIMITIVES.find((p) => p.id === id)
}

/** Throws on unknown id — that's a code bug, not user error. */
export function getPrimitive(id: string): PrimitiveDef {
  const def = findPrimitive(id)
  if (!def) throw new Error(`Unknown primitive: ${id}`)
  return def
}
