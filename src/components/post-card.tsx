import { useState } from 'react'
import { MessageCircle, MoreHorizontal, Share2 } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import type { NearbyPost } from '@/lib/mock-nearby'

export function PostCard({ post }: { post: NearbyPost }) {
  const [liked, setLiked] = useState(false)
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
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="More options"
              className="-mr-2 -mt-1 text-muted-foreground"
            >
              <MoreHorizontal />
            </Button>
          </div>
          <p className="mt-4 text-[15px] leading-6 text-foreground/90">{post.text}</p>
          <p className="mt-3 text-xs font-semibold text-primary">{post.topic}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-5 border-t border-border pt-3 pl-[52px] text-xs text-muted-foreground">
        <button
          onClick={() => setLiked(!liked)}
          className={liked ? 'font-medium text-rose-500' : ''}
        >
          {liked ? '♥' : '♡'} {liked ? Number(post.likes) + 1 : post.likes}
        </button>
        <button>
          <MessageCircle className="mr-1 inline size-4" />
          {post.comments}
        </button>
        <button>
          <Share2 className="mr-1 inline size-4" />
          Share
        </button>
      </div>
    </article>
  )
}
