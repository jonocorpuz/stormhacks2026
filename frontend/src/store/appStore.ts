// App store: holds runtime state, runs domain actions through the model, autosaves via repo.
// Framework-agnostic. Components reach it only through useApp / useActions.

import {
  addItem,
  defaultPrefs,
  otherTheme,
  resolveTheme,
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
  parseExtraction,
  PRIMITIVES,
  type Board,
  type BoardSummary,
  type BoardView,
  type Capture,
  type FieldValues,
  type Issue,
  type Item,
  type Prefs,
  type Theme,
} from '../model'
import type { Extractor } from '../extractor'
import type { BoardRepository, PrefsRepository } from '../persistence'

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
  /** Resolved (saved choice or browser). null until init loads prefs. */
  theme: Theme | null
  /** Profile display name; null → none set. */
  name: string | null
}

export interface AppActions {
  /** Load board list and open most recent board. Call once at startup. */
  init(): Promise<void>
  /** Throws while extracting (it switches to the new board). */
  createBoard(name: string): Promise<Board>
  /**
   * New board from seed data (e.g. fixtures/demoBoard.json), opened like createBoard. Items are
   * { primitiveId, fields }; ids are fresh each time, so loading twice gives two boards.
   * Throws on unknown primitives or malformed items, and while extracting.
   */
  importBoard(seed: { name: string; items: unknown[] }): Promise<Board>
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
  /** Saves the choice; from then on browser setting is ignored. */
  toggleTheme(): Promise<void>
  /** Blank or null clears it (e.g. logout). */
  setName(name: string | null): Promise<void>
}

export interface AppStore {
  getState(): AppState
  subscribe(listener: () => void): () => void
  actions: AppActions
}

export interface StoreEnv {
  /** Omit → prefs live in memory only. */
  prefsRepo?: PrefsRepository
  /** Browser's prefers-color-scheme, read by caller (store stays DOM-free). */
  systemDark?: boolean
}

export function createAppStore(
  repo: BoardRepository,
  extractor?: Extractor,
  { prefsRepo, systemDark = false }: StoreEnv = {},
): AppStore {
  let state: AppState = { boards: [], currentBoard: null, status: 'idle', error: null, extractions: [], theme: null, name: null }
  let prefs: Prefs = defaultPrefs()
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

  /**
   * boardId → latest version whose save failed (+ error). Cleared by that board's next successful
   * save. openBoard prefers it over the repo, so switching away and back doesn't drop the change.
   */
  const failedSaves = new Map<string, { board: Board; error: string }>()
  let saveErrorShown = false

  const showSaveError = (error: string) => {
    saveErrorShown = true
    setState({ status: 'error', error })
  }

  /**
   * Saves serialized so writes land in order even with a real async backend.
   * Rejects on failure (callers must know), but the queue itself never rejects, so one bad
   * write (e.g. quota exceeded) doesn't block later ones. Each save writes the whole board,
   * so the next success for that board also persists what the failed one missed.
   */
  const save = (board: Board): Promise<void> => {
    pendingSaves++
    setState({ status: 'saving' })
    const write = saveQueue.then(() => repo.saveBoard(board))
    saveQueue = write.then(
      () => {
        pendingSaves--
        failedSaves.delete(board.id)
        if (pendingSaves > 0) return
        const [stillFailing] = failedSaves.values()
        if (stillFailing) showSaveError(stillFailing.error)
        else if (state.status === 'saving' || saveErrorShown) {
          saveErrorShown = false
          setState({ status: 'idle', error: null })
        }
      },
      (err) => {
        pendingSaves--
        const error = err instanceof Error ? err.message : String(err)
        failedSaves.set(board.id, { board, error })
        showSaveError(error)
      },
    )
    return write
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

  const savePrefs = async () => {
    try {
      await prefsRepo?.savePrefs(prefs)
    } catch (err) {
      fail(err)
    }
  }

  /** Remember the open board so reload returns to it. Never rejects (savePrefs catches). */
  const rememberBoard = (id: string | null) => {
    if ((prefs.lastBoardId ?? null) === id) return
    const { lastBoardId: _old, ...rest } = prefs
    prefs = id ? { ...rest, lastBoardId: id } : rest
    return savePrefs()
  }

  const actions: AppActions = {
    async init() {
      setState({ status: 'loading', error: null })
      try {
        prefs = (await prefsRepo?.loadPrefs()) ?? prefs
        setState({ theme: resolveTheme(prefs, systemDark), name: prefs.name ?? null })
        const boards = await repo.listBoards()
        // Always land on a board when one exists: the last one open, else the most recently updated.
        const last = boards.find((b) => b.id === prefs.lastBoardId)
        const latest = last ?? [...boards].sort((a, b) => b.updatedAt - a.updatedAt)[0]
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
      await rememberBoard(board.id)
      return board
    },

    async importBoard(seed) {
      guardSwitch()
      // Same shape as AI drafts: reuse its parsing (adds list/line-item ids, drops empty values).
      const drafts = parseExtraction({ items: seed.items }, PRIMITIVES)
      const board = drafts.map((d) => newItem(d.primitiveId, d.fields)).reduce(addItem, newBoard(seed.name))
      setState({ currentBoard: board })
      await commit(board)
      await rememberBoard(board.id)
      return board
    },

    async openBoard(id) {
      guardSwitch()
      setState({ status: 'loading', error: null })
      try {
        const board = failedSaves.get(id)?.board ?? (await repo.loadBoard(id))
        if (!board) throw new Error(`Board not found: ${id}`)
        setState({ currentBoard: board, status: 'idle' })
        await rememberBoard(id)
      } catch (err) {
        fail(err)
      }
    },

    closeBoard() {
      guardSwitch()
      setState({ currentBoard: null })
      void rememberBoard(null)
    },

    async renameBoard(id, name) {
      const board =
        state.currentBoard?.id === id ? state.currentBoard : (failedSaves.get(id)?.board ?? (await repo.loadBoard(id)))
      if (!board) throw new Error(`Board not found: ${id}`)
      await commit(rename(board, name))
    },

    async deleteBoard(id) {
      if (state.currentBoard?.id === id) guardSwitch()
      failedSaves.delete(id) // nothing left to persist
      setState({
        boards: state.boards.filter((b) => b.id !== id),
        currentBoard: state.currentBoard?.id === id ? null : state.currentBoard,
      })
      if (prefs.lastBoardId === id) await rememberBoard(null)
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
      // Save failure surfaces via status; the board is in state either way.
      if (!state.currentBoard) await actions.createBoard('Untitled').catch(() => {})
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

    async toggleTheme() {
      prefs = { ...prefs, theme: otherTheme(state.theme ?? resolveTheme(prefs, systemDark)) }
      setState({ theme: prefs.theme })
      await savePrefs()
    },

    async setName(name) {
      const trimmed = name?.trim() || null
      const { name: _old, ...rest } = prefs
      prefs = trimmed ? { ...rest, name: trimmed } : rest
      setState({ name: trimmed })
      await savePrefs()
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
