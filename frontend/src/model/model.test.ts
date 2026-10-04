import { describe, expect, it } from 'vitest'
import {
  addItem,
  createBoard,
  createItem,
  getItemIssues,
  initials,
  itemMatchesQuery,
  removeItem,
  reorderItems,
  setView,
  toSummary,
  updateItem,
  updateItemFields,
  validateFields,
  validateItem,
  type PrimitiveDef,
} from './index'

const LISTING: PrimitiveDef = {
  id: 'listing',
  name: 'Listing',
  fields: [
    { key: 'title', label: 'Title', block: 'text', required: true },
    { key: 'description', label: 'Description', block: 'longtext', required: false },
  ],
}

describe('createItem', () => {
  it('creates note with fields and null capture', () => {
    const item = createItem('note', { title: 'Hi' })
    expect(item.primitiveId).toBe('note')
    expect(item.fields).toEqual({ title: 'Hi' })
    expect(item.captureId).toBeNull()
    expect(item.id).toBeTruthy()
  })

  it('throws on unknown primitive', () => {
    expect(() => createItem('nope')).toThrow(/Unknown primitive/)
  })
})

describe('updateItemFields', () => {
  it('merges patch and removes undefined keys', () => {
    const item = createItem('note', { title: 'a', body: 'b' })
    const next = updateItemFields(item, { title: 'c', body: undefined })
    expect(next.fields).toEqual({ title: 'c' })
    expect(item.fields).toEqual({ title: 'a', body: 'b' }) // immutable
  })
})

describe('validateItem', () => {
  it('note with no fields has no issues (nothing required)', () => {
    expect(getItemIssues(createItem('note'))).toEqual([])
  })

  it('flags missing required, keeps going', () => {
    const item = { ...createItem('note'), primitiveId: 'listing' }
    expect(validateItem(item, LISTING)).toEqual([{ fieldKey: 'title', kind: 'missing_required' }])
  })

  it('treats whitespace-only text as missing', () => {
    const item = { ...createItem('note', { title: '   ' }), primitiveId: 'listing' }
    expect(validateItem(item, LISTING)).toEqual([{ fieldKey: 'title', kind: 'missing_required' }])
  })

  it('flags wrong shape without dropping the value', () => {
    const item = createItem('note', { title: 42 })
    expect(getItemIssues(item)).toEqual([{ fieldKey: 'title', kind: 'invalid_value' }])
    expect(item.fields.title).toBe(42)
  })

  it('flags orphaned keys', () => {
    const item = createItem('note', { legacy: 'x' })
    expect(getItemIssues(item)).toEqual([{ fieldKey: 'legacy', kind: 'orphaned_field' }])
  })
})

describe('board', () => {
  const withItems = () => {
    const a = createItem('note', { title: 'a' })
    const b = createItem('note', { title: 'b' })
    const c = createItem('note', { title: 'c' })
    return { board: [a, b, c].reduce(addItem, createBoard('Trip')), a, b, c }
  }

  it('creates empty board w/ schema version', () => {
    const board = createBoard('Trip')
    expect(board).toMatchObject({ name: 'Trip', items: [], view: {}, schemaVersion: 1 })
  })

  it('adds, updates, removes items immutably', () => {
    const { board, b } = withItems()
    const updated = updateItem(board, b.id, { body: 'hello' })
    expect(updated.items[1].fields).toEqual({ title: 'b', body: 'hello' })
    expect(board.items[1].fields).toEqual({ title: 'b' })

    const removed = removeItem(updated, b.id)
    expect(removed.items.map((i) => i.fields.title)).toEqual(['a', 'c'])
  })

  it('throws on unknown item id', () => {
    const { board } = withItems()
    expect(() => updateItem(board, 'nope', {})).toThrow(/Unknown item/)
    expect(() => removeItem(board, 'nope')).toThrow(/Unknown item/)
  })

  it('reorders items', () => {
    const { board } = withItems()
    expect(reorderItems(board, 0, 2).items.map((i) => i.fields.title)).toEqual(['b', 'c', 'a'])
    expect(() => reorderItems(board, 0, 3)).toThrow(/out of range/)
  })

  it('shallow-merges view', () => {
    const board = setView(setView(createBoard('x'), { layout: 'grid' }), { sizes: {} })
    expect(board.view).toEqual({ layout: 'grid', sizes: {} })
  })

  it('summarizes', () => {
    const { board } = withItems()
    expect(toSummary(board)).toEqual({
      id: board.id,
      name: 'Trip',
      updatedAt: board.updatedAt,
      itemCount: 3,
    })
  })
})

describe('validateFields', () => {
  it('validates a draft without an item', () => {
    expect(validateFields({}, LISTING)).toEqual([{ fieldKey: 'title', kind: 'missing_required' }])
  })
})

describe('itemMatchesQuery', () => {
  const item = createItem('note', { title: 'Ramen spots', body: 'Tokyo' })
  it('matches any string field, case-insensitive', () => {
    expect(itemMatchesQuery(item, 'tokyo')).toBe(true)
    expect(itemMatchesQuery(item, 'RAMEN')).toBe(true)
    expect(itemMatchesQuery(item, 'pizza')).toBe(false)
  })
  it('empty query matches all', () => {
    expect(itemMatchesQuery(item, '  ')).toBe(true)
  })
  it('matches checklist entries, line items and numbers; ignores entry ids', () => {
    const list = createItem('recommendation_list', { items: [{ id: 'abc123', title: 'Matcha latte', isChecked: false }] })
    const receipt = createItem('receipt', { items: [{ id: 'def456', name: 'Gyoza', price: 6.5 }], taxRate: 12 })
    expect(itemMatchesQuery(list, 'matcha')).toBe(true)
    expect(itemMatchesQuery(receipt, 'gyoza')).toBe(true)
    expect(itemMatchesQuery(receipt, '6.5')).toBe(true)
    expect(itemMatchesQuery(receipt, '12')).toBe(true)
    expect(itemMatchesQuery(list, 'abc123')).toBe(false)
  })
})

describe('initials', () => {
  it('first + last word, single word → one letter, blank → empty', () => {
    expect(initials('ada lovelace')).toBe('AL')
    expect(initials('  Grace  Brewster Hopper ')).toBe('GH')
    expect(initials('Prince')).toBe('P')
    expect(initials('   ')).toBe('')
    expect(initials(null)).toBe('')
  })
})
