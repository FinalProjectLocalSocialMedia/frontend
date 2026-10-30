import { LikeComment } from './like-comment'
import { PostMedia } from './post-media'

export interface Comment {
  id: string
  author: {
    id: string
    fullName: string
    avatarUrl?: string | null
  }
  content: string
  media?: PostMedia[] | null
  createdAt: string
  updatedAt: string
  parentComment: Comment | null
  likeCount?: number
  commentCount?: number
}

export interface CommentCursorPage {
  items: Comment[]
   page: {
    nextCursor?: string | null
    hasMore: boolean
  }
}