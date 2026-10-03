// Blocks: unsemantic value kinds. Define storage shape + validation only.

export type BlockId = 'text' | 'longtext'

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
}

export function getBlock(id: BlockId): BlockDef {
  const block = BLOCKS[id]
  if (!block) throw new Error(`Unknown block: ${id}`)
  return block
}
