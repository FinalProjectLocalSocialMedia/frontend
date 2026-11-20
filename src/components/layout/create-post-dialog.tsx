import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import { toast } from 'sonner'
import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useStagedMedia } from '@/hooks/use-staged-media'
import { createPost } from '@/features/post/api/post-api'
import { postKeys } from '@/features/post/api/post-queries'
import { uploadPostMediaBatch } from '@/features/post/api/post-upload-api'
import { PostMediaUploader } from '@/features/post/components/post-media-uploader'
import type { PostMedia } from '@/features/post/types/post-media'
import type { PostCursorPage } from '@/features/post/types/post'
import { currentLocation } from '@/lib/mock-nearby'
import { useUserLocation } from '@/features/map/hooks/use-user-location'
import { getPlaceFromGeoPoint } from '@/features/post/api/google-map-api'

const MAX_LENGTH = 280
const POST_MEDIA_TYPES = ['IMAGE', 'VIDEO'] as const

export function CreatePostDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [text, setText] = useState('')
  const { stagedFiles, error, addFiles, removeFile, clearFiles } = useStagedMedia({
    allowedTypes: POST_MEDIA_TYPES,
  })
  const { gpsPosition, isLoadingGps } = useUserLocation({})
  const hasGPS = gpsPosition?.latitude != null && gpsPosition?.longitude != null

  const userLocation= useQuery({
    queryKey: ['user-location', gpsPosition?.latitude, gpsPosition?.longitude],
    queryFn: async () => {
      if (!gpsPosition) {
        console.log('GPS position is not available yet.')
        return null
      }
      return getPlaceFromGeoPoint(gpsPosition)
    },
    enabled: !!hasGPS,
  })

  const createPostMutation = useMutation({
    mutationFn: async ({ content, files, coordinates }: { content: string; files: File[]; coordinates: { latitude: number; longitude: number } }) => {
      const uploadedMedia: PostMedia[] = files.length > 0 ? await uploadPostMediaBatch(files) : []

      return createPost({
        content,
        media: uploadedMedia.length > 0 ? uploadedMedia : undefined,
        coordinates: {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        },
      })
    },
    onSuccess: (post) => {
      const createdPost = {
        ...post,
        createdAt: post.createdAt || new Date().toISOString(),
      }

      queryClient.setQueryData<InfiniteData<PostCursorPage, string | undefined>>(
        postKeys.feed(),
        (current) => {
          if (!current?.pages.length) {
            return {
              pages: [
                {
                  items: [createdPost],
                  page: { nextCursor: null, hasMore: false },
                },
              ],
              pageParams: [undefined],
            }
          }

          return {
            ...current,
            pages: current.pages.map((page, index) => ({
              ...page,
              items:
                index === 0
                  ? [createdPost, ...page.items.filter((item) => item.id !== createdPost.id)]
                  : page.items.filter((item) => item.id !== createdPost.id),
            })),
          }
        },
      )
      setText('')
      clearFiles()
      onOpenChange(false)
      toast.success('Đã đăng bài viết', {
        description: 'Bài viết của bạn hiện đã hiển thị với những người xung quanh.',
        action: { label: 'Xem', onClick: () => navigate('/') },
      })
    },
    onError: (err) => {
      toast.error('Không thể đăng bài viết', {
        description: err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.',
      })
    },
  })

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && !createPostMutation.isPending) {
      clearFiles()
    }
    onOpenChange(nextOpen)
  }

  function submit() {
    const value = text.trim()
    if ((!value && stagedFiles.length === 0) || createPostMutation.isPending) return
    if (isLoadingGps) {
      return
    }

    if (!gpsPosition) {
      toast.error('Không thể xác định vị trí của bạn', {
        description: 'Vui lòng bật định vị để đăng bài viết.',
      })
      return
    }
      
    createPostMutation.mutate({
      content: value,
      files: stagedFiles.map((item) => item.file),
      coordinates: {
        latitude: gpsPosition.latitude,
        longitude: gpsPosition.longitude,
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chia sẻ bài viết</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            <MapPin className="size-3.5 text-primary" /> {userLocation.data?.placeName ?? userLocation.data?.formattedAddress}
          </DialogDescription>
        </DialogHeader>
        <Textarea
          autoFocus
          value={text}
          maxLength={MAX_LENGTH}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)&& !isLoadingGps) submit()
          }}
          placeholder="Có điều gì đang diễn ra xung quanh bạn?"
          className="min-h-28"
        />
        <PostMediaUploader
          stagedFiles={stagedFiles}
          onFilesAdd={addFiles}
          onFileRemove={removeFile}
          error={error}
          disabled={createPostMutation.isPending}
          isUploading={createPostMutation.isPending && stagedFiles.length > 0}
        />
        <DialogFooter className="items-center sm:justify-between">
          <span className="text-xs text-muted-foreground">{/* {text.length}/{MAX_LENGTH} */}</span>
          <Button
            onClick={submit}
            disabled={(!text.trim() && stagedFiles.length === 0) || createPostMutation.isPending || isLoadingGps}
          >
            {createPostMutation.isPending ? 'Đang đăng…' : 'Đăng bài'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
