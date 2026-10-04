import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { HttpExtractor } from './extractor'
import { LocalStorageRepo } from './persistence'
import { createAppStore, StoreProvider } from './store'

// Swap persistence / extractor here (e.g. new SupabaseRepo()) — nothing else changes.
const store = createAppStore(new LocalStorageRepo(), new HttpExtractor())
store.actions.init()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StoreProvider store={store}>
      <App />
    </StoreProvider>
  </StrictMode>,
)
