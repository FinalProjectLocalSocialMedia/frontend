import { useState } from 'react'
import {  Heart, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

import { formatRelativeTime } from '@/lib/date-time'
import type { Comment as CommentData } from '@/features/post/types/comment'
import { useAuth } from '@/features/auth/context/auth-context'
import { UserAvatar } from './user-avatar'
import { PostMediaGrid } from './post-media-grid'
import { CommentReplies } from './comment-replies'
import { CommentComposer } from './comment-composer'
import { useToggleCommentLike } from '../hooks/use-toggle-comment-like'
import { useDeleteComment } from '../hooks/use-delete-comment'
import { CommentAction } from './comment-action'
import { vi } from 'date-fns/locale'

export function CommentCard({ comment, postId }: { comment: CommentData; postId: string }) {
  const [replying, setReplying] = useState(false)
  
  const { user } = useAuth()
  const isOwnComment = user?.id === comment.author.id
  const commentLikeMutation = useToggleCommentLike(comment, postId)
  const deleteCommentMutation = useDeleteComment(postId)

  

  return (
    <article className="flex gap-3 py-3">
      <UserAvatar user={comment.author} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
            <p className="text-sm font-semibold">{comment.author.fullName}</p>
            <time
              className="text-xs text-muted-foreground"
              dateTime={comment.createdAt}
              title={comment.createdAt}
            >
              {formatRelativeTime(comment.createdAt)}
            </time>
          </div>
          <CommentAction
            comment={comment}
            isOwnComment={isOwnComment}
            deleteCommentMutation={deleteCommentMutation}
          />
        </div>
        {comment.content && (
          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-foreground/90">
            {comment.content}
          </p>
        )}
        {comment.media && (
          <div className="-ml-11 mt-2 max-w-[400px]">
            <PostMediaGrid media={comment.media} />
          </div>
        )}
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            aria-label={comment.isLikedByMe ? 'Bỏ thích bình luận' : 'Thích bình luận'}
            aria-pressed={comment.isLikedByMe}
            disabled={commentLikeMutation.isPending}
            onClick={() => commentLikeMutation.mutate(!comment.isLikedByMe)}
          >
            <Heart
              aria-hidden="true"
              className={`size-3.5 ${comment.isLikedByMe ? 'fill-red-500 text-red-500' : ''}`}
            />
            {comment.likeCount ?? 0}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            aria-expanded={replying}
            aria-pressed={replying}
            onClick={() => setReplying((value) => !value)}
          >
            <MessageCircle aria-hidden="true" />
            Trả lời
          </Button>
        </div>

        {replying && (
          <div className="mt-3">
            <CommentComposer
              postId={postId}
              parentCommentId={comment.id}
              onCreated={() => setReplying(false)}
            />
          </div>
        )}

        {(comment.commentCount ?? 0) > 0 && <CommentReplies comment={comment} postId={postId} />}
      </div>
    </article>
  )
}
