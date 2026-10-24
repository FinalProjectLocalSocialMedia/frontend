import { useQuery } from '@tanstack/react-query'
import type { StatsRange } from '@/features/admin-moderation/lib/types'
import { statsService } from './stats.service'

export const statsKeys = {
  all: ['admin', 'stats'] as const,
  posts: (range?: StatsRange) => [...statsKeys.all, 'posts', range ?? '7d'] as const,
  trendingHashtags: (range?: StatsRange, limit?: number) =>
    [...statsKeys.all, 'trending-hashtags', range ?? '7d', limit ?? 10] as const,
  trendingPosts: (range?: StatsRange, limit?: number) =>
    [...statsKeys.all, 'trending-posts', range ?? '7d', limit ?? 10] as const,
}

export function usePostStats(range: StatsRange = '7d') {
  return useQuery({
    queryKey: statsKeys.posts(range),
    queryFn: ({ signal }) => statsService.getPostStats(range, { signal }),
    staleTime: 60_000,
  })
}

export function useTrendingHashtags(range: StatsRange = '7d', limit = 10) {
  return useQuery({
    queryKey: statsKeys.trendingHashtags(range, limit),
    queryFn: ({ signal }) => statsService.getTrendingHashtags({ range, limit }, { signal }),
    staleTime: 60_000,
  })
}

export function useTrendingPosts(range: StatsRange = '7d', limit = 10) {
  return useQuery({
    queryKey: statsKeys.trendingPosts(range, limit),
    queryFn: ({ signal }) => statsService.getTrendingPosts({ range, limit }, { signal }),
    staleTime: 60_000,
  })
}
