import { InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query"
import { likeComment, unlikeComment } from "../api/post-interaction-api"
import { Comment, CommentCursorPage } from "../types/comment"
import { postKeys } from "../api/post-queries"
import { Post } from "../types/post"
import { toast } from "sonner"


export const useToggleCommentLike = (comment: Comment, postId: string) => {
    const queryClient = useQueryClient()
    const commentKeys = [
        ['post-comments', postId],
        ['comment-replies', postId],
    ] as const
    const commentLikeMutation = useMutation({
        mutationFn: (nextLiked: boolean) => (nextLiked ? likeComment({ commentId: comment.id, postId }) : unlikeComment({ commentId: comment.id, postId })),
        onMutate: async (nextLiked) => {
            await Promise.all(
                commentKeys.map((queryKey) =>
                    queryClient.cancelQueries({ queryKey }),
                ),
            )

            const previousCaches = commentKeys.flatMap((queryKey) =>
                queryClient.getQueriesData<InfiniteData<CommentCursorPage>>({
                    queryKey,
                }),
            )


            commentKeys.forEach((queryKey) => {
                queryClient.setQueriesData<InfiniteData<CommentCursorPage>>({ queryKey }, (current) => {
                    if (!current) return current
                    return {
                        ...current,
                        pages: current.pages.map((page) => ({
                            ...page,
                            items: page.items.map((item) => {
                                if (item.id !== comment.id) return item
                                const wasLiked = item.isLikedByMe ?? false
                                if (wasLiked === nextLiked) return item

                                return {
                                    ...item,
                                    isLikedByMe: nextLiked,
                                    likeCount: Math.max(0, (item.likeCount ?? 0) + (nextLiked ? 1 : -1)),
                                }
                            }),
                        })),
                    }
                })
            })


            return { previousCaches }
        },
        onError: (error, _nextLiked, context) => {
            context?.previousCaches.forEach(([queryKey, data]) => {
                queryClient.setQueryData(queryKey, data)
            })

            toast.error('Không thể cập nhật lượt thích', {
                description: error instanceof Error ? error.message: 'Vui lòng thử lại sau.',
            })
        },

        onSettled: () => {
            commentKeys.forEach((queryKey) => {
                void queryClient.invalidateQueries({ queryKey })
            })
        },
    })

    return commentLikeMutation

}