import {
  Bookmark,
  BookmarkCheck,
  Copy,
  Flag,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Share2,
  Trash2,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePosts } from '@/lib/posts-context'
import { cn } from '@/lib/utils'
import type { Post } from '@/features/post/types/Post'

export function PostCard({ post, currentUserId }: { post: Post; currentUserId?: string }) {
  const { savedIds, likedIds, toggleLiked, toggleSaved, removePost } = usePosts()
  const liked = likedIds.includes(post.id)
  const saved = savedIds.includes(post.id)
  const isOwn = currentUserId !== undefined && post.author.id === currentUserId
  const topic = post.content.match(/#[\p{L}\p{N}_]+/u)?.[0]

  function share() {
    if (typeof navigator.share === 'function') {
      navigator.share({ text: post.content }).catch(() => {})
    } else {
      void copyText(post.content)
    }
  }

  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-[0_8px_30px_-26px_rgba(15,23,42,0.35)]">
      <div className="flex items-start gap-3">
        <Link
          to={`/posts/${post.id}`}
          aria-label={`View post by ${post.author.fullName}`}
          className="flex min-w-0 flex-1 items-start gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar>
            {post.author.avatarUrl && (
              <AvatarImage src={post.author.avatarUrl} alt={post.author.fullName} />
            )}
            <AvatarFallback>{getInitials(post.author.fullName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{post.author.fullName}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatPostTime(post.createdAt)} <span className="px-1">·</span> {post.location.name}
            </p>
            <p className="mt-4 text-[15px] leading-6 text-foreground/90">{post.content}</p>
            {topic && <p className="mt-3 text-xs font-semibold text-primary">{topic}</p>}
          </div>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="More options"
                className="-mr-2 -mt-1 text-muted-foreground"
              />
            }
          >
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => {
                toggleSaved(post.id)
                toast(saved ? 'Removed from saved posts' : 'Saved to your posts')
              }}
            >
              {saved ? <BookmarkCheck /> : <Bookmark />}
              {saved ? 'Unsave post' : 'Save post'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void copyText(post.content)}>
              <Copy /> Copy text
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {isOwn ? (
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  removePost(post.id)
                  toast.success('Post deleted')
                }}
              >
                <Trash2 /> Delete post
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                variant="destructive"
                onClick={() =>
                  toast.success('Report submitted', {
                    description: 'Thanks for helping keep nearby. safe.',
                  })
                }
              >
                <Flag /> Report post
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-4 flex items-center gap-1 border-t border-border pt-3 pl-[52px] text-muted-foreground">
        <Button
          variant="ghost"
          size="sm"
          aria-pressed={liked}
          aria-label={liked ? 'Unlike' : 'Like'}
          onClick={() => toggleLiked(post.id)}
          className={cn(liked && 'text-rose-500 hover:text-rose-500')}
        >
          <Heart className={cn(liked && 'fill-current')} /> {post.likeCount + Number(liked)}
        </Button>
        <Button
          render={<Link to={`/posts/${post.id}`} />}
          nativeButton={false}
          variant="ghost"
          size="sm"
          aria-label="Comments"
        >
          <MessageCircle /> {post.commentCount}
        </Button>
        <Button variant="ghost" size="sm" onClick={share}>
          <Share2 /> Share
        </Button>
      </div>
    </article>
  )
}

function formatPostTime(createdAt: string) {
  const date = new Date(createdAt)
  return Number.isNaN(date.getTime()) ? createdAt : formatDistanceToNow(date, { addSuffix: true })
}

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U'
  )
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  } catch {
    toast.error('Could not copy. Please copy it manually.')
  }
}
