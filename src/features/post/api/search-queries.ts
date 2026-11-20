import { keepPreviousData, useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import type { GeoPoint } from '../types/geo-point'
import { searchPosts } from './post-api'
import { isSearchResetError, searchUsers, suggestUsers } from './search-api'

const SUGGEST_STALE_TIME_MS = 30_000
const SEARCH_STALE_TIME_MS = 30_000
const POST_SEARCH_PAGE_SIZE = 10
const USER_SEARCH_PAGE_SIZE = 30

export interface PostSearchFilters {
  locationId?: string
  topic?: string
  latitude?: number
  longitude?: number
  radiusKm?: number
}

export const searchKeys = {
  all: ['search'] as const,
  suggest: (q: string) => [...searchKeys.all, 'suggest', q] as const,
  posts: (q: string, filters?: PostSearchFilters) =>
    [...searchKeys.all, 'posts', q, filters ?? {}] as const,
  users: (q: string) => [...searchKeys.all, 'users', q] as const,
}

/**
 * Query gợi ý người dùng cho dropdown thanh search Home.
 * Chỉ kích hoạt khi từ khoá có ít nhất 2 ký tự.
 */
export function useUserSuggestQuery(q: string) {
  const trimmedQ = q.trim()

  return useQuery({
    queryKey: searchKeys.suggest(trimmedQ),
    enabled: trimmedQ.length >= 2,
    staleTime: SUGGEST_STALE_TIME_MS,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => suggestUsers(trimmedQ, signal),
  })
}

export interface UseSearchPostsOptions {
  q?: string
  locationId?: string
  topic?: string
  coordinates?: GeoPoint
  radiusKm?: number
}

/**
 * Query tìm kiếm bài viết phân trang cursor (tab Bài viết).
 */
export function useSearchPostsQuery({
  q = '',
  locationId,
  topic,
  coordinates,
  radiusKm,
}: UseSearchPostsOptions) {
  const queryClient = useQueryClient()
  const trimmedQ = q.trim()
  const trimmedLocationId = locationId?.trim() || undefined
  const trimmedTopic = topic?.trim() || undefined

  const filters: PostSearchFilters = {
    ...(trimmedLocationId ? { locationId: trimmedLocationId } : {}),
    ...(trimmedTopic ? { topic: trimmedTopic } : {}),
    ...(coordinates
      ? { latitude: coordinates.latitude, longitude: coordinates.longitude }
      : {}),
    ...(radiusKm !== undefined ? { radiusKm } : {}),
  }
  const queryKey = searchKeys.posts(trimmedQ, filters)
  const hasAnyFilter = Boolean(trimmedQ || trimmedLocationId || trimmedTopic)

  return useInfiniteQuery({
    queryKey,
    enabled: hasAnyFilter,
    staleTime: SEARCH_STALE_TIME_MS,
    initialPageParam: undefined as string | undefined,
    retry: (failureCount, error) => !isSearchResetError(error) && failureCount < 1,
    queryFn: async ({ pageParam, signal }) => {
      try {
        return await searchPosts({
          q: trimmedQ,
          locationId: trimmedLocationId,
          topic: trimmedTopic,
          cursor: pageParam,
          limit: POST_SEARCH_PAGE_SIZE,
          latitude: coordinates?.latitude,
          longitude: coordinates?.longitude,
          radiusKm,
          signal,
        })
      } catch (error) {
        if (pageParam && isSearchResetError(error)) {
          queueMicrotask(() => {
            void queryClient.resetQueries({ queryKey, exact: true })
          })
        }
        throw error
      }
    },
    getNextPageParam: (lastPage) => lastPage.page.nextCursor || undefined,
  })
}

/**
 * Query tìm kiếm người dùng phân trang cursor (tab Người dùng, tối đa 30/trang).
 * Chỉ enabled sau khi query bài viết đã chạy xong (isFetched).
 */
export function useSearchUsersQuery(q: string, enabled: boolean) {
  const queryClient = useQueryClient()
  const trimmedQ = q.trim()
  const queryKey = searchKeys.users(trimmedQ)

  return useInfiniteQuery({
    queryKey,
    enabled: Boolean(trimmedQ) && enabled,
    staleTime: SEARCH_STALE_TIME_MS,
    initialPageParam: undefined as string | undefined,
    retry: (failureCount, error) => !isSearchResetError(error) && failureCount < 1,
    queryFn: async ({ pageParam, signal }) => {
      try {
        return await searchUsers({
          q: trimmedQ,
          cursor: pageParam,
          limit: USER_SEARCH_PAGE_SIZE,
          signal,
        })
      } catch (error) {
        if (pageParam && isSearchResetError(error)) {
          queueMicrotask(() => {
            void queryClient.resetQueries({ queryKey, exact: true })
          })
        }
        throw error
      }
    },
    getNextPageParam: (lastPage) => lastPage.page.nextCursor || undefined,
  })
}
