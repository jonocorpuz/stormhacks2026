// Item: instance of a primitive. Values stored bare, keyed by field key.

import { getPrimitive } from './primitives'

export type FieldValues = Record<string, unknown>

export interface Item {
  id: string
  primitiveId: string
  fields: FieldValues
  captureId: string | null
  createdAt: number
  updatedAt: number
}

export function createItem(
  primitiveId: string,
  fields: FieldValues = {},
  captureId: string | null = null,
): Item {
  getPrimitive(primitiveId) // throws on unknown primitive
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    primitiveId,
    fields: { ...fields },
    captureId,
    createdAt: now,
    updatedAt: now,
  }
}

/** Shallow-merge patch into fields. A key set to undefined is removed. */
export function updateItemFields(item: Item, patch: FieldValues): Item {
  const fields = { ...item.fields }
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) delete fields[key]
    else fields[key] = value
  }
  return { ...item, fields, updatedAt: Date.now() }
}
