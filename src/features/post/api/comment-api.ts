import { CommentCursorPage } from "../types/comment"
import { postHttp } from "./http-client"

export type GetCommentsByPostIdParams = {
  postId: string
  cursor?: string
  limit?: number
}


export async function getCommentsByPostId({postId, cursor, limit = 5}: GetCommentsByPostIdParams): Promise<CommentCursorPage> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw new RangeError('Comment limit must be an integer between 1 and 50')
  }
  const response = await postHttp.get<CommentCursorPage>(`/post/posts/${postId}/comments`, {
    params: { cursor, limit }
  })
  return response.data
}