import { InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query"
import { PostCursorPage, PostSearchItem } from "../types/post"
import { savePost, unsavePost } from "../api/post-interaction-api"
import { postKeys } from "../api/post-queries"
import { toast } from "sonner"


export const useToggleSavePost = (post: PostSearchItem) => {
    const queryClient = useQueryClient()
    const savePostMutation = useMutation({
        mutationFn: (nextSaved: boolean) => (nextSaved ? savePost(post.id) : unsavePost(post.id)),
        onMutate: async (nextSaved) => {
            const detailKey = postKeys.detail(post.id)
            await Promise.all([
                queryClient.cancelQueries({ queryKey: postKeys.all }),
                queryClient.cancelQueries({ queryKey: detailKey }),
            ])
            const previousSaved = post.isSavedByMe ?? false

            queryClient.setQueriesData<PostSearchItem>({ queryKey: detailKey }, (current) =>
                current ? { ...current, isSavedByMe: nextSaved } : current,
            )
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
                                        isSavedByMe: nextSaved,
                                    }
                                    : item,
                            ),
                        })),
                    },
            )
            toast(!nextSaved ? 'Đã bỏ lưu bài viết' : 'Đã lưu bài viết')
            return { previousSaved }
        },
        onError: (_error, _nextSaved, context) => {
            queryClient.setQueriesData<PostSearchItem>({ queryKey: postKeys.detail(post.id) }, (current) =>
                current ? { ...current, isSavedByMe: context?.previousSaved } : current,
            )
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
                                        isSavedByMe: context?.previousSaved ?? false,
                                    }
                                    : item,
                            ),
                        })),
                    },
            )
            toast.error('Không thể lưu bài viết', {
                description: _error instanceof Error ? _error.message : 'Vui lòng thử lại sau.',
            })
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: postKeys.all })
            queryClient.invalidateQueries({ queryKey: postKeys.detail(post.id) })
        }
    })

    return savePostMutation

}