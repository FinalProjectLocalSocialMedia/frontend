import { NormalUser } from './normal-user'
import { Post } from './post'

export interface LikePost {
  user: NormalUser
  target: Post
  createdAt: string
}
