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
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { NearbyPost } from '@/lib/mock-nearby'
import { currentUserHandle, usePosts } from '@/lib/posts-context'
import { cn } from '@/lib/utils'

function likeCount(post: NearbyPost, liked: boolean) {
  const base = Number(post.likes.replace(/,/g, ''))
  return Number.isFinite(base) ? base + (liked ? 1 : 0) : post.likes
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  } catch {
    toast.error('Could not copy. Please copy it manually.')
  }
}

export function PostCard({ post }: { post: NearbyPost }) {
  const { savedIds, likedIds, toggleLiked, toggleSaved, removePost } = usePosts()
  const liked = likedIds.includes(post.id)
  const saved = savedIds.includes(post.id)
  const isOwn = post.handle === currentUserHandle

  function share() {
    if (typeof navigator.share === 'function') {
      navigator.share({ text: post.text }).catch(() => {})
    } else {
      void copyText(post.text)
    }
  }

  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-[0_8px_30px_-26px_rgba(15,23,42,0.35)]">
      <div className="flex items-start gap-3">
        <Avatar>
          <AvatarFallback className={post.color}>{post.initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">{post.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {post.handle} <span className="px-1">·</span> {post.time}{' '}
                <span className="px-1">·</span> {post.location}
              </p>
            </div>
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
                <DropdownMenuItem onClick={() => void copyText(post.text)}>
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
          <p className="mt-4 text-[15px] leading-6 text-foreground/90">{post.text}</p>
          <p className="mt-3 text-xs font-semibold text-primary">{post.topic}</p>
        </div>
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
          <Heart className={cn(liked && 'fill-current')} /> {likeCount(post, liked)}
        </Button>
        <Button variant="ghost" size="sm" aria-label="Comments">
          <MessageCircle /> {post.comments}
        </Button>
        <Button variant="ghost" size="sm" onClick={share}>
          <Share2 /> Share
        </Button>
      </div>
    </article>
  )
}
