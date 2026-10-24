import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PostCard } from '@/features/post/components/post-card'
import { PostSearchForm } from '@/features/post/components/post-search-form'
import { currentUserId, usePosts } from '@/lib/posts-context'
import { trending } from '@/lib/mock-nearby'

export default function PostDetail() {
  const { postId } = useParams()
  const { posts } = usePosts()
  const post = posts.items.find((item) => item.id === postId)

  if (!post) {
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

  const selectedPost = post

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

        <section
          aria-labelledby="post-comments-heading"
          className="mt-5 rounded-2xl border border-border bg-card p-5"
        >
          <div className="mb-2 flex items-center gap-2">
            <MessageCircle aria-hidden="true" className="size-4 text-primary" />
            <h1 id="post-comments-heading" className="font-semibold">
              Comments ({selectedPost.commentCount})
            </h1>
          </div>
          <p className="py-8 text-center text-sm text-muted-foreground">
            {selectedPost.commentCount
              ? 'The comment list is not available yet.'
              : 'No comments yet. Be the first to join the conversation.'}
          </p>
        </section>
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
