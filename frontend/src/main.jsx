import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import EmailGate from './components/EmailGate.jsx'
import { HttpExtractor } from './extractor'
import { HttpRepo, LocalStorageRepo } from './persistence'
import { createAppStore, StoreProvider } from './store'

// Profile = email typed at sign-in (no auth). Boards live in Neon under it; prefs stay local.
const PROFILE_KEY = 'profile:email'
const readEmail = () => {
  try {
    return localStorage.getItem(PROFILE_KEY)
  } catch {
    return null
  }
}
// Reload so the store starts fresh against the new profile's boards.
const switchProfile = (email) => {
  if (email) localStorage.setItem(PROFILE_KEY, email)
  else localStorage.removeItem(PROFILE_KEY)
  location.reload()
}

const email = readEmail()
const root = createRoot(document.getElementById('root'))

if (!email) {
  root.render(
    <StrictMode>
      <EmailGate onSubmit={switchProfile} />
    </StrictMode>,
  )
} else {
  start(email)
}

function start(email) {
  // Swap persistence / extractor here — nothing else changes.
  const prefsRepo = new LocalStorageRepo()
  const store = createAppStore(new HttpRepo(email), new HttpExtractor(), {
    prefsRepo,
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

  root.render(
    <StrictMode>
      <StoreProvider store={store}>
        <App onSignOut={() => switchProfile(null)} />
      </StoreProvider>
    </StrictMode>,
  )
}
