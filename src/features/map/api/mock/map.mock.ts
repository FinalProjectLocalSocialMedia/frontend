import { cellToParent } from 'h3-js'
import { containsPoint, haversineMeters } from '@/components/map/geo'
import { MAP_CONFIG } from '../../lib/map-config'
import { isWithinTimeRange, resolveTimeFilter } from '../../lib/time-filter'
import type {
  CommentItem,
  DensityCell,
  DensityQuery,
  DensityResponse,
  MapPlace,
  MapSearchQuery,
  PageResponse,
  PlaceMarkersQuery,
  PlacePostsQuery,
  PlaceSummary,
  PostCardData,
  PostDetail,
  PublicProfile,
  SearchResponse,
  TopicFeedQuery,
  TopicMarker,
  TopicMarkersQuery,
  TrendingTopic,
  Uuid,
} from '../../lib/types'
import type {
  FeedService,
  MapService,
  RequestOptions,
  SearchService,
  UserService,
} from '../map.service'
import { seedDatabase } from './seed'

/** Giả lập độ trễ mạng thực tế (150-300ms) có hỗ trợ huỷ bằng AbortSignal */
function delay(ms = 180, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      return reject(new DOMException('Aborted', 'AbortError'))
    }
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true },
    )
  })
}

function getWindowMs(window: '1d' | '7d' | '30d'): number {
  switch (window) {
    case '1d':
      return 24 * 60 * 60 * 1000
    case '7d':
      return 7 * 24 * 60 * 60 * 1000
    case '30d':
      return 30 * 24 * 60 * 60 * 1000
  }
}

function toCardData(post: PostDetail): PostCardData {
  return {
    id: post.id,
    author: post.author,
    excerpt: post.content.length > 160 ? `${post.content.slice(0, 157)}...` : post.content,
    firstImageUrl: post.imageUrls[0],
    imageCount: post.imageUrls.length,
    createdAt: post.createdAt,
    place: post.place,
    topics: post.topics,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
  }
}

// Kho lưu trữ bình luận trong bộ nhớ khởi tạo từ seed
const inMemoryComments: CommentItem[] = [...seedDatabase.comments]

