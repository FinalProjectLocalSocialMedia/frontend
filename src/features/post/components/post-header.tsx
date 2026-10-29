import { Link } from 'react-router-dom'
import { UserAvatar } from './user-avatar'
import { formatDistanceToNow } from 'date-fns'
import { PostSearchItem } from '../types/post'

interface PostHeaderProps {
  post: PostSearchItem
}

export function PostHeader({ post }: PostHeaderProps) {
  return (
    <Link
      to={`/posts/${post.id}`}
      aria-label={`View post by ${post.author.fullName}`}
      className="inline-flex max-w-full  items-start gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <UserAvatar user={post.author} />

      <div className="min-w-0 ">
        <p className="text-sm font-semibold">{post.author.fullName}</p>

        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatPostTime(post.createdAt)}

          {post.location?.name && (
            <>
              <span className="px-1">·</span>
              {post.location.name}
            </>
          )}
        </p>
      </div>
    </Link>
  )
}

function formatPostTime(createdAt: string) {
  const date = new Date(createdAt)

  return Number.isNaN(date.getTime()) ? createdAt : formatDistanceToNow(date, { addSuffix: true })
}
