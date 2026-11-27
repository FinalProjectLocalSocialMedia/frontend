import { useQuery } from '@tanstack/react-query'
import { getTrendingKeywords, getTrendingPosts, type GetTrendingKeywordsParams, type GetTrendingPostsParams } from './trending-api'

export const trendingKeys = {
  all: ['trending'] as const,
  posts: (params?: GetTrendingPostsParams) => [...trendingKeys.all, 'posts', params] as const,
  keywords: (params?: GetTrendingKeywordsParams) => [...trendingKeys.all, 'keywords', params] as const,
}

export function useTrendingPostsQuery(params?: GetTrendingPostsParams, enabled = true) {
  return useQuery({
    queryKey: trendingKeys.posts(params),
    queryFn: () => getTrendingPosts(params),
    staleTime: 10_000,
    refetchOnWindowFocus: true,
    enabled,
  })
}

export function useTrendingKeywordsQuery(params?: GetTrendingKeywordsParams, enabled = true) {
  return useQuery({
    queryKey: trendingKeys.keywords(params),
    queryFn: () => getTrendingKeywords(params),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    enabled,
  })
}
