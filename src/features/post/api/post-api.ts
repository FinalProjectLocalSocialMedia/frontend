import { postHttp } from './http-client'
import type { Post, PostCursorPage, PostUploadSignature } from '../types/post'
import { GeoPoint } from '../types/geo-point'
import { PostMedia } from '../types/post-media'


export type GetFeedParams = {
  cursor?: string
  limit?: number
  coordinates?: GeoPoint
  radiusKm?: number
  lastSeenId?: string
  lastSeenCreatedAt?: string
}

export type SearchPostsParams = {
  q?: string
  locationId?: string
  topic?: string
  cursor?: string
  limit?: number
  latitude?: number
  longitude?: number
  radiusKm?: number
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

export async function getFeed({ cursor, limit = 5, coordinates, radiusKm, lastSeenId, lastSeenCreatedAt }: GetFeedParams): Promise<PostCursorPage> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw new RangeError('Feed limit must be an integer between 1 and 50')
  }

  const response = await postHttp.get<PostCursorPage>('feed/feed/local', {
    params: { cursor, limit, latitude: coordinates?.latitude, longitude: coordinates?.longitude, radiusKm, lastSeenId, lastSeenCreatedAt },
  })
  return response.data
}

export async function getLatestFeed({ cursor, limit = 5, coordinates, radiusKm, lastSeenId, lastSeenCreatedAt }: GetFeedParams): Promise<PostCursorPage> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw new RangeError('Feed limit must be an integer between 1 and 50')
  }

  const response = await postHttp.get<PostCursorPage>('feed/feed/latest', {
    params: { cursor, limit, latitude: coordinates?.latitude, longitude: coordinates?.longitude, radiusKm, lastSeenId, lastSeenCreatedAt },
  })
  return response.data
}


export async function searchPosts({
  q = '',
  locationId,
  topic,
  cursor,
  limit = 5,
  signal,
  radiusKm,
  latitude,
  longitude,
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


  const response = await postHttp.get<PostCursorPage>('/post/posts', {
    params: {
      q: query || undefined,
      locationId: trimmedLocationId || undefined,
      topic: trimmedTopic || undefined,
      cursor,
      limit,
      radiusKm,
      latitude,
      longitude,
    },
    signal,
  })
  return response.data
}

export async function getPostById(postId: string): Promise<Post> {
  const response = await postHttp.get<Post>(`/post/posts/${postId}`)
  return response.data
}

export async function deletePost(postId: string): Promise<void> {
  await postHttp.delete(`/post/posts/${postId}`)
}