import { useInfiniteQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCreatePost } from '@/components/layout/create-post-context'
import { PostCard } from '@/features/post/components/post-card'
import { PostSearchForm } from '@/features/post/components/post-search-form'
import { getFeed } from '@/features/post/api/post-api'
import { useInfiniteScroll } from '@/features/post/hooks/use-infinite-scroll'
import { Spinner } from '@/components/ui/spinner'
import { currentLocation, trending } from '@/lib/mock-nearby'
import { currentUserId, usePosts } from '@/lib/posts-context'

const FEED_PAGE_SIZE = 5

export default function HomeFeed() {
  const { posts: localPosts, nextPost } = usePosts()
  const openCreate = useCreatePost()
  const feed = useInfiniteQuery({
    queryKey: ['posts', 'feed'],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const page = await getFeed({ cursor: pageParam, limit: FEED_PAGE_SIZE })
      nextPost(page)
      return page
    },
    getNextPageParam: (lastPage) => lastPage?.page?.nextCursor || undefined,
  })
  console.log('feed', feed.data)
  const sentinelRef = useInfiniteScroll({
    enabled: !!feed.hasNextPage && !feed.isFetchingNextPage,
    onLoadMore: () => void feed.fetchNextPage(),
  })
  const remotePosts = feed.data?.pages.flatMap((page) => page.items) ?? []
  const posts = [
    ...localPosts.items,
    ...remotePosts.filter(
      (post) => !localPosts.items.some((localPost) => localPost.id === post.id),
    ),
  ]

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-10 lg:py-8">
      <section>
        <header className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Your local pulse
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Home feed</h1>
        </header>

        <button
          type="button"
          onClick={openCreate}
          className="w-full rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/40 hover:bg-primary/[0.02] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <p className="text-sm font-medium text-muted-foreground">
            What&apos;s happening around you?
          </p>
          <div className="mt-2 flex items-center gap-2 text-lg font-semibold">
            <MapPin className="size-5 text-primary" /> {currentLocation.name}
          </div>
        </button>

        <div className="mt-5 flex flex-col gap-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={{
                ...post,
                likeCount: post.likeCount ?? 0,
                commentCount: post.commentCount ?? 0,
              }}
              currentUserId={currentUserId}
            />
          ))}

          {feed.isPending && (
            <div role="status" className="flex justify-center py-12">
              <Spinner />
              <span className="sr-only">Loading feed</span>
            </div>
          )}

          {feed.isError && !feed.data && (
            <div role="alert" className="rounded-2xl border border-destructive/30 bg-card p-5">
              <p className="text-sm text-destructive">{feed.error.message}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => void feed.refetch()}
              >
                Try again
              </Button>
            </div>
          )}

          {!feed.isPending && !feed.isError && posts.length === 0 && (
            <p className="rounded-2xl border border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">
              No posts nearby yet.
            </p>
          )}

          {feed.isFetchNextPageError && (
            <p role="alert" className="text-center text-sm text-destructive">
              Failed to load more posts. Please try again.
            </p>
          )}

          {feed.hasNextPage && (
            <Button
              variant="outline"
              onClick={() => void feed.fetchNextPage()}
              disabled={feed.isFetchingNextPage}
              className="self-center"
            >
              {feed.isFetchingNextPage ? (
                <>
                  <Spinner /> Loading more
                </>
              ) : feed.isFetchNextPageError ? (
                'Retry loading more'
              ) : (
                'Load more'
              )}
            </Button>
          )}
          <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />
        </div>
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
