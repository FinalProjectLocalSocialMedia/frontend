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
  /** Cờ cho biết có điều kiện lọc ngữ cảnh (ví dụ locationId hoặc topic) ngay cả khi query rỗng */
  hasFilter?: boolean
  /** Tuỳ biến thông điệp rỗng khi không có bài viết */
  emptyMessage?: string
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
  hasFilter = false,
  emptyMessage,
}: PostSearchResultsProps) {
  // Nếu không có từ khoá và cũng không có bộ lọc ngữ cảnh địa điểm/chủ đề nào
  if (!query.trim() && !hasFilter) {
    return (
      <p className="rounded-2xl border border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">
        Nhập từ khóa để tìm kiếm bài viết.
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
          Thử lại
        </Button>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card px-5 py-12 text-center">
        <Search aria-hidden="true" className="mx-auto size-5 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium">{emptyMessage || 'Không tìm thấy bài viết'}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {emptyMessage ? 'Chưa có bài viết ở địa điểm/chủ đề này.' : 'Hãy thử tìm kiếm bằng từ khóa khác.'}
        </p>
      </div>
    )
  }

  return (
    <section aria-label={query ? `Kết quả tìm kiếm cho "${query}"` : 'Kết quả tìm kiếm'} className="flex flex-col gap-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} currentUserId={currentUserId} />
      ))}

      {isFetchNextPageError && (
        <p role="alert" className="text-center text-sm text-destructive">
          Không thể tải thêm bài viết. Vui lòng thử lại.
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
              <Spinner /> Đang tải thêm...
            </>
          ) : isFetchNextPageError ? (
            'Thử tải lại'
          ) : (
            'Xem thêm'
          )}
        </Button>
      )}
    </section>
  )
}
