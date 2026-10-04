import { describe, expect, it } from 'vitest'
import { BLOCKS, buildExtractionSchema, parseExtraction, receiptTotals, type PrimitiveDef } from '.'

describe('receiptTotals', () => {
  const items = [
    { id: 'a', name: 'Hamburger', price: 5 },
    { id: 'b', name: 'Sm Coca Cola', price: 10 },
    { id: 'c', name: 'L Fries', price: 2.99 },
  ]

  it('sums prices and adds tax as a percentage', () => {
    expect(receiptTotals(items, 12)).toEqual({ subtotal: 17.99, tax: 2.16, total: 20.15 })
  })

  it('no rate means no tax', () => {
    expect(receiptTotals(items, undefined)).toEqual({ subtotal: 17.99, tax: 0, total: 17.99 })
  })

  it('ignores malformed items and rates instead of throwing', () => {
    expect(receiptTotals([...items, { name: 'Free' }, null, 'x'], '12')).toEqual({ subtotal: 17.99, tax: 0, total: 17.99 })
    expect(receiptTotals('not an array', 5)).toEqual({ subtotal: 0, tax: 0, total: 0 })
  })
})

describe('number + line_items blocks', () => {
  it('number accepts finite numbers only', () => {
    expect(BLOCKS.number.isValid(12)).toBe(true)
    expect(BLOCKS.number.isValid('12')).toBe(false)
    expect(BLOCKS.number.isValid(NaN)).toBe(false)
    expect(BLOCKS.number.isEmpty(0)).toBe(false)
    expect(BLOCKS.number.isEmpty(undefined)).toBe(true)
  })

  it('line_items needs name + numeric price on every entry', () => {
    expect(BLOCKS.line_items.isValid([{ id: '1', name: 'Fries', price: 5 }])).toBe(true)
    expect(BLOCKS.line_items.isValid([{ id: '1', name: 'Fries', price: '$5' }])).toBe(false)
    expect(BLOCKS.line_items.isEmpty([])).toBe(true)
  })

  it('extraction: line items schema + ids added on parse', () => {
    const RECEIPTISH: PrimitiveDef = {
      id: 'receiptish',
      name: 'Receiptish',
      fields: [
        { key: 'items', label: 'Items', block: 'line_items', required: false },
        { key: 'taxRate', label: 'Tax', block: 'number', required: false },
      ],
    }
    const fields = (buildExtractionSchema([RECEIPTISH]) as any).properties.items.items.properties.fields.properties
    expect(fields.items.items.properties.price.type).toBe('number')
    expect(fields.taxRate.type).toBe('number')

    const [draft] = parseExtraction(
      { items: [{ primitiveId: 'receiptish', fields: { items: [{ name: 'Fries', price: 5 }], taxRate: 12 } }] },
      [RECEIPTISH],
    )
    expect(draft.fields.taxRate).toBe(12)
    expect(draft.fields.items).toEqual([{ id: expect.any(String), name: 'Fries', price: 5 }])
  })
})
