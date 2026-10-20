import { Comment } from "./Comment"
import { LikePost } from "./LikePost"
import { Location } from "./Location"
import { NormalUser } from "./NormalUser"

export interface Post{
    id: string
    author: NormalUser
    content: string
    media: string | null
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