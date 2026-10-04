// Persistence contract. Loads/saves whole boards. Never validates — trusts the store.
// Async even for sync backends so swapping implementations never changes signatures.

import type { Board, BoardSummary, Prefs } from '../model'

export interface BoardRepository {
  listBoards(): Promise<BoardSummary[]>
  loadBoard(id: string): Promise<Board | null>
  /** Upsert. */
  saveBoard(board: Board): Promise<void>
  deleteBoard(id: string): Promise<void>
}

export interface PrefsRepository {
  /** null → never saved. */
  loadPrefs(): Promise<Prefs | null>
  savePrefs(prefs: Prefs): Promise<void>
}
