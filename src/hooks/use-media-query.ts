import { useSyncExternalStore } from 'react'

/** Subscribes to a CSS media query. `fallback` is used where matchMedia is unavailable (SSR, tests). */
export function useMediaQuery(query: string, fallback = true) {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window.matchMedia !== 'function') return () => {}
      const media = window.matchMedia(query)
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    },
    () => (typeof window.matchMedia === 'function' ? window.matchMedia(query).matches : fallback),
    () => fallback,
  )
}

/** Matches Tailwind's `lg` breakpoint. */
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)')
