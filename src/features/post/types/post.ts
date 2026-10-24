import { Comment } from './comment'
import { LikePost } from './like-post'
import { Location } from './location'
import { NormalUser } from './normal-user'
import { PostMedia } from './post-media'

export interface Post {
  id: string
  author: NormalUser
  content: string
  media: PostMedia[] | null
  location: Location
  status: string
  createdAt: string
  updatedAt: string
  sharedPost: Post | null
  likeCount: number
  commentCount: number
  shareCount: number
  comments: Comment[] | null
  likes: LikePost[] | null
}

export type PostSearchItem = {
  id: string
  author: {
    id: string
    fullName: string
    avatarUrl?: string | null
  }
  content: string
  media?: PostMedia[] | null
  location?: {
    name: string
  } | null
  status: string
  likeCount?: number
  commentCount?: number
  createdAt: string
}

export type PostCursorPage = {
  items: PostSearchItem[]
  page: {
    nextCursor?: string | null
    hasMore: boolean
  }
}

export type PostUploadSignature = {
  timestamp: number
  folder: string
  signature: string
}
