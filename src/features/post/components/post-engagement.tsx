import { useState } from 'react'
import { Heart, MessageCircle, Share2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { PostSearchItem } from '../types/post'
import { PostShareComposer } from './post-share-composer'

interface PostEngagementProps {
  post: PostSearchItem
  liked: boolean
  isLikePending: boolean
  toggleLiked: () => void
  onOpenComments?: () => void
  onShare?: () => void
}

export function PostEngagement({
  post,
  liked,
  isLikePending,
  toggleLiked,
  onOpenComments,
  onShare,
}: PostEngagementProps) {
  const [composerOpen, setComposerOpen] = useState(false)

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Đã sao chép vào bộ nhớ tạm')
    } catch {
      toast.error('Không thể sao chép. Vui lòng sao chép thủ công.')
    }
  }

  async function share() {
    onShare?.()
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ text: post.content })
      } catch {
        // Người dùng có thể đóng hộp thoại share.
      }
    } else {
      await copyText(post.content)
    }
  }

  return (
    <div className="mt-4 flex items-center gap-1 border-t border-border pt-3 text-muted-foreground">
      <Button
        variant="ghost"
        size="sm"
        aria-pressed={liked}
        aria-label={liked ? 'Bỏ thích' : 'Thích'}
        disabled={isLikePending}
        onClick={() => toggleLiked()}
        className={cn('-ml-2.5', liked && 'text-rose-500 hover:text-rose-500')}
      >
        <Heart className={cn(liked && 'fill-current')} />
        {post.likeCount !== undefined && post.likeCount}
      </Button>

      <Button
        render={<Link to={`/posts/${post.id}`} onClick={() => onOpenComments?.()} />}
        nativeButton={false}
        variant="ghost"
        size="sm"
        aria-label="Bình luận"
      >
        <MessageCircle /> {post.commentCount}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="sm" aria-label="Chia sẻ bài viết" />}
        >
          <Share2 /> Chia sẻ
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onClick={() => {
              onShare?.()
              setComposerOpen(true)
            }}
          >
            Viết nội dung kèm theo
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void share()}>Chia sẻ nhanh</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <PostShareComposer post={post} open={composerOpen} onOpenChange={setComposerOpen} />
    </div>
  )
}
