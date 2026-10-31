import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Heart, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Comment as CommentData } from '@/features/post/types/comment'
import { UserAvatar } from './user-avatar'
import { PostMediaGrid } from './post-media-grid'
import { CommentReplies } from './comment-replies'
import { CommentComposer } from './comment-composer'

function formatCommentTime(createdAt: string) {
  const date = new Date(createdAt)
  return Number.isNaN(date.getTime()) ? createdAt : formatDistanceToNow(date, { addSuffix: true })
}

export function CommentCard({ comment, postId }: { comment: CommentData; postId: string }) {
  const [replying, setReplying] = useState(false)

  return (
    <article className="flex gap-3 py-3">
      <UserAvatar user={comment.author} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <p className="text-sm font-semibold">{comment.author.fullName}</p>
          <time
            className="text-xs text-muted-foreground"
            dateTime={comment.createdAt}
            title={comment.createdAt}
          >
            {formatCommentTime(comment.createdAt)}
          </time>
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
          <Heart aria-hidden="true" className="size-3.5" />
          <span>{comment.likeCount ?? 0}</span>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            aria-expanded={replying}
            aria-pressed={replying}
            onClick={() => setReplying((value) => !value)}
          >
            <MessageCircle aria-hidden="true" />
            Reply
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
