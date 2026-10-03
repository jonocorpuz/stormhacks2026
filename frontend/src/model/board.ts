// Board: owns its items. Items array order = manual order.
// View is an opaque bag owned by the frontend; model persists but never reads it.

import { createItem, updateItemFields, type FieldValues, type Item } from './item'

export const BOARD_SCHEMA_VERSION = 1

export type BoardView = Record<string, unknown>

export interface Board {
  id: string
  name: string
  items: Item[]
  view: BoardView
  createdAt: number
  updatedAt: number
  schemaVersion: typeof BOARD_SCHEMA_VERSION
}

export interface BoardSummary {
  id: string
  name: string
  updatedAt: number
  itemCount: number
}

export function createBoard(name: string): Board {
  const now = Date.now()
  const defaultList = createItem('recommendation_list')
  return {
    id: crypto.randomUUID(),
    name,
    items: [defaultList],
    view: {
      sizes: {
        [defaultList.id]: '1x2' // List widget looks better tall
      }
    },
    createdAt: now,
    updatedAt: now,
    schemaVersion: BOARD_SCHEMA_VERSION,
  }
}

export function toSummary(board: Board): BoardSummary {
  return {
    id: board.id,
    name: board.name,
    updatedAt: board.updatedAt,
    itemCount: board.items.length,
  }
}

const touch = (board: Board, patch: Partial<Board>): Board => ({
  ...board,
  ...patch,
  updatedAt: Date.now(),
})

function indexOfItem(board: Board, itemId: string): number {
  const index = board.items.findIndex((i) => i.id === itemId)
  if (index === -1) throw new Error(`Unknown item: ${itemId}`)
  return index
}

export function renameBoard(board: Board, name: string): Board {
  return touch(board, { name })
}

/** Shallow-merge patch into view. */
export function setView(board: Board, patch: BoardView): Board {
  return touch(board, { view: { ...board.view, ...patch } })
}

export function findItem(board: Board, itemId: string): Item | undefined {
  return board.items.find((i) => i.id === itemId)
}

export function addItem(board: Board, item: Item): Board {
  return touch(board, { items: [...board.items, item] })
}

export function updateItem(board: Board, itemId: string, patch: FieldValues): Board {
  const index = indexOfItem(board, itemId)
  const items = [...board.items]
  items[index] = updateItemFields(items[index], patch)
  return touch(board, { items })
}

export function removeItem(board: Board, itemId: string): Board {
  const index = indexOfItem(board, itemId)
  return touch(board, { items: board.items.filter((_, i) => i !== index) })
}

export function reorderItems(board: Board, fromIndex: number, toIndex: number): Board {
  const n = board.items.length
  if (fromIndex < 0 || fromIndex >= n || toIndex < 0 || toIndex >= n) {
    throw new Error(`Reorder out of range: ${fromIndex} -> ${toIndex} (length ${n})`)
  }
  const items = [...board.items]
  const [moved] = items.splice(fromIndex, 1)
  items.splice(toIndex, 0, moved)
  return touch(board, { items })
}
