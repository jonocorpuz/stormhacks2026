// App store: holds runtime state, runs domain actions through the model, autosaves via repo.
// Framework-agnostic. Components reach it only through useApp / useActions.

import {
  addItem,
  createBoard as newBoard,
  createItem as newItem,
  getItemIssues,
  removeItem,
  renameBoard as rename,
  reorderItems as reorder,
  setView as mergeView,
  toSummary,
  updateItem as patchItem,
  findItem,
  type Board,
  type BoardSummary,
  type BoardView,
  type FieldValues,
  type Issue,
  type Item,
} from '../model'
import type { BoardRepository } from '../persistence'

export type AppStatus = 'idle' | 'loading' | 'saving' | 'error'

export interface AppState {
  boards: BoardSummary[]
  currentBoard: Board | null
  status: AppStatus
  error: string | null
}

export interface AppActions {
  /** Load board list. Call once at startup. */
  init(): Promise<void>
  createBoard(name: string): Promise<Board>
  openBoard(id: string): Promise<void>
  closeBoard(): void
  renameBoard(id: string, name: string): Promise<void>
  /** Deletes board and all its items. */
  deleteBoard(id: string): Promise<void>
  /** Never blocks on validation — returns issues for the UI to flag. */
  createItem(primitiveId: string, fields: FieldValues): Promise<{ item: Item; issues: Issue[] }>
  updateItem(itemId: string, patch: FieldValues): Promise<Issue[]>
  deleteItem(itemId: string): Promise<void>
  reorderItems(fromIndex: number, toIndex: number): Promise<void>
  setView(patch: BoardView): Promise<void>
}

export interface AppStore {
  getState(): AppState
  subscribe(listener: () => void): () => void
  actions: AppActions
}

export function createAppStore(repo: BoardRepository): AppStore {
  let state: AppState = { boards: [], currentBoard: null, status: 'idle', error: null }
  const listeners = new Set<() => void>()
  let saveQueue: Promise<void> = Promise.resolve()
  let pendingSaves = 0

  const setState = (patch: Partial<AppState>) => {
    state = { ...state, ...patch }
    listeners.forEach((l) => l())
  }

  const fail = (err: unknown) => {
    setState({ status: 'error', error: err instanceof Error ? err.message : String(err) })
  }

  const upsertSummary = (boards: BoardSummary[], board: Board) => {
    const summary = toSummary(board)
    const exists = boards.some((b) => b.id === board.id)
    return exists ? boards.map((b) => (b.id === board.id ? summary : b)) : [...boards, summary]
  }

  /** Saves serialized so writes land in order even with a real async backend. */
  const save = (board: Board): Promise<void> => {
    pendingSaves++
    setState({ status: 'saving' })
    saveQueue = saveQueue
      .then(() => repo.saveBoard(board))
      .then(
        () => {
          if (--pendingSaves === 0 && state.status === 'saving') setState({ status: 'idle' })
        },
        (err) => {
          pendingSaves--
          fail(err)
        },
      )
    return saveQueue
  }

  /** Apply a new version of a board to state, then persist it. */
  const commit = (board: Board): Promise<void> => {
    setState({
      boards: upsertSummary(state.boards, board),
      currentBoard: state.currentBoard?.id === board.id ? board : state.currentBoard,
    })
    return save(board)
  }

  const requireBoard = (): Board => {
    if (!state.currentBoard) throw new Error('No board open')
    return state.currentBoard
  }

  const actions: AppActions = {
    async init() {
      setState({ status: 'loading', error: null })
      try {
        setState({ boards: await repo.listBoards(), status: 'idle' })
      } catch (err) {
        fail(err)
      }
    },

    async createBoard(name) {
      const board = newBoard(name)
      setState({ currentBoard: board })
      await commit(board)
      return board
    },

    async openBoard(id) {
      setState({ status: 'loading', error: null })
      try {
        const board = await repo.loadBoard(id)
        if (!board) throw new Error(`Board not found: ${id}`)
        setState({ currentBoard: board, status: 'idle' })
      } catch (err) {
        fail(err)
      }
    },

    closeBoard() {
      setState({ currentBoard: null })
    },

    async renameBoard(id, name) {
      const board = state.currentBoard?.id === id ? state.currentBoard : await repo.loadBoard(id)
      if (!board) throw new Error(`Board not found: ${id}`)
      await commit(rename(board, name))
    },

    async deleteBoard(id) {
      setState({
        boards: state.boards.filter((b) => b.id !== id),
        currentBoard: state.currentBoard?.id === id ? null : state.currentBoard,
      })
      try {
        await repo.deleteBoard(id)
      } catch (err) {
        fail(err)
      }
    },

    async createItem(primitiveId, fields) {
      const item = newItem(primitiveId, fields)
      await commit(addItem(requireBoard(), item))
      return { item, issues: getItemIssues(item) }
    },

    async updateItem(itemId, patch) {
      const board = patchItem(requireBoard(), itemId, patch)
      await commit(board)
      return getItemIssues(findItem(board, itemId)!)
    },

    async deleteItem(itemId) {
      await commit(removeItem(requireBoard(), itemId))
    },

    async reorderItems(fromIndex, toIndex) {
      await commit(reorder(requireBoard(), fromIndex, toIndex))
    },

    async setView(patch) {
      await commit(mergeView(requireBoard(), patch))
    },
  }

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    actions,
  }
}
