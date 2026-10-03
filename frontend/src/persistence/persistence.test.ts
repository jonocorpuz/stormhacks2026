import { describe, expect, it } from 'vitest'
import { addItem, createBoard, createItem, renameBoard } from '../model'
import { LocalStorageRepo, MemoryRepo, type BoardRepository } from './index'

class FakeStorage implements Storage {
  private data = new Map<string, string>()
  get length() {
    return this.data.size
  }
  clear() {
    this.data.clear()
  }
  getItem(key: string) {
    return this.data.get(key) ?? null
  }
  key(i: number) {
    return [...this.data.keys()][i] ?? null
  }
  removeItem(key: string) {
    this.data.delete(key)
  }
  setItem(key: string, value: string) {
    this.data.set(key, value)
  }
}

const repos: [string, () => BoardRepository][] = [
  ['MemoryRepo', () => new MemoryRepo()],
  ['LocalStorageRepo', () => new LocalStorageRepo(new FakeStorage())],
]

describe.each(repos)('%s', (_, makeRepo) => {
  it('round-trips a board', async () => {
    const repo = makeRepo()
    const board = addItem(createBoard('Trip'), createItem('note', { title: 'hi' }))
    await repo.saveBoard(board)
    expect(await repo.loadBoard(board.id)).toEqual(board)
  })

  it('returns null for missing board', async () => {
    expect(await makeRepo().loadBoard('nope')).toBeNull()
  })

  it('lists summaries and upserts', async () => {
    const repo = makeRepo()
    const board = createBoard('Trip')
    await repo.saveBoard(board)
    await repo.saveBoard(renameBoard(board, 'Japan'))
    expect(await repo.listBoards()).toEqual([
      expect.objectContaining({ id: board.id, name: 'Japan', itemCount: 0 }),
    ])
  })

  it('deletes', async () => {
    const repo = makeRepo()
    const board = createBoard('Trip')
    await repo.saveBoard(board)
    await repo.deleteBoard(board.id)
    expect(await repo.loadBoard(board.id)).toBeNull()
    expect(await repo.listBoards()).toEqual([])
  })

  it('stores copies, not references', async () => {
    const repo = makeRepo()
    const board = createBoard('Trip')
    await repo.saveBoard(board)
    board.name = 'mutated'
    expect((await repo.loadBoard(board.id))?.name).toBe('Trip')
  })
})
