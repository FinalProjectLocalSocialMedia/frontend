import { describe, expect, it } from 'vitest'
import {
  mockFeedService,
  mockMapService,
  mockSearchService,
} from './mock/map.mock'
import { seedDatabase } from './mock/seed'

describe('mockMapService', () => {
  const hanoiBounds = {
    north: 21.15,
    south: 20.95,
    east: 105.95,
    west: 105.70,
  }

  it('aggregates density cells and returns valid density response', async () => {
    const res = await mockMapService.getDensity({
      bounds: hanoiBounds,
      resolution: 7,
      window: '7d',
    })

    expect(res.resolution).toBe(7)
    expect(res.window).toBe('7d')
    expect(res.cells.length).toBeGreaterThan(0)
    expect(res.maxCount).toBeGreaterThan(0)
    expect(res.totalPosts).toBeGreaterThan(0)
    expect(res.generatedAt).toBeDefined()
  })

  it('aborts density query immediately when AbortSignal is cancelled', async () => {
    const controller = new AbortController()
    controller.abort()

    await expect(
      mockMapService.getDensity(
        { bounds: hanoiBounds, resolution: 7, window: '7d' },
        { signal: controller.signal },
      ),
    ).rejects.toThrow()
  })

  it('retrieves place markers sorted by trend score within bounds', async () => {
    const places = await mockMapService.getPlaceMarkers({
      bounds: hanoiBounds,
      limit: 10,
      window: '7d',
    })

    expect(places.length).toBeGreaterThan(0)
    expect(places.length).toBeLessThanOrEqual(10)
    // Verify sorted descending by trendScore
    for (let i = 0; i < places.length - 1; i++) {
      expect(places[i].trendScore).toBeGreaterThanOrEqual(places[i + 1].trendScore)
    }
  })

  it('retrieves topic markers positioned at place center (R3)', async () => {
    const markers = await mockMapService.getTopicMarkers({
      bounds: hanoiBounds,
      limit: 15,
      window: '7d',
    })

    expect(markers.length).toBeGreaterThan(0)
    markers.forEach((m) => {
      expect(m.topic).toBeDefined()
      expect(m.position).toBeDefined()
      expect(m.position.latitude).toBeGreaterThan(20)
      expect(m.position.longitude).toBeGreaterThan(105)
    })
  })

  it('retrieves place summary with counts and trending topics', async () => {
    const firstPlace = seedDatabase.places[0]
    const summary = await mockMapService.getPlaceSummary(firstPlace.id)

    expect(summary.place.id).toBe(firstPlace.id)
    expect(summary.counts.last7d).toBeGreaterThanOrEqual(summary.counts.last1d)
    expect(summary.counts.last30d).toBeGreaterThanOrEqual(summary.counts.last7d)
    expect(Array.isArray(summary.trendingTopics)).toBe(true)
  })

  it('retrieves place posts without any coordinates on post object (R3)', async () => {
    const firstPlace = seedDatabase.places[0]
    const res = await mockMapService.getPlacePosts({
      placeId: firstPlace.id,
      time: { kind: 'all' },
      sort: 'NEWEST',
      page: 1,
      pageSize: 5,
    })

    expect(res.page).toBe(1)
    expect(res.pageSize).toBe(5)
    res.items.forEach((post) => {
      expect(post.place.id).toBe(firstPlace.id)
      expect(post.place.name).toBeDefined()
      // Enforce R3: posts MUST NOT contain coordinate fields
      expect((post as Record<string, unknown>).latitude).toBeUndefined()
      expect((post as Record<string, unknown>).longitude).toBeUndefined()
      expect((post as Record<string, unknown>).coordinate).toBeUndefined()
    })
  })
})

describe('mockSearchService', () => {
  it('returns empty result when query is blank', async () => {
    const res = await mockSearchService.search({
      q: '   ',
      time: { kind: 'all' },
      kinds: ['POST', 'PLACE', 'USER'],
      page: 1,
      pageSize: 10,
    })

    expect(res.posts.items.length).toBe(0)
    expect(res.places.length).toBe(0)
    expect(res.users.length).toBe(0)
  })

  it('finds matching places and posts for keyword', async () => {
    const res = await mockSearchService.search({
      q: 'Đại học',
      time: { kind: 'all' },
      kinds: ['POST', 'PLACE', 'USER'],
      page: 1,
      pageSize: 10,
    })

    expect(res.places.length).toBeGreaterThan(0)
    expect(res.places.some((p) => p.name.includes('Đại học'))).toBe(true)
  })
})

describe('mockFeedService', () => {
  it('retrieves post detail and allows adding comments in memory', async () => {
    const firstPost = seedDatabase.posts[0]
    const post = await mockFeedService.getPost(firstPost.id)
    expect(post.id).toBe(firstPost.id)
    expect(post.content).toBeDefined()

    const comment = await mockFeedService.addComment(post.id, 'Thử nghiệm bình luận mới')
    expect(comment.id).toBeDefined()
    expect(comment.content).toBe('Thử nghiệm bình luận mới')

    const commentsPage = await mockFeedService.getComments(post.id, { page: 1, pageSize: 10 })
    expect(commentsPage.items.some((c) => c.content === 'Thử nghiệm bình luận mới')).toBe(true)
  })
})