export const mockMapService: MapService = {
  async getDensity(q: DensityQuery, o?: RequestOptions): Promise<DensityResponse> {
    await delay(180, o?.signal)

    const now = new Date()
    const cutoffMs = now.getTime() - getWindowMs(q.window)

    // Lọc các địa điểm nằm trong bounds của truy vấn
    const placesInBounds = seedDatabase.places.filter((p) => containsPoint(q.bounds, p.center))
    const placeIdSet = new Set(placesInBounds.map((p) => p.id))
    const placeMap = new Map(placesInBounds.map((p) => [p.id, p]))

    // Tìm các bài viết tại các địa điểm này trong khoảng thời gian thống kê
    const eligiblePosts = seedDatabase.posts.filter((p) => {
      if (!placeIdSet.has(p.place.id)) return false
      return new Date(p.createdAt).getTime() >= cutoffMs
    })

    // Gom số lượng theo ô H3 ánh xạ về độ phân giải mục tiêu
    const cellCountMap = new Map<string, number>()
    eligiblePosts.forEach((post) => {
      const place = placeMap.get(post.place.id)
      if (!place) return

      let targetCell = place.h3Index
      if (q.resolution < 8) {
        targetCell = cellToParent(place.h3Index, q.resolution)
      }
      cellCountMap.set(targetCell, (cellCountMap.get(targetCell) || 0) + 1)
    })

    // Xây dựng danh sách ô mật độ
    const cells: DensityCell[] = []
    let maxCount = 0

    cellCountMap.forEach((count, h3Index) => {
      if (cells.length < MAP_CONFIG.MAX_CELLS) {
        cells.push({ h3Index, count })
        if (count > maxCount) {
          maxCount = count
        }
      }
    })

    return {
      resolution: q.resolution,
      window: q.window,
      cells,
      maxCount,
      totalPosts: eligiblePosts.length,
      generatedAt: new Date().toISOString(),
    }
  },

  async getPlaceMarkers(q: PlaceMarkersQuery, o?: RequestOptions): Promise<MapPlace[]> {
    await delay(160, o?.signal)

    const now = new Date()
    const cutoffMs = now.getTime() - getWindowMs(q.window)

    const placesInBounds = seedDatabase.places.filter((p) => containsPoint(q.bounds, p.center))

    const computedPlaces: MapPlace[] = placesInBounds.map((place) => {
      const placePosts = seedDatabase.posts.filter(
        (post) =>
          post.place.id === place.id && new Date(post.createdAt).getTime() >= cutoffMs,
      )

      // Điểm xu hướng: số lượng bài viết có trọng số theo độ mới
      let trendScore = 0
      const topicCounter = new Map<string, number>()

      placePosts.forEach((post) => {
        const ageHours = (now.getTime() - new Date(post.createdAt).getTime()) / (3600 * 1000)
        const recencyWeight = Math.max(0.2, 1 - ageHours / (24 * 7))
        trendScore += 1 * recencyWeight + post.likeCount * 0.1

        post.topics.forEach((t) => topicCounter.set(t, (topicCounter.get(t) || 0) + 1))
      })

      let topTopic: string | undefined
      let topTopicCount = 0
      topicCounter.forEach((count, topic) => {
        if (count > topTopicCount) {
          topTopicCount = count
          topTopic = topic
        }
      })

      return {
        ...place,
        postCount: placePosts.length,
        trendScore: Math.round(trendScore * 10) / 10,
        topTopic,
      }
    })

    computedPlaces.sort((a, b) => b.trendScore - a.trendScore)
    return computedPlaces.slice(0, q.limit || MAP_CONFIG.MAX_PLACE_MARKERS)
  },

  async getTopicMarkers(q: TopicMarkersQuery, o?: RequestOptions): Promise<TopicMarker[]> {
    await delay(160, o?.signal)

    const now = new Date()
    const cutoffMs = now.getTime() - getWindowMs(q.window)

    const placesInBounds = seedDatabase.places.filter((p) => containsPoint(q.bounds, p.center))
    const markers: TopicMarker[] = []

    placesInBounds.forEach((place) => {
      const placePosts = seedDatabase.posts.filter(
        (post) =>
          post.place.id === place.id && new Date(post.createdAt).getTime() >= cutoffMs,
      )

      if (placePosts.length === 0) return

      const topicCounts = new Map<string, number>()
      placePosts.forEach((p) => {
        p.topics.forEach((t) => topicCounts.set(t, (topicCounts.get(t) || 0) + 1))
      })

      let topTopic: string | undefined
      let topCount = 0
      topicCounts.forEach((cnt, topic) => {
        if (cnt > topCount) {
          topCount = cnt
          topTopic = topic
        }
      })

      if (topTopic) {
        markers.push({
          id: `${place.id}:${topTopic}`,
          placeId: place.id,
          placeName: place.name,
          topic: topTopic,
          postCount: topCount,
          score: topCount * 10 + placePosts.length,
          position: place.center, // Bằng toạ độ công khai của địa điểm (R3)
        })
      }
    })

    markers.sort((a, b) => b.score - a.score)
    return markers.slice(0, q.limit || MAP_CONFIG.MAX_TOPIC_MARKERS)
  },

  async getPlaceSummary(placeId: Uuid, o?: RequestOptions): Promise<PlaceSummary> {
    await delay(150, o?.signal)

    const place = seedDatabase.places.find((p) => p.id === placeId)
    if (!place) {
      throw new Error(`Place not found: ${placeId}`)
    }

    const now = new Date().getTime()
    const postsAtPlace = seedDatabase.posts.filter((p) => p.place.id === placeId)

    const last1d = postsAtPlace.filter((p) => now - new Date(p.createdAt).getTime() <= 24 * 3600 * 1000).length
    const last7d = postsAtPlace.filter((p) => now - new Date(p.createdAt).getTime() <= 7 * 24 * 3600 * 1000).length
    const last30d = postsAtPlace.filter((p) => now - new Date(p.createdAt).getTime() <= 30 * 24 * 3600 * 1000).length

    // Các chủ đề thịnh hành trong 7 ngày qua
    const recent7dPosts = postsAtPlace.filter((p) => now - new Date(p.createdAt).getTime() <= 7 * 24 * 3600 * 1000)
    const topicMap = new Map<string, number>()
    recent7dPosts.forEach((p) => {
      p.topics.forEach((t) => topicMap.set(t, (topicMap.get(t) || 0) + 1))
    })

    const trendingTopics: TrendingTopic[] = Array.from(topicMap.entries())
      .map(([name, postCount]) => ({
        name,
        postCount,
        score: postCount * 10,
      }))
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, 10)

    return {
      place: {
        ...place,
        postCount: last7d,
        description: `Địa điểm hoạt động sôi nổi tại khu vực Hà Nội.`,
      },
      counts: { last1d, last7d, last30d },
      latestPostAt: postsAtPlace[0]?.createdAt,
      trendingTopics,
    }
  },

  async getPlacePosts(q: PlacePostsQuery, o?: RequestOptions): Promise<PageResponse<PostCardData>> {
    await delay(180, o?.signal)

    const timeRange = resolveTimeFilter(q.time)
    let matching = seedDatabase.posts.filter((p) => p.place.id === q.placeId)

    matching = matching.filter((p) => isWithinTimeRange(p.createdAt, timeRange))

    if (q.topic) {
      matching = matching.filter((p) => p.topics.includes(q.topic!))
    }

    if (q.sort === 'TRENDING') {
      matching.sort((a, b) => b.likeCount * 2 + b.commentCount * 3 - (a.likeCount * 2 + a.commentCount * 3))
    } else {
      matching.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    const page = Math.max(1, q.page)
    const pageSize = Math.max(1, q.pageSize)
    const start = (page - 1) * pageSize
    const paged = matching.slice(start, start + pageSize).map(toCardData)

    return {
      items: paged,
      page,
      pageSize,
      total: matching.length,
    }
  },
}

