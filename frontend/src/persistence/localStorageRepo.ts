// localStorage layout:
//   boards:index -> BoardSummary[]
//   board:<id>   -> Board JSON

import { toSummary, type Board, type BoardSummary } from '../model'
import type { BoardRepository } from './repository'

const INDEX_KEY = 'boards:index'
const boardKey = (id: string) => `board:${id}`

export class LocalStorageRepo implements BoardRepository {
  constructor(private storage: Storage = globalThis.localStorage) {}

  private readIndex(): BoardSummary[] {
    const json = this.storage.getItem(INDEX_KEY)
    return json ? JSON.parse(json) : []
  }

  private writeIndex(index: BoardSummary[]) {
    this.storage.setItem(INDEX_KEY, JSON.stringify(index))
  }

  async listBoards(): Promise<BoardSummary[]> {
    return this.readIndex()
  }

  async loadBoard(id: string): Promise<Board | null> {
    const json = this.storage.getItem(boardKey(id))
    return json ? JSON.parse(json) : null
  }

  async saveBoard(board: Board): Promise<void> {
    this.storage.setItem(boardKey(board.id), JSON.stringify(board))
    const index = this.readIndex().filter((s) => s.id !== board.id)
    this.writeIndex([...index, toSummary(board)])
  }

  async deleteBoard(id: string): Promise<void> {
    this.storage.removeItem(boardKey(id))
    this.writeIndex(this.readIndex().filter((s) => s.id !== id))
  }
}
