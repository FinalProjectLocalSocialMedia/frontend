import { Heart, MessageCircle, Share2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { PostSearchItem } from '../types/post'

interface PostEngagementProps {
  post: PostSearchItem
  liked: boolean
  isLikePending: boolean
  toggleLiked: () => void
}

export function PostEngagement({ post, liked, isLikePending, toggleLiked }: PostEngagementProps) {
  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Đã sao chép vào bộ nhớ tạm')
    } catch {
      toast.error('Không thể sao chép. Vui lòng sao chép thủ công.')
    }
  }

  async function share() {
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
    <div className="mt-4 flex items-center gap-1 border-t border-border pt-3 pl-11 text-muted-foreground">
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
        render={<Link to={`/posts/${post.id}`} />}
        nativeButton={false}
        variant="ghost"
        size="sm"
        aria-label="Bình luận"
      >
        <MessageCircle /> {post.commentCount}
      </Button>

      <Button variant="ghost" size="sm" onClick={() => void share()}>
        <Share2 /> Chia sẻ
      </Button>
    </div>
  )
}
