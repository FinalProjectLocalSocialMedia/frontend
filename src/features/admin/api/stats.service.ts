import { USE_MOCK } from '@/features/admin-moderation/lib/constants'
import type {
  PostStats,
  RequestOptions,
  StatsRange,
  TrendingHashtag,
  TrendingPost,
} from '@/features/admin-moderation/lib/types'
import { httpStatsService } from './stats.http'
import { mockStatsService } from './stats.mock'

export interface StatsService {
  getPostStats(range?: StatsRange, options?: RequestOptions): Promise<PostStats>

  getTrendingHashtags(
    params?: { range?: StatsRange; limit?: number },
    options?: RequestOptions,
  ): Promise<TrendingHashtag[]>

  getTrendingPosts(
    params?: { range?: StatsRange; limit?: number },
    options?: RequestOptions,
  ): Promise<TrendingPost[]>
}

export const statsService: StatsService = USE_MOCK ? mockStatsService : httpStatsService
