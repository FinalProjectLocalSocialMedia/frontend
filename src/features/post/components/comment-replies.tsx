import { useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import type { Comment as CommentData } from '@/features/post/types/comment'
import { getCommentReplyByCommentId } from '../api/comment-api'
import { CommentCard } from './comment-card'

export function CommentReplies({ comment, postId }: { comment: CommentData; postId: string }) {
  const [expanded, setExpanded] = useState(false)

  const repliesQuery = useInfiniteQuery({
    queryKey: ['comment-replies', postId, comment.id],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      getCommentReplyByCommentId({
        postId,
        commentId: comment.id,
        cursor: pageParam,
        limit: 5,
      }),
    getNextPageParam: (lastPage) => lastPage.page.nextCursor || undefined,
    enabled: expanded,
  })

  const replies = repliesQuery.data?.pages.flatMap((page) => page.items) ?? []

  return (
    <div className="mt-1">
      <Button
        variant="ghost"
        size="sm"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
      >
        {expanded ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
        {expanded ? 'Ẩn' : 'Xem'} {comment.commentCount} câu trả lời
      </Button>

      {expanded && (
        <div className="ml-2 border-l border-border pl-3">
          {repliesQuery.isPending ? (
            <div
              role="status"
              className="flex items-center gap-2 py-3 text-sm text-muted-foreground"
            >
              <Spinner />
              <span>Đang tải câu trả lời...</span>
            </div>
          ) : repliesQuery.isError && !repliesQuery.data ? (
            <div role="alert" className="py-3">
              <p className="text-sm text-destructive">Không thể tải câu trả lời.</p>

              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => void repliesQuery.refetch()}
              >
                Thử lại
              </Button>
            </div>
          ) : replies.length === 0 ? (
            <p className="py-3 text-sm text-muted-foreground">Chưa có câu trả lời nào.</p>
          ) : (
            <div className="divide-y divide-border">
              {replies.map((reply) => (
                <CommentCard key={reply.id} comment={reply} postId={postId} />
              ))}
            </div>
          )}

          {repliesQuery.isFetchNextPageError && (
            <p role="alert" className="py-2 text-sm text-destructive">
              Không thể tải thêm câu trả lời. Vui lòng thử lại.
            </p>
          )}

          {repliesQuery.hasNextPage && (
            <Button
              variant="outline"
              size="sm"
              className="my-2"
              onClick={() => void repliesQuery.fetchNextPage()}
              disabled={repliesQuery.isFetchingNextPage}
            >
              {repliesQuery.isFetchingNextPage ? (
                <>
                  <Spinner /> Đang tải thêm...
                </>
              ) : repliesQuery.isFetchNextPageError ? (
                'Thử tải lại'
              ) : (
                'Xem thêm câu trả lời'
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