export const mockFeedService: FeedService = {
  async getTopicFeed(q: TopicFeedQuery, o?: RequestOptions): Promise<PageResponse<PostCardData>> {
    await delay(180, o?.signal)

    let matching = seedDatabase.posts.filter((p) => p.topics.includes(q.topic))
    const timeRange = resolveTimeFilter(q.time)
    matching = matching.filter((p) => isWithinTimeRange(p.createdAt, timeRange))

    const scope = q.scope
    if (scope.kind === 'place') {
      matching = matching.filter((p) => p.place.id === scope.placeId)
    } else if (scope.kind === 'area') {
      const center = scope.center
      const radiusMeters = scope.radiusKm * 1000
      const placeMap = new Map(seedDatabase.places.map((pl) => [pl.id, pl]))

      matching = matching.filter((p) => {
        const place = placeMap.get(p.place.id)
        if (!place) return false
        return haversineMeters(center, place.center) <= radiusMeters
      })
    }

    if (q.sort === 'TRENDING') {
      matching.sort((a, b) => b.likeCount * 2 + b.commentCount * 3 - (a.likeCount * 2 + a.commentCount * 3))
    } else {
      matching.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    const page = Math.max(1, q.page)
    const pageSize = Math.max(1, q.pageSize)
    const start = (page - 1) * pageSize
    const paged = matching.slice(start, start + pageSize).map(toCardData)

    return {
      items: paged,
      page,
      pageSize,
      total: matching.length,
    }
  },

  async getPost(id: Uuid, o?: RequestOptions): Promise<PostDetail> {
    await delay(150, o?.signal)
    const post = seedDatabase.posts.find((p) => p.id === id)
    if (!post) {
      throw new Error(`Post not found: ${id}`)
    }
    return post
  },

  async getComments(
    postId: Uuid,
    p: { page: number; pageSize: number },
    o?: RequestOptions,
  ): Promise<PageResponse<CommentItem>> {
    await delay(150, o?.signal)
    const comments = inMemoryComments.filter((c) => c.postId === postId)
    const page = Math.max(1, p.page)
    const pageSize = Math.max(1, p.pageSize)
    const start = (page - 1) * pageSize
    const items = comments.slice(start, start + pageSize)

    return {
      items,
      page,
      pageSize,
      total: comments.length,
    }
  },

  async addComment(
    postId: Uuid,
    content: string,
    parentCommentId?: Uuid,
    o?: RequestOptions,
  ): Promise<CommentItem> {
    await delay(150, o?.signal)
    const newComment: CommentItem = {
      id: `cmt-dynamic-${Date.now()}`,
      postId,
      author: seedDatabase.profiles[0] || { id: 'usr-1', displayName: 'Minh Anh' },
      content,
      createdAt: new Date().toISOString(),
      parentCommentId,
      replyCount: 0,
    }
    inMemoryComments.unshift(newComment)
    return newComment
  },
}

export const mockSearchService: SearchService = {
  async search(q: MapSearchQuery, o?: RequestOptions): Promise<SearchResponse> {
    await delay(200, o?.signal)
    const term = q.q.toLowerCase().trim()
    if (!term) {
      return {
        q: q.q,
        posts: { items: [], page: 1, pageSize: q.pageSize, total: 0 },
        users: [],
        places: [],
      }
    }

    const timeRange = resolveTimeFilter(q.time)

    // Khớp địa điểm
    let places = seedDatabase.places.filter(
      (p) => p.name.toLowerCase().includes(term) || p.locationType.toLowerCase().includes(term),
    )
    if (q.scope?.center && q.scope.radiusKm) {
      const radiusM = q.scope.radiusKm * 1000
      places = places.filter((p) => haversineMeters(q.scope!.center!, p.center) <= radiusM)
    }

    // Khớp người dùng
    const users = seedDatabase.profiles.filter((u) => u.displayName.toLowerCase().includes(term))

    // Khớp bài viết
    let posts = seedDatabase.posts.filter((p) => {
      const matchText = p.content.toLowerCase().includes(term) || p.place.name.toLowerCase().includes(term)
      if (!matchText) return false
      return isWithinTimeRange(p.createdAt, timeRange)
    })

    if (q.scope?.placeId) {
      posts = posts.filter((p) => p.place.id === q.scope!.placeId)
    }

    const page = Math.max(1, q.page)
    const pageSize = Math.max(1, q.pageSize)
    const pagedPosts = posts.slice((page - 1) * pageSize, page * pageSize).map((p) => ({
      kind: 'POST' as const,
      ...toCardData(p),
    }))

    return {
      q: q.q,
      posts: {
        items: pagedPosts,
        page,
        pageSize,
        total: posts.length,
      },
      users: users.slice(0, 10).map((u) => ({
        kind: 'USER' as const,
        id: u.id,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        bio: u.bio,
      })),
      places: places.slice(0, 10).map((pl) => ({
        kind: 'PLACE' as const,
        id: pl.id,
        name: pl.name,
        locationType: pl.locationType,
        center: pl.center,
        postCount: pl.postCount,
      })),
    }
  },
}

export const mockUserService: UserService = {
  async getPublicProfile(id: Uuid, o?: RequestOptions): Promise<PublicProfile> {
    await delay(150, o?.signal)
    const profile = seedDatabase.profiles.find((p) => p.id === id)
    if (!profile) {
      throw new Error(`User not found: ${id}`)
    }
    return profile
  },

  async getUserPosts(
    id: Uuid,
    p: { page: number; pageSize: number },
    o?: RequestOptions,
  ): Promise<PageResponse<PostCardData>> {
    await delay(180, o?.signal)
    const userPosts = seedDatabase.posts.filter((post) => post.author.id === id)
    const page = Math.max(1, p.page)
    const pageSize = Math.max(1, p.pageSize)
    const start = (page - 1) * pageSize
    const items = userPosts.slice(start, start + pageSize).map(toCardData)

    return {
      items,
      page,
      pageSize,
      total: userPosts.length,
    }
  },
}
