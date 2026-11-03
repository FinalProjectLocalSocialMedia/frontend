import { postHttp } from "./http-client"


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
