import { PostHeader } from './post-header'
import { PostActions } from './post-actions'
import { PostMediaGrid } from './post-media-grid'
import { PostEngagement } from './post-engagement'
import { PostContent } from './post-content'
import { useNavigate } from 'react-router-dom'
import type { PostSearchItem } from '../types/post'
import { usePostInteractions } from '../context/post-interactions-context'
import { useAuth } from '@/features/auth/context/auth-context'
import { useToggleLike } from '../hooks/useToggleLike'


interface PostCardProps {
  post: PostSearchItem
}

export function PostCard({ post }: PostCardProps) {
  const { user } = useAuth()
  const { removedIds, toggleSaved, removePost } = usePostInteractions()
  const navigate = useNavigate()
 
  const liked = post.isLikedByMe ?? false
  const saved = post.isSavedByMe ?? false
  const isOwn = user !== null && post.author.id === user.id
  const likeMutation = useToggleLike(post)

  

  if (removedIds.includes(post.id)) return null

  return (
    <article
      className="rounded-2xl border border-border bg-card p-5 shadow-[0_8px_30px_-26px_rgba(15,23,42,0.35)]"
      onClick={() => navigate(`/posts/${post.id}`)}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <PostHeader post={post} />
        </div>

        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
          <PostActions
            post={post}
            saved={saved}
            isOwn={isOwn}
            toggleSaved={toggleSaved}
            removePost={removePost}
          />
        </div>
      </div>
      <div className="mt-4 text-[15px] leading-6 text-foreground/90">
        <PostContent content={post.content} />
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        <PostMediaGrid media={post.media} />
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        <PostEngagement
          post={post}
          liked={liked}
          isLikePending={likeMutation.isPending}
          toggleLiked={() => likeMutation.mutate(!liked)}
        />
      </div>
    </article>
  )
}
