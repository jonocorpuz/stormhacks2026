// The only React-aware file outside components: bridges the app store into React.

import { createContext, createElement, useContext, useSyncExternalStore, type ReactNode } from 'react'
import type { AppActions, AppState, AppStore } from './appStore'

const StoreContext = createContext<AppStore | null>(null)

export function StoreProvider({ store, children }: { store: AppStore; children: ReactNode }) {
  return createElement(StoreContext.Provider, { value: store }, children)
}

function useStore(): AppStore {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useApp must be used inside <StoreProvider>')
  return store
}

/**
 * Subscribe to a slice of app state. Selector must return existing references
 * (e.g. `s => s.currentBoard`), not fresh objects/arrays, or it re-renders forever.
 */
export function useApp<T>(selector: (state: AppState) => T): T {
  const store = useStore()
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()))
}

export function useActions(): AppActions {
  return useStore().actions
}
