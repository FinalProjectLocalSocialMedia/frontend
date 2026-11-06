import { useInfiniteQuery } from '@tanstack/react-query'
import { getFeed } from './post-api'
import { getLikedPosts, getSavedPosts, getUserPosts } from './post-interaction-api'
import type { PostCursorPage } from '../types/post'

const FEED_PAGE_SIZE = 20
const PROFILE_PAGE_SIZE = 20

export const postKeys = {
  all: ['posts'] as const,
  feed: () => [...postKeys.all, 'feed'] as const,
  profile: (userId: string | undefined) => [...postKeys.all, 'profile', userId] as const,
  liked: () => [...postKeys.all, 'liked'] as const,
  saved: () => [...postKeys.all, 'saved'] as const,
  detail: (postId: string) => ['post-detail', postId] as const,
}

function useCursorPosts(
  queryKey: readonly unknown[],
  fetchPage: (cursor: string | undefined) => Promise<PostCursorPage>,
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey,
    enabled,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    getNextPageParam: (lastPage) => lastPage.page.nextCursor || undefined,
    staleTime: 30_000,
  })
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

export function useUserPosts(userId: string | undefined, enabled = true) {
  return useCursorPosts(
    postKeys.profile(userId),
    (cursor) => {
      if (!userId) throw new Error('User ID is required to fetch profile posts')
      return getUserPosts(userId, { cursor, limit: PROFILE_PAGE_SIZE })
    },
    Boolean(userId) && enabled,
  )
}

export function useLikedPosts(enabled = true) {
  return useCursorPosts(
    postKeys.liked(),
    (cursor) => getLikedPosts({ cursor, limit: PROFILE_PAGE_SIZE }),
    enabled,
  )
}

export function useSavedPosts(enabled = true) {
  return useCursorPosts(
    postKeys.saved(),
    (cursor) => getSavedPosts({ cursor, limit: PROFILE_PAGE_SIZE }),
    enabled,
  )
}
