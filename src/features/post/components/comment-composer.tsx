import type { FormEvent } from 'react'
import { useState } from 'react'
import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createComment } from '../api/comment-api'
import { uploadPostMedia } from '../api/post-upload-api'
import type { createCommentParams } from '../api/comment-api'
import type { CommentCursorPage } from '../types/comment'
import type { Post } from '../types/post'
import { PostMediaUploader } from './post-media-uploader'

function incrementParentCommentCount(
  data: InfiniteData<CommentCursorPage> | undefined,
  parentCommentId: string,
) {
  if (!data) return data

  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.map((comment) =>
        comment.id === parentCommentId
          ? { ...comment, commentCount: (comment.commentCount ?? 0) + 1 }
          : comment,
      ),
    })),
  }
}

export function CommentComposer({
  postId,
  parentCommentId,
  onCreated,
}: {
  postId: string
  parentCommentId?: string
  onCreated?: () => void
}) {
  const queryClient = useQueryClient()
  const [content, setContent] = useState('')
  const [media, setMedia] = useState<NonNullable<createCommentParams['media']>>([])
  const isReply = Boolean(parentCommentId)
  const mutation = useMutation({
    mutationFn: (request: createCommentParams) => createComment(request),
    onSuccess: async () => {
      queryClient.setQueryData<Post>(['post-detail', postId], (post) =>
        post ? { ...post, commentCount: post.commentCount + 1 } : post,
      )
      if (parentCommentId) {
        queryClient.setQueriesData<InfiniteData<CommentCursorPage>>(
          { queryKey: ['post-comments', postId] },
          (data) => incrementParentCommentCount(data, parentCommentId),
        )
        queryClient.setQueriesData<InfiniteData<CommentCursorPage>>(
          { queryKey: ['comment-replies', postId] },
          (data) => incrementParentCommentCount(data, parentCommentId),
        )
      }
      setContent('')
      setMedia([])
      onCreated?.()
      toast.success(isReply ? 'Reply posted' : 'Comment posted')

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['post-detail', postId] }),
        queryClient.invalidateQueries({ queryKey: ['post-comments', postId] }),
        queryClient.invalidateQueries({ queryKey: ['comment-replies', postId] }),
      ])
    },
    onError: (error) => {
      toast.error(isReply ? 'Could not post reply' : 'Could not post comment', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
      })
    },
  })

  function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedContent = content.trim()
    if ((!trimmedContent && media.length === 0) || mutation.isPending) return

    mutation.mutate({
      postId,
      content: trimmedContent,
      parentCommentId,
      media: media.length ? media : undefined,
    })
  }

  return (
    <form onSubmit={submitComment} className="space-y-3">
      <Textarea
        aria-label={isReply ? 'Write a reply' : 'Write a comment'}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={isReply ? 'Write a reply…' : 'Write a comment…'}
        disabled={mutation.isPending}
        className="min-h-20"
      />
      <PostMediaUploader
        media={media}
        onMediaChange={setMedia}
        uploadFile={uploadPostMedia}
        disabled={mutation.isPending}
      />
      <div className="flex items-center justify-end gap-2">
        {onCreated && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={mutation.isPending}
            onClick={onCreated}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          disabled={(!content.trim() && media.length === 0) || mutation.isPending}
        >
          <Send aria-hidden="true" />
          {mutation.isPending ? 'Sending…' : isReply ? 'Reply' : 'Comment'}
        </Button>
      </div>
    </form>
  )
}
