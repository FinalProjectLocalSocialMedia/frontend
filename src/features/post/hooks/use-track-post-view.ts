import { useViewTracker } from '../context/view-tracker-context'

export function useTrackPostView({
  postId,
  authorId,
}: {
  postId: string
  authorId: string
}) {
  const tracker = useViewTracker()

  // Ref callback inline, trả về cleanup (React 19). Không thêm useCallback/useMemo.
  const ref = (el: HTMLElement | null) =>
    el ? tracker.observe(el, { postId, authorId }) : undefined

  const trackActive = () => tracker.trackActive(postId, authorId)

  return { ref, trackActive }
}
