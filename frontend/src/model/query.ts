// Pure query helpers over items. Search/filter/sort live here, not in components.

import type { Item } from './item'

/** True if any string/number inside v (arrays + objects too) contains q. Skips entry ids (UUIDs). */
function valueMatches(v: unknown, q: string): boolean {
  if (typeof v === 'string') return v.toLowerCase().includes(q)
  if (typeof v === 'number') return String(v).includes(q)
  if (Array.isArray(v)) return v.some((x) => valueMatches(x, q))
  if (typeof v === 'object' && v !== null) {
    return Object.entries(v).some(([k, x]) => k !== 'id' && valueMatches(x, q))
  }
  return false
}

/**
 * Case-insensitive substring match across an item's field values, incl. nested ones
 * (checklist entries, receipt line items) and numbers. Empty query matches all.
 */
export function itemMatchesQuery(item: Item, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return Object.values(item.fields).some((v) => valueMatches(v, q))
}
