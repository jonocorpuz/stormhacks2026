// App store: holds runtime state, runs domain actions through the model, autosaves via repo.
// Framework-agnostic. Components reach it only through useApp / useActions.

import {
  addItem,
  captureProblem,
  createBoard as newBoard,
  createItem as newItem,
  getItemIssues,
  removeItem,
  renameBoard as rename,
  reorderItems as reorder,
  setView as mergeView,
  toSummary,
  updateItem as patchItem,
  extractablePrimitives,
  findItem,
  type Board,
  type BoardSummary,
  type BoardView,
  type Capture,
  type FieldValues,
  type Issue,
  type Item,
} from '../model'
import type { Extractor } from '../extractor'
import type { BoardRepository } from '../persistence'

export type AppStatus = 'idle' | 'loading' | 'saving' | 'error'

/** In-memory only. Successful extractions are removed; failures stay until dismissed. */
export interface Extraction {
  id: string
  name: string | null
  status: 'pending' | 'failed'
  error: string | null
}

export interface AppState {
  boards: BoardSummary[]
  currentBoard: Board | null
  status: AppStatus
  error: string | null
  extractions: Extraction[]
}

export interface AppActions {
  /** Load board list and open most recent board. Call once at startup. */
  init(): Promise<void>
  /** Throws while extracting (it switches to the new board). */
  createBoard(name: string): Promise<Board>
  /** Throws while extracting (results must land on the board they were dropped on). */
  openBoard(id: string): Promise<void>
  /** Throws while extracting. */
  closeBoard(): void
  renameBoard(id: string, name: string): Promise<void>
  /** Deletes board and all its items. Throws for the current board while extracting. */
  deleteBoard(id: string): Promise<void>
  /** Never blocks on validation — returns issues for the UI to flag. */
  createItem(primitiveId: string, fields: FieldValues): Promise<{ item: Item; issues: Issue[] }>
  updateItem(itemId: string, patch: FieldValues): Promise<Issue[]>
  deleteItem(itemId: string): Promise<void>
  reorderItems(fromIndex: number, toIndex: number): Promise<void>
  setView(patch: BoardView): Promise<void>
  /**
   * Extract items from captures onto the current board (creates "Untitled" if none open).
   * Runs in parallel; never rejects — failures land in state.extractions.
   */
  ingestCaptures(captures: Capture[]): Promise<void>
  dismissExtraction(id: string): void
}

export interface AppStore {
  getState(): AppState
  subscribe(listener: () => void): () => void
  actions: AppActions
}

export function createAppStore(repo: BoardRepository, extractor?: Extractor): AppStore {
  let state: AppState = { boards: [], currentBoard: null, status: 'idle', error: null, extractions: [] }
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

  const isExtracting = () => state.extractions.some((e) => e.status === 'pending')

  const guardSwitch = () => {
    if (isExtracting()) throw new Error("Can't switch boards while extracting")
  }

  const setExtraction = (id: string, patch: Partial<Extraction> | null) => {
    setState({
      extractions: patch
        ? state.extractions.map((e) => (e.id === id ? { ...e, ...patch } : e))
        : state.extractions.filter((e) => e.id !== id),
    })
  }

  const ingest = async (capture: Capture): Promise<void> => {
    const failWith = (error: string) => setExtraction(capture.id, { status: 'failed', error })

    const problem = captureProblem(capture)
    if (problem) return failWith(problem)
    if (!extractor) return failWith('No extractor configured')

    try {
      const drafts = await extractor.extract(capture, extractablePrimitives())
      if (drafts.length === 0) return failWith('Nothing recognised')
      // TODO(capture): pass capture.id once captures are persisted.
      const items = drafts.map((d) => newItem(d.primitiveId, d.fields, null))
      await commit(items.reduce(addItem, requireBoard()))
      setExtraction(capture.id, null)
    } catch (err) {
      failWith(err instanceof Error ? err.message : String(err))
    }
  }

  const actions: AppActions = {
    async init() {
      setState({ status: 'loading', error: null })
      try {
        const boards = await repo.listBoards()
        // Always land on a board when one exists: open the most recently updated.
        const latest = [...boards].sort((a, b) => b.updatedAt - a.updatedAt)[0]
        const currentBoard = latest ? await repo.loadBoard(latest.id) : null
        setState({ boards, currentBoard, status: 'idle' })
      } catch (err) {
        fail(err)
      }
    },

    async createBoard(name) {
      guardSwitch()
      const board = newBoard(name)
      setState({ currentBoard: board })
      await commit(board)
      return board
    },

    async openBoard(id) {
      guardSwitch()
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
      guardSwitch()
      setState({ currentBoard: null })
    },

    async renameBoard(id, name) {
      const board = state.currentBoard?.id === id ? state.currentBoard : await repo.loadBoard(id)
      if (!board) throw new Error(`Board not found: ${id}`)
      await commit(rename(board, name))
    },

    async deleteBoard(id) {
      if (state.currentBoard?.id === id) guardSwitch()
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

    async ingestCaptures(captures) {
      if (captures.length === 0) return
      // Before marking pending, else the switch guard blocks it.
      if (!state.currentBoard) await actions.createBoard('Untitled')
      setState({
        extractions: [
          ...state.extractions,
          ...captures.map((c) => ({ id: c.id, name: c.name, status: 'pending' as const, error: null })),
        ],
      })
      await Promise.all(captures.map(ingest))
    },

    dismissExtraction(id) {
      setExtraction(id, null)
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
