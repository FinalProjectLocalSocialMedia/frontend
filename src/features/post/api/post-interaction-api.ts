import { postHttp } from "./http-client"
import type { PostCursorPage } from "../types/post"
import { GeoPoint } from "../types/geo-point"
import { core } from "zod"

export type CursorPostsParams = {
    cursor?: string
    limit?: number
}


export const likePost= async (postId: string) =>{
    const response= await postHttp.put(`/post/posts/${postId}/like`, undefined, {
    })
    return response.data
}

export const unlikePost= async (postId: string) =>{
    const response= await postHttp.delete(`/post/posts/${postId}/like`, {
    })
    return response.data
}

export const likeComment= async ({commentId, postId}: {commentId: string; postId: string}) =>{
    const response= await postHttp.put(`/post/posts/${postId}/comments/${commentId}/like`, undefined, {
    })
    return response.data
}

export const unlikeComment= async ({commentId, postId}: {commentId: string; postId: string}) =>{
    const response= await postHttp.delete(`/post/posts/${postId}/comments/${commentId}/like`, {
    })
    return response.data
}

export const savePost= async (postId: string) =>{
    const response= await postHttp.put(`/post/posts/${postId}/save`, undefined, {
    })
    return response.data
}

export const unsavePost= async (postId: string) =>{
    const response= await postHttp.delete(`/post/posts/${postId}/save`, {
    })
    return response.data
}

export const getSavedPosts = async ({
    cursor,
    limit = 20,
}: CursorPostsParams = {}): Promise<PostCursorPage> => {
    const response = await postHttp.get<PostCursorPage>(`/post/users/me/saved-posts`, {
        params: { cursor, limit },
    })
    return response.data
}
export const getUserPosts = async (
    userId: string,
    { cursor, limit = 20 }: CursorPostsParams = {},
): Promise<PostCursorPage> => {
    const response = await postHttp.get<PostCursorPage>(`/post/users/${userId}/posts`, {
        params: { cursor, limit },
    })
    return response.data
}
export const getLikedPosts = async ({
    cursor,
    limit = 20,
}: CursorPostsParams = {}): Promise<PostCursorPage> => {
    const response = await postHttp.get<PostCursorPage>(`/post/users/me/liked-posts`, {
        params: { cursor, limit },
    })
    return response.data
}

export const sharePost = async (postId: string, content: string, gpsPosition: GeoPoint | null) => {
    const coordinates = gpsPosition ? { latitude: gpsPosition.latitude, longitude: gpsPosition.longitude } : null
    const message= content.trim()
    const response = await postHttp.post(`/post/posts/${postId}/share`, { message, coordinates })
    return response.data
}