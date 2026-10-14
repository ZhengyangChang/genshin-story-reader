import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

export type Preferences = {
  schemaVersion: 1
  theme: 'day' | 'night'
  readingMode: 'brief' | 'detailed'
  completedEditionKeys: string[]
  fontSize: number
  lineWidth: number
  lastArticleId: string | null
  visitedArticleIds: string[]
  completedArticleIds: string[]
}
const defaults: Preferences = {
  schemaVersion: 1,
  theme: 'day',
  readingMode: 'brief',
  completedEditionKeys: [],
  fontSize: 19,
  lineWidth: 36,
  lastArticleId: null,
  visitedArticleIds: [],
  completedArticleIds: [],
}
const key = 'genshin-story-reader-v1'
const stringList = (value: unknown): string[] =>
  Array.isArray(value)
    ? [...new Set(value.filter((v): v is string => typeof v === 'string'))]
    : []
export function validatePreferences(value: unknown): Preferences {
  if (
    !value ||
    typeof value !== 'object' ||
    !('schemaVersion' in value) ||
    value.schemaVersion !== 1
  )
    return { ...defaults }
  const raw = value as Partial<Preferences>
  const clamp = (value: unknown, min: number, max: number, fallback: number) =>
    typeof value === 'number' && Number.isFinite(value)
      ? Math.round(Math.max(min, Math.min(max, value)))
      : fallback
  return {
    ...defaults,
    theme: raw.theme === 'night' ? 'night' : 'day',
    readingMode: raw.readingMode === 'detailed' ? 'detailed' : 'brief',
    completedEditionKeys: Array.isArray(raw.completedEditionKeys)
      ? stringList(raw.completedEditionKeys).filter((key) =>
          /^[a-z0-9-]+:(brief|detailed)$/.test(key),
        )
      : stringList(raw.completedArticleIds).map((id) => `${id}:brief`),
    fontSize: clamp(raw.fontSize, 16, 24, 19),
    lineWidth: clamp(raw.lineWidth, 26, 42, 36),
    lastArticleId:
      typeof raw.lastArticleId === 'string' ? raw.lastArticleId : null,
    visitedArticleIds: stringList(raw.visitedArticleIds),
    completedArticleIds: stringList(raw.completedArticleIds),
  }
}
const Context = createContext<{
  prefs: Preferences
  ready: boolean
  update: (fn: (old: Preferences) => Preferences) => void
} | null>(null)
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState(defaults)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key)
      setPrefs(
        raw
          ? validatePreferences(JSON.parse(raw))
          : {
              ...defaults,
              theme: matchMedia('(prefers-color-scheme: dark)').matches
                ? 'night'
                : 'day',
            },
      )
    } catch {
      /* Reading remains available without browser storage. */
    }
    setReady(true)
  }, [])
  useEffect(() => {
    if (!ready) return
    document.documentElement.dataset.theme = prefs.theme
    document.documentElement.style.setProperty(
      '--reader-size',
      `${prefs.fontSize}px`,
    )
    document.documentElement.style.setProperty(
      '--reader-width',
      `${prefs.lineWidth}em`,
    )
    try {
      localStorage.setItem(key, JSON.stringify(prefs))
    } catch {
      /* Storage may be unavailable. */
    }
  }, [prefs, ready])
  return (
    <Context.Provider value={{ prefs, ready, update: setPrefs }}>
      {children}
    </Context.Provider>
  )
}
export function usePreferences() {
  const value = useContext(Context)
  if (!value) throw new Error('Missing preferences provider')
  return value
}
