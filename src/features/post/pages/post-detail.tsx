import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PostCard } from '@/features/post/components/post-card'
import { PostSearchForm } from '@/features/post/components/post-search-form'
import { currentUserId } from '@/lib/posts-context'
import { trending } from '@/lib/mock-nearby'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { getPostById } from '../api/post-api'
import { Spinner } from '@/components/ui/spinner'
import { getCommentsByPostId } from '../api/comment-api'
import { CommentSection } from '../components/comment-section'

export default function PostDetail() {
  const { postId } = useParams()
  const postQuery = useQuery({
    queryKey: ['post-detail', postId],
    queryFn: () => getPostById(postId as string),
    enabled: Boolean(postId),
  })
  const commentCount = postQuery.data?.commentCount ?? 0
  const commentQuery = useInfiniteQuery({
    queryKey: ['post-comments', postId],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => {
      return getCommentsByPostId({ postId: postId as string, limit: 5, cursor: pageParam })
    },
    getNextPageParam: (lastPage) => lastPage?.page?.nextCursor || undefined,
    enabled: Boolean(postId) && commentCount > 0,
  })

  if (postQuery.isPending) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
        <div className="flex items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent">
            <Spinner />
          </div>
        </div>
      </section>
    )
  }
  const selectedPost = postQuery.data

  if (!selectedPost || postQuery.isError) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
        <Button render={<Link to="/" />} nativeButton={false} variant="ghost" className="mb-5">
          <ArrowLeft data-icon="inline-start" /> Back to feed
        </Button>
        <div className="max-w-2xl rounded-2xl border border-border bg-card px-6 py-12 text-center">
          <h1 className="text-lg font-semibold">Post not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This post may have been deleted or is no longer available.
          </p>
        </div>
      </section>
    )
  }

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-10 lg:py-8">
      <section className="min-w-0">
        <Button render={<Link to="/" />} nativeButton={false} variant="ghost" className="mb-5">
          <ArrowLeft data-icon="inline-start" /> Back to feed
        </Button>
        <PostCard
          post={{
            ...selectedPost,
            likeCount: selectedPost.likeCount ?? 0,
            commentCount: selectedPost.commentCount ?? 0,
          }}
          currentUserId={currentUserId}
        />
        <CommentSection
          commentCount={commentCount}
          commentQuery={commentQuery}
          postId={selectedPost.id}
        />
      </section>

      <aside className="hidden flex-col gap-5 lg:flex lg:pt-[76px]">
        <PostSearchForm />
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-5 font-semibold">Trending near you</h2>
          {trending.map((item) => (
            <Link key={item.tag} to="/explore" className="mb-4 block text-left">
              <p className="text-sm font-semibold">{item.tag}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.posts.toLocaleString()} posts · {item.location}
              </p>
            </Link>
          ))}
        </section>
      </aside>
    </div>
  )
}
