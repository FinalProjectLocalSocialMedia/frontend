import { postHttp } from './http-client'
import type { Post, PostCursorPage, PostUploadSignature } from '../types/post'
import { GeoPoint } from '../types/geo-point'
import { PostMedia } from '../types/post-media'

const CURRENT_USER_ID = '02139b2f-fbed-4009-b16d-a96b47e21b3c'

export type GetFeedParams = {
  cursor?: string
  limit?: number
}

export type SearchPostsParams = {
  q: string
  locationId?: string
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

export async function searchPosts({
  q,
  locationId,
  cursor,
  limit = 20,
  signal,
}: SearchPostsParams): Promise<PostCursorPage> {
  const query = q.trim()
  if (!query) throw new Error('Search query must not be empty')
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw new RangeError('Search limit must be an integer between 1 and 50')
  }

  const response = await postHttp.get<PostCursorPage>('/post/posts', {
    params: { q: query, locationId, cursor, limit },
    signal,
  })
  return response.data
}
