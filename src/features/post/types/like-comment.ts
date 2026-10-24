import { NormalUser } from './normal-user'

export interface LikeComment {
  user: NormalUser
  target: Comment
  createdAt: string
}
