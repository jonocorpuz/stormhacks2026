// Persistence contract. Loads/saves whole boards. Never validates — trusts the store.
// Async even for sync backends so swapping implementations never changes signatures.

import type { Board, BoardSummary } from '../model'

export interface BoardRepository {
  listBoards(): Promise<BoardSummary[]>
  loadBoard(id: string): Promise<Board | null>
  /** Upsert. */
  saveBoard(board: Board): Promise<void>
  deleteBoard(id: string): Promise<void>
}
