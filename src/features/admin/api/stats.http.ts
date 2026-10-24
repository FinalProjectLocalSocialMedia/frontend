import { adminHttp } from '@/features/admin-moderation/api/http-client'
import type {
  PostStats,
  RequestOptions,
  StatsRange,
  TrendingHashtag,
  TrendingPost,
} from '@/features/admin-moderation/lib/types'
import type { StatsService } from './stats.service'

/**
 * Hiện thực kết nối HTTP thật tới backend Moderation Service cho Thống kê nội dung.
 * Endpoint: /api/v1/admin/stats/*
 */
export const httpStatsService: StatsService = {
  getPostStats(range: StatsRange = '7d', opts?: RequestOptions): Promise<PostStats> {
    return adminHttp
      .get<PostStats>('/stats/posts', {
        params: { range },
        signal: opts?.signal,
      })
      .then((r) => r.data)
  },

  getTrendingHashtags(
    params?: { range?: StatsRange; limit?: number },
    opts?: RequestOptions
  ): Promise<TrendingHashtag[]> {
    return adminHttp
      .get<TrendingHashtag[]>('/stats/trending-hashtags', {
        params: {
          range: params?.range ?? '7d',
          limit: params?.limit ?? 10,
        },
        signal: opts?.signal,
      })
      .then((r) => r.data)
  },

  getTrendingPosts(
    params?: { range?: StatsRange; limit?: number },
    opts?: RequestOptions
  ): Promise<TrendingPost[]> {
    return adminHttp
      .get<TrendingPost[]>('/stats/trending-posts', {
        params: {
          range: params?.range ?? '7d',
          limit: params?.limit ?? 10,
        },
        signal: opts?.signal,
      })
      .then((r) => r.data)
  },
}
