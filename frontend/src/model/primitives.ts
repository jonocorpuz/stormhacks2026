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
      key: 'date',
      label: 'Date',
      block: 'text',
      required: false,
      description: 'Date the product was saved',
    },
  ],
}

export const RECEIPT: PrimitiveDef = {
  id: 'receipt',
  name: 'Receipt',
  fields: [
    {
      key: 'title',
      label: 'Title',
      block: 'text',
      required: false,
      description: 'Receipt title, usually the merchant, e.g. "Mcdonald’s Receipt"',
    },
    {
      key: 'items',
      label: 'Items',
      block: 'line_items',
      required: false,
      description: 'Purchased items, each with its name and pre-tax price as a number (e.g. 5 for $5.00)',
    },
    {
      key: 'taxRate',
      label: 'Tax Rate (%)',
      block: 'number',
      required: false,
      description: 'Combined sales tax rate as a percentage, e.g. 12 for 12%. Tax and total are calculated from this',
    },
    {
      key: 'date',
      label: 'Date',
      block: 'text',
      required: false,
      description: 'Purchase date',
    },
  ],
}

export const TICKET: PrimitiveDef = {
  id: 'ticket',
  name: 'Ticket',
  fields: [
    {
      key: 'vendor',
      label: 'Vendor',
      block: 'text',
      required: false,
      description: 'Ticket seller, e.g. Ticketmaster',
    },
    {
      key: 'title',
      label: 'Event',
      block: 'text',
      required: false,
      description: 'Event name, e.g. artist and tour',
    },
    {
      key: 'eventDate',
      label: 'Event Date',
      block: 'text',
      required: false,
      description: 'Date of the event, e.g. Oct 14, 2026',
    },
    {
      key: 'location',
      label: 'Location',
      block: 'text',
      required: false,
      description: 'Venue name',
    },
    {
      key: 'entryInfo',
      label: 'Entry Info',
      block: 'text',
      required: false,
      description: 'Entry instructions, e.g. gate or level',
    },
    {
      key: 'section',
      label: 'Section',
      block: 'text',
      required: false,
      description: 'Seating section',
    },
    {
      key: 'row',
      label: 'Row',
      block: 'text',
      required: false,
      description: 'Seating row',
    },
    {
      key: 'seat',
      label: 'Seat',
      block: 'text',
      required: false,
      description: 'Seat number',
    },
    {
      key: 'url',
      label: 'Ticket URL',
      block: 'text',
      required: false,
      description: 'Link to view the ticket',
    },
  ],
}

export const MUSIC_TRACK: PrimitiveDef = {
  id: 'music_track',
  name: 'Music Track',
  fields: [
    {
      key: 'title',
      label: 'Song',
      block: 'text',
      required: false,
      description: 'Song title, e.g. Brazil',
    },
    {
      key: 'artist',
      label: 'Artist',
      block: 'text',
      required: false,
      description: 'Artist or band name',
    },
    {
      key: 'url',
      label: 'Listen URL',
      block: 'text',
      required: false,
      description: 'Link to the song, e.g. on Spotify',
    },
    {
      key: 'date',
      label: 'Date',
      block: 'text',
      required: false,
      description: 'Date shown on the card, MM/DD/YYYY',
    },
  ],
}

export const PRIMITIVES: readonly PrimitiveDef[] = [NOTE, RECOMMENDATION_LIST, CODE_SNIPPET, MAP_LOCATION, PRODUCT, RECEIPT, TICKET, MUSIC_TRACK]

export function findPrimitive(id: string): PrimitiveDef | undefined {
  return PRIMITIVES.find((p) => p.id === id)
}

/** Throws on unknown id — that's a code bug, not user error. */
export function getPrimitive(id: string): PrimitiveDef {
  const def = findPrimitive(id)
  if (!def) throw new Error(`Unknown primitive: ${id}`)
  return def
}
