import { formatDistanceToNow } from 'date-fns'
import { Heart } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Comment as CommentData } from '@/features/post/types/comment'
import { UserAvatar } from './user-avatar'

function formatCommentTime(createdAt: string) {
  const date = new Date(createdAt)
  return Number.isNaN(date.getTime()) ? createdAt : formatDistanceToNow(date, { addSuffix: true })
}

export function Comment({ comment }: { comment: CommentData }) {
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
          <img
            src={comment.media}
            alt={`Media attached by ${comment.author.fullName}`}
            className="mt-2 max-h-80 max-w-full rounded-xl border border-border object-cover"
          />
        )}
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Heart aria-hidden="true" className="size-3.5" />
          <span>{comment.likes?.length ?? 0}</span>
        </div>
      </div>
    </article>
  )
}
