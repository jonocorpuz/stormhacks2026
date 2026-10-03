// In-memory repo for tests. Stores JSON copies so callers can't mutate saved state.

import { toSummary, type Board, type BoardSummary } from '../model'
import type { BoardRepository } from './repository'

export class MemoryRepo implements BoardRepository {
  private boards = new Map<string, string>()

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
}
