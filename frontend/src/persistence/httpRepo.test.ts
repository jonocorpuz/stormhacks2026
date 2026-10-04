import { describe, expect, it } from 'vitest'
import { createBoardsApi } from '../../../server/boards.js'
import { addItem, createBoard, createItem, renameBoard, type Board, type BoardSummary } from '../model'
import { HttpRepo } from './index'

// Real route handler + in-memory db; fetch routed straight into it. No network.
function fakeServer() {
  const rows = new Map<string, { board: Board; summary: BoardSummary }>()
  const key = (email: string, id: string) => `${email}\n${id}`
  const api = createBoardsApi({
    async list(email: string) {
      return [...rows.entries()].filter(([k]) => k.startsWith(`${email}\n`)).map(([, r]) => r.summary)
    },
    async load(email: string, id: string) {
      const row = rows.get(key(email, id))
      return row ? structuredClone(row.board) : null
    },
    async save(email: string, board: Board, summary: BoardSummary) {
      rows.set(key(email, board.id), { board: structuredClone(board), summary })
    },
    async remove(email: string, id: string) {
      rows.delete(key(email, id))
    },
  })
  const fetchFn = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = new URL(String(input), 'http://test')
    const headers = new Headers(init.headers)
    const result = await api({
      method: init.method ?? 'GET',
      path: url.pathname.replace('/api/boards', ''),
      email: headers.get('x-user-email'),
      body: init.body ? JSON.parse(String(init.body)) : undefined,
    })
    return new Response(JSON.stringify(result.json), { status: result.status })
  }) as typeof fetch
  return (email: string) => new HttpRepo(email, '/api/boards', fetchFn)
}

describe('HttpRepo + server/boards.js', () => {
  it('round-trips a board', async () => {
    const repo = fakeServer()('a@x.com')
    const board = addItem(createBoard('Trip'), createItem('note', { title: 'hi' }))
    await repo.saveBoard(board)
    expect(await repo.loadBoard(board.id)).toEqual(board)
  })

  it('returns null for missing board', async () => {
    expect(await fakeServer()('a@x.com').loadBoard('nope')).toBeNull()
  })

  it('lists summaries and upserts', async () => {
    const repo = fakeServer()('a@x.com')
    const board = createBoard('Trip')
    await repo.saveBoard(board)
    await repo.saveBoard(renameBoard(board, 'Japan'))
    expect(await repo.listBoards()).toEqual([
      expect.objectContaining({ id: board.id, name: 'Japan', itemCount: 0 }),
    ])
  })

  it('deletes', async () => {
    const repo = fakeServer()('a@x.com')
    const board = createBoard('Trip')
    await repo.saveBoard(board)
    await repo.deleteBoard(board.id)
    expect(await repo.loadBoard(board.id)).toBeNull()
    expect(await repo.listBoards()).toEqual([])
  })

  it('scopes boards per email, case-insensitively', async () => {
    const as = fakeServer()
    const board = createBoard('Trip')
    await as('A@x.com ').saveBoard(board)
    expect(await as('b@x.com').listBoards()).toEqual([])
    expect(await as('b@x.com').loadBoard(board.id)).toBeNull()
    expect(await as('a@x.com').loadBoard(board.id)).toEqual(board)
  })

  it('surfaces server errors', async () => {
    await expect(fakeServer()('not-an-email').listBoards()).rejects.toThrow(/email/)
  })
})

describe('createBoardsApi', () => {
  it('errors clearly when the db is not configured', async () => {
    const result = await createBoardsApi(null)({ method: 'GET', path: '/', email: 'a@x.com' })
    expect(result).toEqual({ status: 500, json: { ok: false, error: 'DATABASE_URL not set on the server' } })
  })

  it('rejects a body whose id does not match the URL', async () => {
    const api = createBoardsApi({ save: async () => {} } as never)
    const result = await api({ method: 'PUT', path: '/other', email: 'a@x.com', body: createBoard('x') })
    expect(result.status).toBe(400)
  })
})
