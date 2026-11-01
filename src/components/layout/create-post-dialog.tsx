import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { uploadPostMedia } from '@/features/post/api/post-upload-api'
import { PostMediaUploader } from '@/features/post/components/post-media-uploader'
import type { PostMedia } from '@/features/post/types/post-media'
import { currentLocation } from '@/lib/mock-nearby'
import { usePosts } from '@/lib/posts-context'

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
  const { addPost } = usePosts()
  const [text, setText] = useState('')
  const { stagedFiles, error, addFiles, removeFile, clearFiles } = useStagedMedia({
    allowedTypes: POST_MEDIA_TYPES,
  })

  const createPostMutation = useMutation({
    mutationFn: async ({ content, files }: { content: string; files: File[] }) => {
      const uploadedMedia: PostMedia[] =
        files.length > 0 ? await Promise.all(files.map((file) => uploadPostMedia(file))) : []

      return createPost({
        content,
        media: uploadedMedia.length > 0 ? uploadedMedia : undefined,
        coordinates: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        },
      })
    },
    onSuccess: (post) => {
      addPost({
        items: [post],
        page: {
          nextCursor: null,
          hasMore: false,
        },
      })
      void queryClient.invalidateQueries({ queryKey: ['posts', 'feed'] })
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
    createPostMutation.mutate({
      content: value,
      files: stagedFiles.map((item) => item.file),
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chia sẻ bài viết</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            <MapPin className="size-3.5 text-primary" /> {currentLocation.name}
          </DialogDescription>
        </DialogHeader>
        <Textarea
          autoFocus
          value={text}
          maxLength={MAX_LENGTH}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit()
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
          <span className="text-xs text-muted-foreground">
            {/* {text.length}/{MAX_LENGTH} */}
          </span>
          <Button
            onClick={submit}
            disabled={(!text.trim() && stagedFiles.length === 0) || createPostMutation.isPending}
          >
            {createPostMutation.isPending ? 'Đang đăng…' : 'Đăng bài'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
