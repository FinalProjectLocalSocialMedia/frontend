import { postHttp } from './http-client'
import type { Post, PostCursorPage, PostUploadSignature } from '../types/post'
import { GeoPoint } from '../types/geo-point'
import { PostMedia } from '../types/post-media'
import { seedDatabase } from '@/features/map/api/mock/seed'

const CURRENT_USER_ID = '02139b2f-fbed-4009-b16d-a96b47e21b3c'

export type GetFeedParams = {
  cursor?: string
  limit?: number
}

export type SearchPostsParams = {
  q?: string
  locationId?: string
  topic?: string
  cursor?: string
  limit?: number
  signal?: AbortSignal
}
export interface CreatePostRequest {
  content: string
  media?: PostMedia[] | null
  coordinates?: GeoPoint | null
}

export async function requestPostUploadSignature(): Promise<PostUploadSignature> {
  const response = await postHttp.post<PostUploadSignature>('post/signature', undefined, {
  })
  return response.data
}

export async function createPost(request: CreatePostRequest): Promise<Post> {
  const response = await postHttp.post<Post>('/post/posts', request, {
  })
  return response.data
}

export async function getFeed({ cursor, limit = 20 }: GetFeedParams): Promise<PostCursorPage> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw new RangeError('Feed limit must be an integer between 1 and 50')
  }

  const response = await postHttp.get<PostCursorPage>('feed/feed/local', {
    params: { cursor, limit }
  })
  return response.data
}

/**
 * Hàm tìm kiếm bài viết mẫu từ cơ sở dữ liệu mock seedDatabase theo mục 6.8.
 * Hỗ trợ lọc theo locationId, topic/hashtag, và từ khoá q.
 */
export function mockSearchPosts({
  q = '',
  locationId,
  topic,
  cursor,
  limit = 20,
}: SearchPostsParams): PostCursorPage {
  // Lấy danh sách bài viết từ mock seed
  let matching = [...seedDatabase.posts]

  if (locationId) {
    matching = matching.filter((p) => p.place.id === locationId)
  }

  if (topic) {
    const cleanTopic = topic.replace(/^#/, '').toLowerCase()
    matching = matching.filter((p) =>
      p.topics.some((t) => t.toLowerCase() === cleanTopic),
    )
  }

  if (q.trim()) {
    const queryLower = q.toLowerCase()
    matching = matching.filter(
      (p) =>
        p.content.toLowerCase().includes(queryLower) ||
        p.author.displayName.toLowerCase().includes(queryLower) ||
        p.place.name.toLowerCase().includes(queryLower),
    )
  }

  const startIndex = cursor ? parseInt(cursor, 10) : 0
  const validStart = isNaN(startIndex) ? 0 : startIndex
  const sliced = matching.slice(validStart, validStart + limit)
  const nextIndex = validStart + limit < matching.length ? String(validStart + limit) : null

  return {
    items: sliced.map((item) => ({
      id: item.id,
      content: item.content,
      author: {
        id: item.author.id,
        fullName: item.author.displayName,
        avatarUrl: item.author.avatarUrl,
      },
      media: item.imageUrls?.length > 0
        ? item.imageUrls.map((url, idx) => (
            {
              id: `${item.id}-img-${idx}`,
              publicId: `${item.id}-pub-${idx}`,
              assetId: `${item.id}-asset-${idx}`,
              format: 'jpg',
              size: 102400,
              url,
              type: 'IMAGE',
              width: 600,
              height: 400,
            }
          ))
        : [],
      location: {
        name: item.place.name,
      },
      status: 'PUBLISHED',
      likeCount: item.likeCount,
      commentCount: item.commentCount,
      createdAt: item.createdAt,
    })),
    page: {
      nextCursor: nextIndex,
      hasMore: nextIndex !== null,
    },
  }
}

export async function searchPosts({
  q = '',
  locationId,
  topic,
  cursor,
  limit = 20,
  signal,
}: SearchPostsParams): Promise<PostCursorPage> {
  const query = q.trim()
  const trimmedLocationId = locationId?.trim()
  const trimmedTopic = topic?.trim()

  // Cho phép query rỗng nếu có locationId hoặc topic
  if (!query && !trimmedLocationId && !trimmedTopic) {
    throw new Error('Search query, locationId hoặc topic không được để trống')
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw new RangeError('Search limit must be an integer between 1 and 50')
  }

  if (import.meta.env.VITE_USE_MOCK === 'true') {
    return mockSearchPosts({ q: query, locationId: trimmedLocationId, topic: trimmedTopic, cursor, limit })
  }

  try {
    const response = await postHttp.get<PostCursorPage>('/post/posts', {
      params: {
        q: query || undefined,
        locationId: trimmedLocationId || undefined,
        topic: trimmedTopic || undefined,
        cursor,
        limit,
      },
      signal,
    })
    return response.data
  } catch {
    // Dự phòng fallback sang mock nếu backend chưa hỗ trợ tham số hoặc gặp sự cố
    return mockSearchPosts({ q: query, locationId: trimmedLocationId, topic: trimmedTopic, cursor, limit })
  }
}
