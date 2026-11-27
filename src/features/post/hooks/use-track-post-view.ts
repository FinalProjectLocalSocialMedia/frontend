import { useEffect, useRef } from 'react'
import { useViewTracker } from '../context/view-tracker-context'

export function useTrackPostView({
  postId,
  authorId,
}: {
  postId: string
  authorId: string
}) {
  const tracker = useViewTracker()
  const ref = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    return tracker.observe(el, { postId, authorId })
  }, [tracker, postId, authorId])

  const trackActive = () => tracker.trackActive(postId, authorId)

  return { ref, trackActive }
}
