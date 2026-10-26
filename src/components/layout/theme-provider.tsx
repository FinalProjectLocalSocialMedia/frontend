import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'nearby-theme' // keep in sync with the inline script in index.html
const DARK_QUERY = '(prefers-color-scheme: dark)'

type ThemeContextValue = {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
})

const prefersDark = () =>
  typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches

function readStoredTheme(): Theme {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    if (value === 'light' || value === 'dark' || value === 'system') return value
  } catch {
    /* storage unavailable */
  }
  return 'system'
}

let forceLightRefCount = 0
const forceLightListeners = new Set<() => void>()

function notifyForceLightListeners() {
  forceLightListeners.forEach((listener) => listener())
}

/** Hook to force light theme while the calling component is mounted (ref-counted). */
export function useForceLight() {
  useEffect(() => {
    forceLightRefCount++
    notifyForceLightListeners()
    return () => {
      forceLightRefCount = Math.max(0, forceLightRefCount - 1)
      notifyForceLightListeners()
    }
  }, [])
}

/** Minimal theme provider: toggles the `dark` class on <html>, persists the choice, follows the OS. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme)
  const [systemDark, setSystemDark] = useState(prefersDark)
  const [isForcedLight, setIsForcedLight] = useState(() => forceLightRefCount > 0)

  useEffect(() => {
    const update = () => setIsForcedLight(forceLightRefCount > 0)
    forceLightListeners.add(update)
    return () => {
      forceLightListeners.delete(update)
    }
  }, [])

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const media = window.matchMedia(DARK_QUERY)
    const onChange = () => setSystemDark(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const baseResolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme
  const resolvedTheme = isForcedLight ? 'light' : baseResolvedTheme

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
  }, [resolvedTheme])

  const setTheme = (next: Theme) => {
    setThemeState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  )
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
