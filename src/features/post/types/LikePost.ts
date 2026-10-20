import { NormalUser } from "./NormalUser";
import { Post } from "./Post";

export interface LikePost{
    user: NormalUser
    target: Post
    createdAt: string
}