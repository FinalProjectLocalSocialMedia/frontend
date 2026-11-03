import { useInfiniteQuery } from '@tanstack/react-query'
import { getFeed } from './post-api'

const FEED_PAGE_SIZE = 20

export const postKeys = {
  all: ['posts'] as const,
  feed: () => [...postKeys.all, 'feed'] as const,
  detail: (postId: string) => ['post-detail', postId] as const,
}

export function useFeedPosts() {
  return useInfiniteQuery({
    queryKey: postKeys.feed(),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => getFeed({ cursor: pageParam, limit: FEED_PAGE_SIZE }),
    getNextPageParam: (lastPage) => lastPage.page.nextCursor || undefined,
    staleTime: 30_000,
  })
}
