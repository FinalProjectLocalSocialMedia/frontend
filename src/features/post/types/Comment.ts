import { LikeComment } from "./like-comment"
import { NormalUser } from "./normal-user"

export interface Comment{
    id: string
    author: NormalUser
    content: string
    media: string | null
    createdAt: string
    updatedAt: string
    parentComment: Comment | null
    likes: LikeComment[] | null
}