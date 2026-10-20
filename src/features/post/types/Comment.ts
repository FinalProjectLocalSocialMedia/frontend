import { LikeComment } from "./LikeComment"
import { NormalUser } from "./NormalUser"

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