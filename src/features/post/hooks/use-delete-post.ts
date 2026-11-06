import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deletePost } from "../api/post-api"
import { postKeys } from "../api/post-queries"
import { toast } from "sonner"



export const useDeletePost = () => {
    const queryClient = useQueryClient()
    const deletePostMutation = useMutation({
        mutationFn: (postId: string) => deletePost(postId),
        onSuccess: async(_, postId) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: postKeys.all }),
                queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) }),
            ])
            toast('Đã xóa bài viết')
        },
        onError: (_error) => {
            toast.error('Không thể xóa bài viết', {
                description: _error instanceof Error ? _error.message : 'Vui lòng thử lại sau.',
            })
        }
    })
    return deletePostMutation
}