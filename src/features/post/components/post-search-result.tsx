import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { PostCard } from '@/features/post/components/post-card'
import { currentUserId } from '@/lib/posts-context'
import { PostSearchItem } from '../types/post'

type PostSearchResultsProps = {
  query: string
  posts: PostSearchItem[]
  isPending: boolean
  isError: boolean
  errorMessage?: string
  hasData: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isFetchNextPageError: boolean
  onRetry: () => void
  onFetchNextPage: () => void
}

export function PostSearchResults({
  query,
  posts,
  isPending,
  isError,
  errorMessage,
  hasData,
  hasNextPage,
  isFetchingNextPage,
  isFetchNextPageError,
  onRetry,
  onFetchNextPage,
}: PostSearchResultsProps) {
  if (!query.trim()) {
    return (
      <p className="rounded-2xl border border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">
        Enter a search term to find posts.
      </p>
    )
  }

  if (isPending) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    )
  }

  if (isError && !hasData) {
    return (
      <div role="alert" className="rounded-2xl border border-destructive/30 bg-card p-5">
        <p className="text-sm text-destructive">{errorMessage}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
          Try again
        </Button>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card px-5 py-12 text-center">
        <Search aria-hidden="true" className="mx-auto size-5 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium">No posts found</p>
        <p className="mt-1 text-sm text-muted-foreground">Try another search term.</p>
      </div>
    )
  }

  return (
    <section aria-label={`Search results for ${query}`} className="flex flex-col gap-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} currentUserId={currentUserId} />
      ))}

      {isFetchNextPageError && (
        <p role="alert" className="text-center text-sm text-destructive">
          Failed to load more posts. Please try again.
        </p>
      )}

      {hasNextPage && (
        <Button
          variant="outline"
          onClick={onFetchNextPage}
          disabled={isFetchingNextPage}
          className="self-center"
        >
          {isFetchingNextPage ? (
            <>
              <Spinner /> Loading more
            </>
          ) : isFetchNextPageError ? (
            'Retry loading more'
          ) : (
            'Load more'
          )}
        </Button>
      )}

      {isFetchingNextPage && (
        <p role="status" className="sr-only">
          Loading more search results
        </p>
      )}
    </section>
  )
}
