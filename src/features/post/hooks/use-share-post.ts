import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { sharePost } from '../api/post-interaction-api'
import { postKeys } from '../api/post-queries'
import { useUserLocation } from '@/features/map/hooks/use-user-location'
import { GeoPoint } from '../types/geo-point'

type SharePostVariables = {
  postId: string
  content: string
  gpsPosition: GeoPoint | null
}

export function useSharePost() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ postId, content, gpsPosition }: SharePostVariables) => sharePost(postId, content, gpsPosition),
    onSuccess: async (_data, { postId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: postKeys.all }),
        queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) }),
      ])
      toast.success('Đã chia sẻ bài viết')
    },
    onError: (error) => {
      toast.error('Không thể chia sẻ bài viết', {
        description: error instanceof Error ? error.message : 'Vui lòng thử lại sau.',
      })
    },
    
  })
}
