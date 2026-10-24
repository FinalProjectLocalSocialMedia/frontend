import type {
  PostStats,
  RequestOptions,
  StatsRange,
  TrendingHashtag,
  TrendingPost,
} from '@/features/admin-moderation/lib/types'
import type { StatsService } from './stats.service'

const DEFAULT_WEIGHTS = {
  view: 0.05,
  like: 0.15,
  comment: 0.3,
  share: 0.4,
  save: 0.1,
}

export function calculatePostScore(
  counts: TrendingPost['counts'],
  weights = DEFAULT_WEIGHTS
): number {
  const raw =
    counts.views * weights.view +
    counts.likes * weights.like +
    counts.comments * weights.comment +
    counts.shares * weights.share +
    counts.saves * weights.save
  return Math.round(raw * 10) / 10
}

const mockPostsData: Omit<TrendingPost, 'score'>[] = [
  {
    id: 'b1111111-bbbb-4444-8888-111111111111',
    content:
      'Góc check-in siêu hot tại Hồ Gươm sáng nay! Thời tiết Hà Nội mùa thu đẹp mê mẩn, không khí mát lành với nắng vàng rực rỡ, rất thích hợp cho một buổi dạo bộ cuối tuần cùng bạn bè và người thương.',
    author: {
      id: '33333333-3333-3333-3333-333333333333',
      displayName: 'Nguyễn Văn An',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    },
    locationName: 'Hồ Hoàn Kiếm, Hoàn Kiếm, Hà Nội',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    counts: {
      views: 1240,
      likes: 312,
      comments: 64,
      shares: 28,
      saves: 45,
    },
  },
  {
    id: 'b2222222-bbbb-4444-8888-222222222222',
    content:
      'Cảnh báo kẹt xe nghiêm trọng trên đường Nguyễn Trãi hướng đi Ngã Tư Sở. Mọi người nên chủ động chọn lộ trình khác qua Lê Văn Lương hoặc đường ven sông Tô Lịch để tránh mất nhiều thời gian nhé!',
    author: {
      id: '44444444-4444-4444-4444-444444444444',
      displayName: 'Trần Thị Bình',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
    locationName: 'Ngã Tư Sở, Đống Đa, Hà Nội',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    counts: {
      views: 2450,
      likes: 185,
      comments: 92,
      shares: 84,
      saves: 19,
    },
  },
  {
    id: 'b3333333-bbbb-4444-8888-333333333333',
    content:
      'Tìm thấy quán cà phê view ngắm hoàng hôn đỉnh cao tại hồ Tây. Không gian yên tĩnh, nhạc lofi nhẹ nhàng, đồ uống ổn áp và đặc biệt là ánh hoàng hôn buông xuống mặt hồ cực kỳ lãng mạn.',
    author: {
      id: '55555555-5555-5555-5555-555555555555',
      displayName: 'Lê Hoàng Long',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
    },
    locationName: 'Đường ven Hồ Tây, Tây Hồ, Hà Nội',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    counts: {
      views: 980,
      likes: 240,
      comments: 42,
      shares: 16,
      saves: 68,
    },
  },
  {
    id: 'b4444444-bbbb-4444-8888-444444444444',
    content:
      'Review chi tiết khu ẩm thực đêm Chợ Hôm: những món ăn vặt không thể bỏ lỡ từ phở cuốn, nộm bò khô đến bánh tráng nướng và chè sắn nóng hổi.',
    author: {
      id: '33333333-3333-3333-3333-333333333333',
      displayName: 'Nguyễn Văn An',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    },
    locationName: 'Chợ Hôm, Hai Bà Trưng, Hà Nội',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    counts: {
      views: 1560,
      likes: 290,
      comments: 38,
      shares: 22,
      saves: 52,
    },
  },
  {
    id: 'b5555555-bbbb-4444-8888-555555555555',
    content:
      'Đại hội âm nhạc cuối tuần tại phố đi bộ Hà Nội quy tụ rất đông bạn trẻ tham gia. Bầu không khí cuồng nhiệt và tràn đầy năng lượng tuổi trẻ!',
    author: {
      id: '44444444-4444-4444-4444-444444444444',
      displayName: 'Trần Thị Bình',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
    locationName: 'Phố đi bộ Đinh Tiên Hoàng, Hoàn Kiếm, Hà Nội',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    counts: {
      views: 3100,
      likes: 420,
      comments: 110,
      shares: 75,
      saves: 30,
    },
  },
]

const mockHashtagsData: TrendingHashtag[] = [
  {
    hashtagId: 'h1111111-1111-1111-1111-111111111111',
    name: 'hanoi',
    postCount: 168,
    previousPostCount: 124,
    changePct: 35.5,
  },
  {
    hashtagId: 'h2222222-2222-2222-2222-222222222222',
    name: 'hotay',
    postCount: 142,
    previousPostCount: 130,
    changePct: 9.2,
  },
  {
    hashtagId: 'h3333333-3333-3333-3333-333333333333',
    name: 'checkin',
    postCount: 115,
    previousPostCount: 90,
    changePct: 27.8,
  },
  {
    hashtagId: 'h4444444-4444-4444-4444-444444444444',
    name: 'streetfood',
    postCount: 98,
    previousPostCount: 112,
    changePct: -12.5,
  },
  {
    hashtagId: 'h5555555-5555-5555-5555-555555555555',
    name: 'cafe',
    postCount: 86,
    previousPostCount: 65,
    changePct: 32.3,
  },
  {
    hashtagId: 'h6666666-6666-6666-6666-666666666666',
    name: 'hoankiem',
    postCount: 74,
    previousPostCount: 58,
    changePct: 27.6,
  },
  {
    hashtagId: 'h7777777-7777-7777-7777-777777777777',
    name: 'weekend',
    postCount: 69,
    previousPostCount: 75,
    changePct: -8.0,
  },
  {
    hashtagId: 'h8888888-8888-8888-8888-888888888888',
    name: 'traffic',
    postCount: 54,
    previousPostCount: 42,
    changePct: 28.6,
  },
  {
    hashtagId: 'h9999999-9999-9999-9999-999999999999',
    name: 'sunset',
    postCount: 48,
    previousPostCount: 36,
    changePct: 33.3,
  },
  {
    hashtagId: 'haaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'photography',
    postCount: 42,
    previousPostCount: 40,
    changePct: 5.0,
  },
]

export const mockStatsService: StatsService = {
  async getPostStats(range: StatsRange = '7d', _opts?: RequestOptions): Promise<PostStats> {
    await new Promise((r) => setTimeout(r, 200))

    const days = range === '90d' ? 90 : range === '30d' ? 30 : 7
    const series: { date: string; count: number }[] = []

    const now = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      // Generate realistic daily post count between 15 and 65
      const baseCount = 25 + Math.floor(Math.sin(i * 0.5) * 12) + (i % 3) * 5
      series.push({ date: dateStr, count: baseCount })
    }

    const currentPeriodSum = series.reduce((sum, s) => sum + s.count, 0)
    const prevPeriodMock = Math.round(currentPeriodSum * 0.88)
    const growthPct =
      prevPeriodMock > 0
        ? Math.round(((currentPeriodSum - prevPeriodMock) / prevPeriodMock) * 1000) / 10
        : 100.0

    return {
      overview: {
        totalPosts: 1480,
        newPosts: {
          today: series[series.length - 1]?.count ?? 28,
          last7d: 215,
          last30d: 890,
        },
        growthPct,
        activeAuthors: 112,
      },
      series,
    }
  },

  async getTrendingHashtags(
    params?: { range?: StatsRange; limit?: number },
    _opts?: RequestOptions
  ): Promise<TrendingHashtag[]> {
    await new Promise((r) => setTimeout(r, 150))
    const limit = params?.limit ?? 10
    const multiplier = params?.range === '90d' ? 3.2 : params?.range === '30d' ? 1.8 : 1.0

    return mockHashtagsData.slice(0, limit).map((h) => ({
      ...h,
      postCount: Math.round(h.postCount * multiplier),
      previousPostCount: Math.round(h.previousPostCount * multiplier),
    }))
  },

  async getTrendingPosts(
    params?: { range?: StatsRange; limit?: number },
    _opts?: RequestOptions
  ): Promise<TrendingPost[]> {
    await new Promise((r) => setTimeout(r, 200))
    const limit = params?.limit ?? 10

    const posts = mockPostsData.map((p) => {
      const score = calculatePostScore(p.counts)
      return {
        ...p,
        score,
      } as TrendingPost
    })

    posts.sort((a, b) => b.score - a.score)
    return posts.slice(0, limit)
  },
}
