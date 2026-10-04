// Boards in Neon via /api/boards (server/boards.js), scoped to a profile email. No auth.
// Boards only — prefs stay in LocalStorageRepo (index.html reads them pre-paint).

import type { Board, BoardSummary } from '../model'
import type { BoardRepository } from './repository'

type Fetch = typeof fetch

export class HttpRepo implements BoardRepository {
  constructor(
    private readonly email: string,
    private readonly url = '/api/boards',
    private readonly fetchFn: Fetch = (...args) => fetch(...args),
  ) {}

  /** Parsed JSON body, or null on 404. Throws the server's error otherwise. */
  private async request<T>(path: string, init: RequestInit = {}): Promise<T | null> {
    const res = await this.fetchFn(`${this.url}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', 'X-User-Email': this.email, ...init.headers },
    })
    if (res.status === 404) return null
    let payload: { ok?: boolean; error?: string } & T
    try {
      payload = await res.json()
    } catch {
      throw new Error(`Board storage failed (HTTP ${res.status})`)
    }
    if (!res.ok) throw new Error(payload.error ?? `Board storage failed (HTTP ${res.status})`)
    return payload
  }

  private boardPath = (id: string) => `/${encodeURIComponent(id)}`

  async listBoards(): Promise<BoardSummary[]> {
    return (await this.request<{ boards: BoardSummary[] }>(''))?.boards ?? []
  }

  async loadBoard(id: string): Promise<Board | null> {
    return (await this.request<{ board: Board }>(this.boardPath(id)))?.board ?? null
  }

  async saveBoard(board: Board): Promise<void> {
    await this.request(this.boardPath(board.id), { method: 'PUT', body: JSON.stringify(board) })
  }

  async deleteBoard(id: string): Promise<void> {
    await this.request(this.boardPath(id), { method: 'DELETE' })
  }
}
