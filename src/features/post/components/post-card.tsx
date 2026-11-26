import { PostHeader } from './post-header'
import { PostActions } from './post-actions'
import { PostMediaGrid } from './post-media-grid'
import { PostEngagement } from './post-engagement'
import { PostContent } from './post-content'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { PostSearchItem } from '../types/post'
import { useAuth } from '@/features/auth/context/auth-context'
import { useToggleLike } from '../hooks/use-toggle-like'
import { useToggleSavePost } from '../hooks/use-toggle-save-post'
import { useDeletePost } from '../hooks/use-delete-post'
import { useTrackPostView } from '../hooks/use-track-post-view'
import { getPostById } from '../api/post-api'
import { postKeys } from '../api/post-queries'

interface PostCardProps {
  post: PostSearchItem
}

export function PostCard({ post }: PostCardProps) {
  const { user } = useAuth()
  const { ref, trackActive } = useTrackPostView({
    postId: post.id,
    authorId: post.author.id,
  })

  const navigate = useNavigate()

  const liked = post.isLikedByMe ?? false
  const saved = post.isSavedByMe ?? false
  const isOwn = user !== null && post.author.id === user.id
  const likeMutation = useToggleLike(post)
  const savePostMutation = useToggleSavePost(post)
  const deletePostMutation = useDeletePost()
  const sharedPostId = post.sharedPostId ?? null
  const sharedPostQuery = useQuery({
    queryKey: postKeys.detail(sharedPostId ?? ''),
    queryFn: () => {
      if (sharedPostId === null) {
        throw new Error('Shared post ID is required')
      }

      return getPostById(sharedPostId)
    },
    enabled: sharedPostId !== null,
    staleTime: 30_000,
  })
  const sharedPost = sharedPostQuery.data
    ? {
        ...sharedPostQuery.data,
        sharedPostId: sharedPostQuery.data.sharedPost?.id ?? null,
      }
    : null

  return (
    <article
      ref={ref}
      className="rounded-2xl border border-border bg-card p-5 shadow-[0_8px_30px_-26px_rgba(15,23,42,0.35)]"
      onClick={() => {
        trackActive()
        navigate(`/posts/${post.id}`)
      }}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1" onClick={(e) => e.stopPropagation()} >
          <PostHeader post={post} onOpenDetail={trackActive} />
        </div>

        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
          <PostActions
            post={post}
            saved={saved}
            isOwn={isOwn}
            isDeletePending={deletePostMutation.isPending}
            toggleSaved={() => {
              const nextSaved = !saved
              if (nextSaved) {
                trackActive()
              }
              savePostMutation.mutate(nextSaved)
            }}
            removePost={() => deletePostMutation.mutate(post.id)}
          />
        </div>
      </div>
      <div className="mt-4 text-[15px] leading-6 text-foreground/90">
        <PostContent content={post.content} onExpand={trackActive} />
      </div>

      {sharedPostId !== null && (
        <div className="mt-4" onClick={(event) => event.stopPropagation()}>
          {sharedPostQuery.isPending && (
            <p role="status" className="text-sm text-muted-foreground">
              Đang tải bài viết được chia sẻ...
            </p>
          )}
          {sharedPostQuery.isError && (
            <p role="alert" className="text-sm text-destructive">
              Không thể tải bài viết được chia sẻ.
            </p>
          )}
          {sharedPost && <PostCard post={sharedPost} />}
        </div>
      )}

      <div onClick={(e) => e.stopPropagation()}>
        <PostMediaGrid
          media={post.media}
          onOpenMedia={trackActive}
          onSlideChange={trackActive}
        />
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        <PostEngagement
          post={post}
          liked={liked}
          isLikePending={likeMutation.isPending}
          toggleLiked={() => {
            const nextLiked = !liked
            if (nextLiked) {
              trackActive()
            }
            likeMutation.mutate(nextLiked)
          }}
          onOpenComments={trackActive}
          onShare={trackActive}
        />
      </div>
    </article>
  )
}
