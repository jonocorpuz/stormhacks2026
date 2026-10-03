// Pure query helpers over items. Search/filter/sort live here, not in components.

import type { Item } from './item'

/** Case-insensitive substring match across an item's string field values. Empty query matches all. */
export function itemMatchesQuery(item: Item, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return Object.values(item.fields).some(
    (v) => typeof v === 'string' && v.toLowerCase().includes(q),
  )
}
