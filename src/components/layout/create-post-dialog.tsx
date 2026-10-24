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
import { createPost } from '@/features/post/api/post-api'
import { uploadPostMedia } from '@/features/post/api/post-upload-api'
import type { CreatePostRequest } from '@/features/post/api/post-api'
import { PostMediaUploader } from '@/features/post/components/post-media-uploader'
import type { PostMedia } from '@/features/post/types/post-media'
import { currentLocation } from '@/lib/mock-nearby'
import { usePosts } from '@/lib/posts-context'

const MAX_LENGTH = 280

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
  const [media, setMedia] = useState<PostMedia[]>([])
  const createPostMutation = useMutation({
    mutationFn: (request: CreatePostRequest) => createPost(request),
    onSuccess: (post) => {
      addPost({
        items: [post],
        page:{
          nextCursor: null,
          hasMore: false,
        }
      })
      void queryClient.invalidateQueries({ queryKey: ['posts', 'feed'] })
      setText('')
      setMedia([])
      onOpenChange(false)
      toast.success('Post shared', {
        description: 'Your update is now visible to people nearby.',
        action: { label: 'View', onClick: () => navigate('/') },
      })
    },
    onError: (error) => {
      toast.error('Could not share post', { description: error.message })
    },
  })

  function submit() {
    const value = text.trim()
    if ((!value && media.length === 0) || createPostMutation.isPending) return
    console.log('Submitting post with content:', value, 'and media:', media)
    createPostMutation.mutate({
      content: value,
      media: media.length > 0 ? media : undefined,
      coordinates: {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share an update</DialogTitle>
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
          placeholder="What's happening nearby?"
          className="min-h-28"
        />
        <PostMediaUploader
          media={media}
          onMediaChange={setMedia}
          uploadFile={uploadPostMedia}
          disabled={createPostMutation.isPending}
        />
        <DialogFooter className="items-center sm:justify-between">
          <span className="text-xs text-muted-foreground">
            {text.length}/{MAX_LENGTH}
          </span>
          <Button
            onClick={submit}
            disabled={(!text.trim() && media.length === 0) || createPostMutation.isPending}
          >
            {createPostMutation.isPending ? 'Posting…' : 'Post update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
