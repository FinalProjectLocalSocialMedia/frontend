import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useInfiniteScroll } from '../hooks/use-infinite-scroll'
import type { CommentCursorPage } from '../types/comment'
import { CommentCard } from './comment-card'
import { CommentComposer } from './comment-composer'

type CommentQuery = UseInfiniteQueryResult<InfiniteData<CommentCursorPage>, Error>

export function CommentSection({
  commentCount,
  commentQuery,
  postId,
}: {
  commentCount: number
  commentQuery: CommentQuery
  postId: string
}) {
  const sentinelRef = useInfiniteScroll({
    enabled: !!commentQuery.hasNextPage && !commentQuery.isFetchingNextPage,
    onLoadMore: () => void commentQuery.fetchNextPage(),
  })
  const comments = commentQuery.data?.pages.flatMap((page) => page.items) ?? []

  return (
    <section
      aria-labelledby="post-comments-heading"
      className="mt-5 rounded-2xl border border-border bg-card p-5"
    >
      <div className="mb-2 flex items-center gap-2">
        <MessageCircle aria-hidden="true" className="size-4 text-primary" />
        <h2 id="post-comments-heading" className="font-semibold">
          Comments ({commentCount})
        </h2>
      </div>

      <div className="mb-4">
        <CommentComposer postId={postId} />
      </div>

      {commentCount === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No comments yet. Be the first to join the conversation.
        </p>
      ) : commentQuery.isPending ? (
        <div role="status" className="flex justify-center py-8">
          <Spinner />
          <span className="sr-only">Loading comments</span>
        </div>
      ) : commentQuery.isError && !commentQuery.data ? (
        <div role="alert" className="py-5 text-center">
          <p className="text-sm text-destructive">Failed to load comments.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void commentQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : comments.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No comments available.</p>
      ) : (
        <div className="divide-y divide-border">
          {comments.map((comment) => (
            <CommentCard key={comment.id} comment={comment} postId={postId} />
          ))}
        </div>
      )}

      {commentQuery.isFetchNextPageError && (
        <p role="alert" className="mt-3 text-center text-sm text-destructive">
          Failed to load more comments. Please try again.
        </p>
      )}

      {commentQuery.hasNextPage && (
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => void commentQuery.fetchNextPage()}
          disabled={commentQuery.isFetchingNextPage}
        >
          {commentQuery.isFetchingNextPage ? (
            <>
              <Spinner /> Loading more
            </>
          ) : commentQuery.isFetchNextPageError ? (
            'Retry loading more'
          ) : (
            'Load more comments'
          )}
        </Button>
      )}

      <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />
    </section>
  )
}
