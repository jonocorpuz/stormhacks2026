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

export const MAP_LOCATION: PrimitiveDef = {
  id: 'map_location',
  name: 'Map',
  fields: [
    {
      key: 'title',
      label: 'Place',
      block: 'text',
      required: false,
      description: 'Name of the place, e.g. a store or venue',
    },
    {
      key: 'address',
      label: 'Address',
      block: 'text',
      required: false,
      description: 'Street address used to locate the place on the map',
    },
    {
      key: 'date',
      label: 'Date',
      block: 'text',
      required: false,
      description: 'Date the place was saved',
    },
  ],
}

export const PRODUCT: PrimitiveDef = {
  id: 'product',
  name: 'Product',
  fields: [
    {
      key: 'title',
      label: 'Name',
      block: 'text',
      required: false,
      description: 'Product name',
    },
    {
      key: 'description',
      label: 'Description',
      block: 'text',
      required: false,
      description: 'Short product description, e.g. model number and variant',
    },
    {
      key: 'price',
      label: 'Price',
      block: 'text',
      required: false,
      description: 'Listed price including currency symbol',
    },
    {
      key: 'brand',
      label: 'Brand',
      block: 'text',
      required: false,
      description: 'Brand or manufacturer',
    },
    {
      key: 'model',
      label: 'Model',
      block: 'text',
      required: false,
      description: 'Model name',
    },
    {
      key: 'url',
      label: 'Listing URL',
      block: 'text',
      required: false,
      description: 'Link to the product listing page',
    },
    {
      key: 'imageUrl',
      label: 'Image URL',
      block: 'text',
      required: false,
      description: 'Link to a product photo',
    },
    {
      key: 'date',
      label: 'Date',
      block: 'text',
      required: false,
      description: 'Date the product was saved',
    },
  ],
}

export const PRIMITIVES: readonly PrimitiveDef[] = [NOTE, RECOMMENDATION_LIST, CODE_SNIPPET, MAP_LOCATION, PRODUCT]

export function findPrimitive(id: string): PrimitiveDef | undefined {
  return PRIMITIVES.find((p) => p.id === id)
}

/** Throws on unknown id — that's a code bug, not user error. */
export function getPrimitive(id: string): PrimitiveDef {
  const def = findPrimitive(id)
  if (!def) throw new Error(`Unknown primitive: ${id}`)
  return def
}
