// Receipt math: derived on read from line items + tax rate, never stored.

import type { LineItem } from './blocks'

export interface ReceiptTotals {
  subtotal: number
  tax: number
  total: number
}

const toCents = (n: number) => Math.round(n * 100) / 100

/**
 * Subtotal of item prices, tax at `taxRatePercent` (e.g. 12 = 12%), and their sum.
 * Ignores malformed entries and non-numeric rates rather than throwing (validation is soft).
 */
export function receiptTotals(items: unknown, taxRatePercent: unknown): ReceiptTotals {
  const prices = Array.isArray(items)
    ? items.map((i) => (i as LineItem)?.price).filter((p): p is number => typeof p === 'number' && Number.isFinite(p))
    : []
  const rate = typeof taxRatePercent === 'number' && Number.isFinite(taxRatePercent) ? taxRatePercent : 0
  const subtotal = toCents(prices.reduce((sum, p) => sum + p, 0))
  const tax = toCents((subtotal * rate) / 100)
  return { subtotal, tax, total: toCents(subtotal + tax) }
}
