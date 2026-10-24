import { describe, it, expect } from 'vitest'
import { calculatePostScore, mockStatsService } from './stats.mock'

describe('Stats Service (Content Analytics & Trending)', () => {
  describe('getPostStats', () => {
    it('returns 7-day series and overview by default', async () => {
      const stats = await mockStatsService.getPostStats('7d')
      expect(stats.overview).toBeDefined()
      expect(stats.overview.totalPosts).toBeGreaterThan(0)
      expect(stats.overview.newPosts.today).toBeGreaterThanOrEqual(0)
      expect(stats.overview.newPosts.last7d).toBeGreaterThanOrEqual(0)
      expect(stats.overview.activeAuthors).toBeGreaterThanOrEqual(0)
      expect(typeof stats.overview.growthPct).toBe('number')

      expect(stats.series.length).toBe(7)
      expect(stats.series[0].date).toBeDefined()
      expect(typeof stats.series[0].count).toBe('number')
    })

    it('returns 30-day series when range is 30d', async () => {
      const stats = await mockStatsService.getPostStats('30d')
      expect(stats.series.length).toBe(30)
    })

    it('returns 90-day series when range is 90d', async () => {
      const stats = await mockStatsService.getPostStats('90d')
      expect(stats.series.length).toBe(90)
    })
  })

  describe('getTrendingHashtags', () => {
    it('returns top 10 trending hashtags by default', async () => {
      const hashtags = await mockStatsService.getTrendingHashtags({ range: '7d', limit: 10 })
      expect(hashtags.length).toBeLessThanOrEqual(10)
      expect(hashtags.length).toBeGreaterThan(0)

      const first = hashtags[0]
      expect(first.hashtagId).toBeDefined()
      expect(first.name).toBeDefined()
      expect(first.postCount).toBeGreaterThan(0)
      expect(typeof first.changePct).toBe('number')
    })

    it('respects the limit parameter', async () => {
      const hashtags = await mockStatsService.getTrendingHashtags({ range: '7d', limit: 3 })
      expect(hashtags.length).toBe(3)
    })

    it('adjusts counts when range is 30d or 90d', async () => {
      const hashtags7d = await mockStatsService.getTrendingHashtags({ range: '7d', limit: 5 })
      const hashtags30d = await mockStatsService.getTrendingHashtags({ range: '30d', limit: 5 })

      expect(hashtags30d[0].postCount).toBeGreaterThan(hashtags7d[0].postCount)
    })
  })

  describe('getTrendingPosts', () => {
    it('returns trending posts sorted by score descending', async () => {
      const posts = await mockStatsService.getTrendingPosts({ range: '7d', limit: 5 })
      expect(posts.length).toBeGreaterThan(0)
      expect(posts.length).toBeLessThanOrEqual(5)

      for (let i = 0; i < posts.length - 1; i++) {
        expect(posts[i].score).toBeGreaterThanOrEqual(posts[i + 1].score)
      }

      const topPost = posts[0]
      expect(topPost.id).toBeDefined()
      expect(topPost.content).toBeDefined()
      expect(topPost.author).toBeDefined()
      expect(topPost.counts).toBeDefined()
      expect(topPost.score).toBeGreaterThan(0)
    })

    it('respects the limit parameter', async () => {
      const posts = await mockStatsService.getTrendingPosts({ range: '7d', limit: 2 })
      expect(posts.length).toBe(2)
    })
  })

  describe('calculatePostScore', () => {
    it('calculates score based on interaction weights (view: 0.05, like: 0.15, comment: 0.3, share: 0.4, save: 0.1)', () => {
      const counts = {
        views: 100, // 100 * 0.05 = 5
        likes: 20, // 20 * 0.15 = 3
        comments: 10, // 10 * 0.3 = 3
        shares: 5, // 5 * 0.4 = 2
        saves: 10, // 10 * 0.1 = 1
      }
      // Total expected = 5 + 3 + 3 + 2 + 1 = 14
      const score = calculatePostScore(counts)
      expect(score).toBe(14)
    })

    it('recalculates score dynamically when weights change', () => {
      const counts = {
        views: 100,
        likes: 20,
        comments: 10,
        shares: 5,
        saves: 10,
      }
      const customWeights = {
        view: 0.1, // 10
        like: 0.2, // 4
        comment: 0.5, // 5
        share: 0.5, // 2.5
        save: 0.2, // 2
      }
      // Total = 10 + 4 + 5 + 2.5 + 2 = 23.5
      const score = calculatePostScore(counts, customWeights)
      expect(score).toBe(23.5)
      expect(score).not.toBe(calculatePostScore(counts))
    })
  })
})
