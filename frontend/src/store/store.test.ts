import { describe, expect, it } from 'vitest'
import { MemoryRepo, type BoardRepository } from '../persistence'
import { createAppStore } from './appStore'

const setup = () => {
  const repo = new MemoryRepo()
  return { repo, store: createAppStore(repo) }
}

describe('app store', () => {
  it('creates and opens a board, autosaves it', async () => {
    const { repo, store } = setup()
    const board = await store.actions.createBoard('Trip')
    expect(store.getState().currentBoard?.id).toBe(board.id)
    expect(store.getState().boards).toHaveLength(1)
    expect(await repo.loadBoard(board.id)).toEqual(board)
    expect(store.getState().status).toBe('idle')
  })

  it('init loads board list', async () => {
    const { repo, store } = setup()
    await createAppStore(repo).actions.createBoard('Existing')
    await store.actions.init()
    expect(store.getState().boards.map((b) => b.name)).toEqual(['Existing'])
    expect(store.getState().currentBoard).toBeNull()
  })

  it('creates items, returns issues, persists', async () => {
    const { repo, store } = setup()
    const board = await store.actions.createBoard('Trip')
    const { item, issues } = await store.actions.createItem('note', { title: 'hi', junk: 1 })
    expect(issues).toEqual([{ fieldKey: 'junk', kind: 'orphaned_field' }])
    expect((await repo.loadBoard(board.id))?.items).toEqual([item])
    expect(store.getState().boards[0].itemCount).toBe(1)
  })

  it('updates, reorders, deletes items', async () => {
    const { repo, store } = setup()
    const board = await store.actions.createBoard('Trip')
    const { item: a } = await store.actions.createItem('note', { title: 'a' })
    const { item: b } = await store.actions.createItem('note', { title: 'b' })

    expect(await store.actions.updateItem(a.id, { body: 'x' })).toEqual([])
    await store.actions.reorderItems(0, 1)
    expect(store.getState().currentBoard?.items.map((i) => i.id)).toEqual([b.id, a.id])

    await store.actions.deleteItem(b.id)
    const saved = await repo.loadBoard(board.id)
    expect(saved?.items.map((i) => i.fields)).toEqual([{ title: 'a', body: 'x' }])
  })

  it('item actions throw without an open board', async () => {
    const { store } = setup()
    await expect(store.actions.createItem('note', {})).rejects.toThrow(/No board open/)
  })

  it('opens, renames, deletes boards', async () => {
    const { repo, store } = setup()
    const a = await store.actions.createBoard('A')
    const b = await store.actions.createBoard('B')

    await store.actions.openBoard(a.id)
    expect(store.getState().currentBoard?.name).toBe('A')

    await store.actions.renameBoard(b.id, 'B2') // not current
    expect((await repo.loadBoard(b.id))?.name).toBe('B2')
    expect(store.getState().currentBoard?.name).toBe('A')

    await store.actions.deleteBoard(a.id)
    expect(store.getState().currentBoard).toBeNull()
    expect(store.getState().boards.map((s) => s.name)).toEqual(['B2'])
    expect(await repo.loadBoard(a.id)).toBeNull()
  })

  it('setView persists opaque view', async () => {
    const { repo, store } = setup()
    const board = await store.actions.createBoard('Trip')
    await store.actions.setView({ layout: 'grid' })
    expect((await repo.loadBoard(board.id))?.view).toEqual({ layout: 'grid' })
  })

  it('notifies subscribers', async () => {
    const { store } = setup()
    let calls = 0
    const unsub = store.subscribe(() => calls++)
    await store.actions.createBoard('Trip')
    unsub()
    expect(calls).toBeGreaterThan(0)
  })

  it('surfaces save errors in status', async () => {
    const repo: BoardRepository = {
      listBoards: async () => [],
      loadBoard: async () => null,
      deleteBoard: async () => {},
      saveBoard: async () => {
        throw new Error('disk full')
      },
    }
    const store = createAppStore(repo)
    await store.actions.createBoard('Trip')
    expect(store.getState()).toMatchObject({ status: 'error', error: 'disk full' })
  })
})
