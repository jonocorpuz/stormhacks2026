// User preferences: global (not per board), one per browser.

export type Theme = 'light' | 'dark'

export interface Prefs {
  /** null → follow the browser setting. Set only by an explicit user choice. */
  theme: Theme | null
  /** Display name for the profile avatar. Absent → no name set. */
  name?: string
  /** Board open when last used; reopened on launch if still listed. Absent → most recently updated. */
  lastBoardId?: string
}

export const defaultPrefs = (): Prefs => ({ theme: null })

export const resolveTheme = (prefs: Prefs, systemDark: boolean): Theme =>
  prefs.theme ?? (systemDark ? 'dark' : 'light')

export const otherTheme = (theme: Theme): Theme => (theme === 'dark' ? 'light' : 'dark')

/** Avatar initials: first + last word's first letters ("Ada Lovelace" → "AL"), one word → one letter. */
export function initials(name: string | null | undefined): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''
  const letters = words.length === 1 ? [words[0]] : [words[0], words[words.length - 1]]
  return letters.map((w) => [...w][0].toUpperCase()).join('')
}
