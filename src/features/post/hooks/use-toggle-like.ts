import { InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query"
import { likePost,  unlikePost } from "../api/post-interaction-api"
import { postKeys } from "../api/post-queries"
import { Post, PostCursorPage, PostSearchItem } from "../types/post"
import { toast } from "sonner"


export const useToggleLike = (post: PostSearchItem) => {
    const queryClient = useQueryClient()
    const likeMutation = useMutation({
        mutationFn: (nextLiked: boolean) => (nextLiked ? likePost(post.id) : unlikePost(post.id)),
        onMutate: async (nextLiked) => {
            const detailKey = postKeys.detail(post.id)
            await Promise.all([
                queryClient.cancelQueries({ queryKey: postKeys.all }),
                queryClient.cancelQueries({ queryKey: detailKey }),
            ])

            const previousLiked = post.isLikedByMe ?? false
            const previousLikeCount = post.likeCount ?? 0

            queryClient.setQueriesData<InfiniteData<PostCursorPage, string | undefined>>(
                { queryKey: postKeys.all },
                (current) =>
                    current && {
                        ...current,
                        pages: current.pages.map((page) => ({
                            ...page,
                            items: page.items.map((item) =>
                                item.id === post.id
                                    ? {
                                        ...item,
                                        isLikedByMe: nextLiked,
                                        likeCount: Math.max(0, (item.likeCount ?? 0) + (nextLiked ? 1 : -1)),
                                    }
                                    : item,
                            ),
                        })),
                    },
            )
            queryClient.setQueryData<Post>(detailKey, (current) =>
                current
                    ? {
                        ...current,
                        isLikedByMe: nextLiked,
                        likeCount: Math.max(0, current.likeCount + (nextLiked ? 1 : -1)),
                    }
                    : current,
            )

            return { previousLiked, previousLikeCount }
        },
        onError: (_error, _nextLiked, context) => {
            queryClient.setQueriesData<InfiniteData<PostCursorPage, string | undefined>>(
                { queryKey: postKeys.all },
                (current) =>
                    current && {
                        ...current,
                        pages: current.pages.map((page) => ({
                            ...page,
                            items: page.items.map((item) =>
                                item.id === post.id
                                    ? {
                                        ...item,
                                        isLikedByMe: context?.previousLiked ?? false,
                                        likeCount: context?.previousLikeCount ?? 0,
                                    }
                                    : item,
                            ),
                        })),
                    },
            )
            queryClient.setQueryData<Post>(postKeys.detail(post.id), (current) =>
                current
                    ? {
                        ...current,
                        isLikedByMe: context?.previousLiked ?? false,
                        likeCount: context?.previousLikeCount ?? current.likeCount,
                    }
                    : current,
            )
            toast.error('Không thể cập nhật lượt thích', {
                description: _error instanceof Error ? _error.message : 'Vui lòng thử lại sau.',
            })
        },
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: postKeys.all })
            void queryClient.invalidateQueries({ queryKey: postKeys.detail(post.id) })
        },
    })
    return likeMutation

}