import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { HttpExtractor } from './extractor'
import { LocalStorageRepo } from './persistence'
import { createAppStore, StoreProvider } from './store'

// Swap persistence / extractor here (e.g. new SupabaseRepo()) — nothing else changes.
const repo = new LocalStorageRepo()
const store = createAppStore(repo, new HttpExtractor(), {
  prefsRepo: repo,
  systemDark: matchMedia('(prefers-color-scheme: dark)').matches,
})

// Theme → <html> (Tailwind `dark` class). index.html sets it pre-paint; this keeps it in sync.
store.subscribe(() => {
  const { theme } = store.getState()
  if (!theme) return
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
})
store.actions.init()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StoreProvider store={store}>
      <App />
    </StoreProvider>
  </StrictMode>,
)
