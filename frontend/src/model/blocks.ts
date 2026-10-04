// Blocks: unsemantic value kinds. Define storage shape + validation only.

export type BlockId = 'text' | 'longtext' | 'list' | 'number' | 'line_items'

/** Entry of a `line_items` block: something bought and what it cost (unit-less, e.g. dollars). */
export interface LineItem {
  id: string
  name: string
  price: number
}

const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

const isLineItem = (v: unknown): v is LineItem =>
  typeof v === 'object' &&
  v !== null &&
  typeof (v as LineItem).name === 'string' &&
  isFiniteNumber((v as LineItem).price)

export interface BlockDef {
  id: BlockId
  /** True if value has the right shape for this block. */
  isValid(value: unknown): boolean
  /** True if value counts as "not filled in" (for required checks). */
  isEmpty(value: unknown): boolean
}

const isBlankString = (v: unknown) =>
  v === undefined || v === null || (typeof v === 'string' && v.trim() === '')

export const BLOCKS: Record<BlockId, BlockDef> = {
  text: {
    id: 'text',
    isValid: (v) => typeof v === 'string',
    isEmpty: isBlankString,
  },
  longtext: {
    id: 'longtext',
    isValid: (v) => typeof v === 'string',
    isEmpty: isBlankString,
  },
  list: {
    id: 'list',
    isValid: (v) => Array.isArray(v),
    isEmpty: (v) => !Array.isArray(v) || v.length === 0,
  },
  number: {
    id: 'number',
    isValid: isFiniteNumber,
    isEmpty: (v) => v === undefined || v === null || v === '',
  },
  line_items: {
    id: 'line_items',
    isValid: (v) => Array.isArray(v) && v.every(isLineItem),
    isEmpty: (v) => !Array.isArray(v) || v.length === 0,
  },
}

export function getBlock(id: BlockId): BlockDef {
  const block = BLOCKS[id]
  if (!block) throw new Error(`Unknown block: ${id}`)
  return block
}
