import { Heart, MessageCircle, Share2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { PostSearchItem } from '../types/post'


interface PostEngagementProps {
  post: PostSearchItem
  liked: boolean
  toggleLiked: (id: PostSearchItem['id']) => void
}

export function PostEngagement({ post, liked, toggleLiked }: PostEngagementProps) {
  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Could not copy. Please copy it manually.')
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
        aria-label={liked ? 'Unlike' : 'Like'}
        onClick={() => toggleLiked(post.id)}
        className={cn('-ml-2.5', liked && 'text-rose-500 hover:text-rose-500')}
      >
        <Heart className={cn(liked && 'fill-current')} />
        {post.likeCount !== undefined && post.likeCount + Number(liked)}
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

      <Button variant="ghost" size="sm" onClick={() => void share()}>
        <Share2 /> Share
      </Button>
    </div>
  )
}
