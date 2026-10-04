// In-memory repo for tests. Stores JSON copies so callers can't mutate saved state.

import { toSummary, type Board, type BoardSummary, type Prefs } from '../model'
import type { BoardRepository, PrefsRepository } from './repository'

export class MemoryRepo implements BoardRepository, PrefsRepository {
  private boards = new Map<string, string>()
  private prefs: string | null = null

  async listBoards(): Promise<BoardSummary[]> {
    return [...this.boards.values()].map((json) => toSummary(JSON.parse(json)))
  }

  async loadBoard(id: string): Promise<Board | null> {
    const json = this.boards.get(id)
    return json ? JSON.parse(json) : null
  }

  async saveBoard(board: Board): Promise<void> {
    this.boards.set(board.id, JSON.stringify(board))
  }

  async deleteBoard(id: string): Promise<void> {
    this.boards.delete(id)
  }

  async loadPrefs(): Promise<Prefs | null> {
    return this.prefs ? JSON.parse(this.prefs) : null
  }

  async savePrefs(prefs: Prefs): Promise<void> {
    this.prefs = JSON.stringify(prefs)
  }
}
