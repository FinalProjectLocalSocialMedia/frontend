import { NormalUser } from "./NormalUser"

export interface LikeComment{
    user: NormalUser
    target: Comment
    createdAt: string
}