import { useEffect, useRef } from 'react'

type UseInfiniteScrollOptions = {
  enabled: boolean
  onLoadMore: () => void
}

export function useInfiniteScroll({ enabled, onLoadMore }: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const onLoadMoreRef = useRef(onLoadMore)

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore
  }, [onLoadMore])

  useEffect(() => {
    const target = sentinelRef.current
    if (!enabled || !target || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect()
          onLoadMoreRef.current()
        }
      },
      { rootMargin: '240px' },
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [enabled])

  return sentinelRef
}
