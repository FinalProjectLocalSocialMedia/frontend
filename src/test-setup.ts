import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

type ViewportWindow = Window & { __DESKTOP__?: boolean }

/** Switch the simulated viewport between desktop (≥1024px) and mobile in a test. */
export function setViewport(desktop: boolean) {
  ;(window as ViewportWindow).__DESKTOP__ = desktop
}

beforeEach(() => {
  if (typeof window !== 'undefined') {
    setViewport(true)
    window.localStorage.clear()
    window.scrollTo = vi.fn() as never
    if (typeof Element !== 'undefined') {
      Element.prototype.scrollIntoView = vi.fn()
    }
    // jsdom has no matchMedia; emulate only the `lg` breakpoint query used by the app.
    window.matchMedia = ((query: string) => ({
      matches: query.includes('min-width: 1024px')
        ? ((window as ViewportWindow).__DESKTOP__ ?? true)
        : query.includes('prefers-color-scheme: dark')
          ? false
          : false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia
  }
})

afterEach(() => {
  cleanup()
  if (typeof document !== 'undefined') {
    document.documentElement.className = ''
  }
})
