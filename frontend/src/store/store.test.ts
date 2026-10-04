import { describe, expect, it } from 'vitest'
import type { Extractor } from '../extractor'
import { createCapture, type ExtractionDraft } from '../model'
import { MemoryRepo, type BoardRepository } from '../persistence'
import { createAppStore } from './appStore'

const setup = () => {
  const repo = new MemoryRepo()
  return { repo, store: createAppStore(repo) }
}

describe('app store', () => {
  it('profile name: saved to prefs, restored on init, cleared by null/blank', async () => {
    const prefsRepo = new MemoryRepo()
    const store = createAppStore(new MemoryRepo(), undefined, { prefsRepo })
    await store.actions.init()
    expect(store.getState().name).toBeNull()

    await store.actions.setName('  Ada Lovelace ')
    expect(store.getState().name).toBe('Ada Lovelace')
    const again = createAppStore(new MemoryRepo(), undefined, { prefsRepo })
    await again.actions.init()
    expect(again.getState().name).toBe('Ada Lovelace')

    await store.actions.setName(null)
    expect(store.getState().name).toBeNull()
    expect(await prefsRepo.loadPrefs()).toEqual({ theme: null })
    await store.actions.setName('   ')
    expect(store.getState().name).toBeNull()
  })

  it('theme follows browser until toggled, then saves choice', async () => {
    const prefsRepo = new MemoryRepo()
    const store = createAppStore(new MemoryRepo(), undefined, { prefsRepo, systemDark: true })
    expect(store.getState().theme).toBeNull()
    await store.actions.init()
    expect(store.getState().theme).toBe('dark')
    expect(await prefsRepo.loadPrefs()).toBeNull()

    await store.actions.toggleTheme()
    expect(store.getState().theme).toBe('light')
    expect(await prefsRepo.loadPrefs()).toEqual({ theme: 'light' })

    // Saved choice beats browser on next launch
    const next = createAppStore(new MemoryRepo(), undefined, { prefsRepo, systemDark: true })
    await next.actions.init()
    expect(next.getState().theme).toBe('light')
  })

  it('creates and opens a board, autosaves it', async () => {
    const { repo, store } = setup()
    const board = await store.actions.createBoard('Trip')
    expect(store.getState().currentBoard?.id).toBe(board.id)
    expect(store.getState().boards).toHaveLength(1)
    expect(await repo.loadBoard(board.id)).toEqual(board)
    expect(store.getState().status).toBe('idle')
  })

  it('init loads board list and opens most recent board', async () => {
    const { repo, store } = setup()
    const other = createAppStore(repo)
    await other.actions.createBoard('Old')
    await new Promise((r) => setTimeout(r, 2))
    const recent = await other.actions.createBoard('Recent')
    await store.actions.init()
    expect(store.getState().boards.map((b) => b.name).sort()).toEqual(['Old', 'Recent'])
    expect(store.getState().currentBoard?.id).toBe(recent.id)
  })

  it('init with no boards leaves none open', async () => {
    const { store } = setup()
    await store.actions.init()
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
    await expect(store.actions.createBoard('Trip')).rejects.toThrow('disk full')
    expect(store.getState()).toMatchObject({ status: 'error', error: 'disk full' })
  })

  it('recovers from a transient save failure; next save persists the missed change', async () => {
    const repo = new MemoryRepo()
    const rawSave = repo.saveBoard.bind(repo)
    let failNext = false
    repo.saveBoard = async (b) => {
      if (failNext) {
        failNext = false
        throw new Error('QuotaExceededError')
      }
      return rawSave(b)
    }
    const store = createAppStore(repo)
    const board = await store.actions.createBoard('Trip')

    failNext = true
    await expect(store.actions.createItem('note', { title: 'lost?' })).rejects.toThrow('QuotaExceededError')
    expect(store.getState()).toMatchObject({ status: 'error', error: 'QuotaExceededError' })

    await store.actions.createItem('note', { title: 'next' })
    expect(store.getState()).toMatchObject({ status: 'idle', error: null })
    const titles = (await repo.loadBoard(board.id))!.items.map((i) => i.fields.title)
    expect(titles).toEqual(expect.arrayContaining(['lost?', 'next']))
  })

  it("keeps the error while another board's failed save is unrecovered", async () => {
    const repo = new MemoryRepo()
    const rawSave = repo.saveBoard.bind(repo)
    let failing: string | null = null
    repo.saveBoard = async (b) => {
      if (b.id === failing) throw new Error('disk full')
      return rawSave(b)
    }
    const store = createAppStore(repo)
    const a = await store.actions.createBoard('A')
    failing = a.id
    await expect(store.actions.createItem('note', { title: 'x' })).rejects.toThrow()
    failing = null

    await store.actions.createBoard('B')
    await store.actions.createItem('note', { title: 'y' })
    expect(store.getState()).toMatchObject({ status: 'error', error: 'disk full' })

    // Reopening uses the unsaved version, so the next save persists 'x' instead of dropping it.
    await store.actions.openBoard(a.id)
    expect(store.getState().currentBoard!.items.map((i) => i.fields.title)).toContain('x')
    await store.actions.renameBoard(a.id, 'A2')
    expect(store.getState()).toMatchObject({ status: 'idle', error: null })
    expect((await repo.loadBoard(a.id))!.items.map((i) => i.fields.title)).toContain('x')
  })

  describe('ingestCaptures', () => {
    const png = (name = 'a.png') => createCapture('image', 'image/png', 'abc', name)

    /** Inline test double — resolves when you call release(). */
    const deferredExtractor = (drafts: ExtractionDraft[] | Error) => {
      let release!: () => void
      const gate = new Promise<void>((r) => (release = r))
      const extractor: Extractor = {
        extract: async () => {
          await gate
          if (drafts instanceof Error) throw drafts
          return drafts
        },
      }
      return { extractor, release }
    }

    const note = { primitiveId: 'note', fields: { title: 'From image' } }

    it('appends extracted items to current board, clears status', async () => {
      const repo = new MemoryRepo()
      const { extractor, release } = deferredExtractor([note])
      const store = createAppStore(repo, extractor)
      const board = await store.actions.createBoard('Trip')

      const done = store.actions.ingestCaptures([png()])
      expect(store.getState().extractions).toMatchObject([{ name: 'a.png', status: 'pending' }])
      release()
      await done

      const items = (await repo.loadBoard(board.id))!.items
      expect(items.at(-1)).toMatchObject({ primitiveId: 'note', fields: { title: 'From image' }, captureId: null })
      expect(store.getState().extractions).toEqual([])
    })

    it('multi-drop: out-of-order extractions all land (state + repo)', async () => {
      // Slow async saves, so commits overlap with in-flight writes.
      const repo = new MemoryRepo()
      const rawSave = repo.saveBoard.bind(repo)
      repo.saveBoard = async (b) => {
        await new Promise((r) => setTimeout(r, 5))
        return rawSave(b)
      }
      const gates = new Map<string, () => void>()
      const extractor: Extractor = {
        extract: (capture) =>
          new Promise((resolve) =>
            gates.set(capture.name!, () => resolve([{ primitiveId: 'note', fields: { title: capture.name } }])),
          ),
      }
      const store = createAppStore(repo, extractor)
      const board = await store.actions.createBoard('Trip')

      const done = store.actions.ingestCaptures([png('a.png'), png('b.png'), png('c.png')])
      for (const name of ['c.png', 'a.png', 'b.png']) {
        gates.get(name)!()
        await new Promise((r) => setTimeout(r, 0))
        if (name === 'a.png') await store.actions.createItem('note', { title: 'manual' })
      }
      await done

      const titles = (items: { fields: Record<string, unknown> }[]) => items.map((i) => i.fields.title).sort()
      const expected = ['a.png', 'b.png', 'c.png', 'manual']
      expect(titles(store.getState().currentBoard!.items)).toEqual(expected)
      expect(titles((await repo.loadBoard(board.id))!.items)).toEqual(expected)
    })

    it('creates an Untitled board when none is open', async () => {
      const { extractor, release } = deferredExtractor([note])
      const store = createAppStore(new MemoryRepo(), extractor)
      release()
      await store.actions.ingestCaptures([png(), png('b.png')])
      expect(store.getState().boards.map((b) => b.name)).toEqual(['Untitled'])
      expect(store.getState().currentBoard?.items.filter((i) => i.primitiveId === 'note')).toHaveLength(2)
    })

    it('records failures until dismissed: errors, empty results, unsupported files', async () => {
      const { extractor, release } = deferredExtractor(new Error('Gemini HTTP 500'))
      const store = createAppStore(new MemoryRepo(), extractor)
      await store.actions.createBoard('Trip')
      release()
      await store.actions.ingestCaptures([png(), createCapture('image', 'application/pdf', 'x', 'doc.pdf')])
      expect(store.getState().extractions.map((e) => [e.status, e.error])).toEqual([
        ['failed', 'Gemini HTTP 500'],
        ['failed', 'Not supported (images only)'],
      ])

      store.actions.dismissExtraction(store.getState().extractions[0].id)
      expect(store.getState().extractions).toHaveLength(1)

      const empty = createAppStore(new MemoryRepo(), { extract: async () => [] })
      await empty.actions.createBoard('Trip')
      await empty.actions.ingestCaptures([png()])
      expect(empty.getState().extractions[0].error).toBe('Nothing recognised')
    })

    it('blocks board switching while extracting', async () => {
      const { extractor, release } = deferredExtractor([note])
      const store = createAppStore(new MemoryRepo(), extractor)
      const other = await store.actions.createBoard('Other')
      const board = await store.actions.createBoard('Trip')

      const done = store.actions.ingestCaptures([png()])
      await expect(store.actions.openBoard(other.id)).rejects.toThrow(/while extracting/)
      await expect(store.actions.createBoard('New')).rejects.toThrow(/while extracting/)
      await expect(store.actions.deleteBoard(board.id)).rejects.toThrow(/while extracting/)
      expect(() => store.actions.closeBoard()).toThrow(/while extracting/)
      await store.actions.renameBoard(board.id, 'Trip 2') // still allowed

      release()
      await done
      expect(store.getState().currentBoard?.id).toBe(board.id)
      await store.actions.openBoard(other.id)
      expect(store.getState().currentBoard?.id).toBe(other.id)
    })
  })
})
