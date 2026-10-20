import { useEffect } from 'react'

/** Đặt `document.title` cho trang admin (SEO/UX); khôi phục tiêu đề cũ khi rời trang. */
export function usePageTitle(title: string, enabled = true) {
  useEffect(() => {
    if (!enabled) return
    const previous = document.title
    document.title = `${title} · nearby. Admin`
    return () => {
      document.title = previous
    }
  }, [title, enabled])
}
