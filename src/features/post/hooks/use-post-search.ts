import { useInfiniteQuery } from '@tanstack/react-query'
import { searchPosts } from '@/features/post/api/post-api'

const DEFAULT_PAGE_SIZE = 20

export function usePostSearch(query: string, locationId?: string) {
  const q = query.trim()

  return useInfiniteQuery({
    queryKey: ['posts', 'search', { q, locationId }],
    enabled: q.length > 0,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) =>
      searchPosts({
        q,
        locationId,
        cursor: pageParam,
        limit: DEFAULT_PAGE_SIZE,
        signal,
      }),
    getNextPageParam: (lastPage) => lastPage.page.nextCursor || undefined,
  })
}
