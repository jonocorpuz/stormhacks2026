// User preferences: global (not per board), one per browser.

export type Theme = 'light' | 'dark'

export interface Prefs {
  /** null → follow the browser setting. Set only by an explicit user choice. */
  theme: Theme | null
}

export const defaultPrefs = (): Prefs => ({ theme: null })

export const resolveTheme = (prefs: Prefs, systemDark: boolean): Theme =>
  prefs.theme ?? (systemDark ? 'dark' : 'light')

export const otherTheme = (theme: Theme): Theme => (theme === 'dark' ? 'light' : 'dark')
