import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { deleteComment } from '../api/comment-api'
import { postKeys } from '../api/post-queries'

export function useDeleteComment(postId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteComment,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['post-comments', postId] }),
        queryClient.invalidateQueries({ queryKey: ['comment-replies', postId] }),
        queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) }),
      ])
      toast.success('Đã xóa bình luận')
    },
    onError: (error) => {
      toast.error('Không thể xóa bình luận', {
        description: error instanceof Error ? error.message : 'Vui lòng thử lại sau.',
      })
    },
  })
}
