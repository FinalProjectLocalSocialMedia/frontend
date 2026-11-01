import type { FormEvent } from 'react'
import { useState } from 'react'
import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useStagedMedia } from '@/hooks/use-staged-media'
import { createComment } from '../api/comment-api'
import { uploadPostMediaBatch } from '../api/post-upload-api'
import type { CommentCursorPage } from '../types/comment'
import type { PostSearchItem } from '../types/post'
import { PostMediaUploader } from './post-media-uploader'

const COMMENT_MEDIA_TYPES = ['IMAGE', 'VIDEO'] as const

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
  const { stagedFiles, error, addFiles, removeFile, clearFiles } = useStagedMedia({
    allowedTypes: COMMENT_MEDIA_TYPES,
  })
  const isReply = Boolean(parentCommentId)
  const mutation = useMutation({
    mutationFn: async ({ text, files }: { text: string; files: File[] }) => {
      const uploadedMedia = files.length > 0 ? await uploadPostMediaBatch(files) : []

      return createComment({
        postId,
        content: text,
        parentCommentId,
        media: uploadedMedia.length > 0 ? uploadedMedia : undefined,
      })
    },
    onSuccess: async () => {
      queryClient.setQueryData<PostSearchItem>(['post-detail', postId], (post) =>
        post ? { ...post, commentCount: post.commentCount ? post.commentCount + 1 : 1 } : post,
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
      clearFiles()
      onCreated?.()
      toast.success(isReply ? 'Đã gửi câu trả lời' : 'Đã đăng bình luận')

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['post-detail', postId] }),
        queryClient.invalidateQueries({ queryKey: ['post-comments', postId] }),
        queryClient.invalidateQueries({ queryKey: ['comment-replies', postId] }),
      ])
    },
    onError: (err) => {
      toast.error(isReply ? 'Không thể gửi câu trả lời' : 'Không thể đăng bình luận', {
        description: err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.',
      })
    },
  })

  function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedContent = content.trim()
    if ((!trimmedContent && stagedFiles.length === 0) || mutation.isPending) return

    mutation.mutate({
      text: trimmedContent,
      files: stagedFiles.map((item) => item.file),
    })
  }

  return (
    <form onSubmit={submitComment} className="space-y-3">
      <Textarea
        aria-label={isReply ? 'Viết câu trả lời' : 'Viết bình luận'}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={isReply ? 'Viết câu trả lời…' : 'Viết bình luận…'}
        disabled={mutation.isPending}
        className="min-h-20"
      />
      <PostMediaUploader
        stagedFiles={stagedFiles}
        onFilesAdd={addFiles}
        onFileRemove={removeFile}
        error={error}
        disabled={mutation.isPending}
        isUploading={mutation.isPending && stagedFiles.length > 0}
      />
      <div className="flex items-center justify-end gap-2">
        {onCreated && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={mutation.isPending}
            onClick={() => {
              clearFiles()
              onCreated()
            }}
          >
            Hủy
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          disabled={(!content.trim() && stagedFiles.length === 0) || mutation.isPending}
        >
          <Send aria-hidden="true" />
          {mutation.isPending ? 'Đang gửi…' : isReply ? 'Trả lời' : 'Bình luận'}
        </Button>
      </div>
    </form>
  )
}
