import type { CommentCursorPage } from '../types/comment'
import type { PostMedia } from '../types/post-media'
import { postHttp } from './http-client'

export type GetCommentsByPostIdParams = {
  postId: string
  cursor?: string
  limit?: number
}

export async function getCommentsByPostId({
  postId,
  cursor,
  limit = 5,
}: GetCommentsByPostIdParams): Promise<CommentCursorPage> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw new RangeError('Comment limit must be an integer between 1 and 50')
  }
  const response = await postHttp.get<CommentCursorPage>(`/post/posts/${postId}/comments`, {
    params: { cursor, limit },
  })
  return response.data
}

export type GetCommentReplyByCommentIdParams = {
  postId: string
  commentId: string
  cursor?: string
  limit?: number
}
export async function getCommentReplyByCommentId({
  postId,
  commentId,
  cursor,
  limit = 5,
}: GetCommentReplyByCommentIdParams): Promise<CommentCursorPage> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw new RangeError('Comment limit must be an integer between 1 and 50')
  }
  const response = await postHttp.get<CommentCursorPage>(
    `/post/posts/${postId}/comments/${commentId}/replies`,
    {
      params: { cursor, limit },
    },
  )

  return response.data
}

export type createCommentParams = {
  postId: string
  content: string
  parentCommentId?: string
  media?: PostMedia[] | null
}

export async function createComment({
  postId,
  content,
  parentCommentId,
  media,
}: createCommentParams): Promise<void> {
  await postHttp.post(`/post/posts/${postId}/comments`, {
    content,
    parentCommentId,
    media,
  })
}
