import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PostSearchForm } from '@/features/post/components/post-search-form'
import { useInfiniteScroll } from '@/features/post/hooks/use-infinite-scroll'
import { usePostSearch } from '@/features/post/hooks/use-post-search'
import { PostSearchResults } from '../components/post-search-result'
import { PostSearchItem } from '../types/post'

/**
 * Trang tìm kiếm bài viết (PostSearch) mở rộng theo mục 6.8 (PHA 5):
 * - Nhận ?locationId=&locationName= và ?topic= từ URL
 * - Hiển thị header "Những bài viết ở địa điểm X" / "…thuộc chủ đề #X"
 * - Nút "← Quay lại bản đồ" và chip "× Bỏ lọc"
 * - Giữ nguyên hoàn toàn hành vi ?q= hiện có và component PostSearchForm
 */
export default function PostSearch() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const query = searchParams.get('q') ?? ''
  const locationId = searchParams.get('locationId') ?? ''
  const locationName = searchParams.get('locationName') ?? ''
  const rawTopic = searchParams.get('topic') ?? ''
  const topic = rawTopic.replace(/^#/, '').trim()

  const hasContextFilter = Boolean(locationId || topic)
  const displayLocation = locationName.trim() || 'địa điểm đã chọn'

  // Gọi hook tìm kiếm với bộ 3 tham số { q, locationId, topic }
  const search = usePostSearch({
    q: query,
    locationId: locationId || undefined,
    topic: topic || undefined,
  })

  // Quay lại bản đồ với đúng trạng thái trước đó (camera + panel)
  const handleBackToMap = () => {
    navigate(-1)
  }

  // Bỏ lọc ngữ cảnh để quay về trang tìm kiếm thông thường
  const handleClearFilters = () => {
    setSearchParams({})
  }

  const sentinelRef = useInfiniteScroll({
    enabled: !!search.hasNextPage && !search.isFetchingNextPage,
    onLoadMore: () => void search.fetchNextPage(),
  })

  const posts: PostSearchItem[] =
    search.data?.pages
      .flatMap((page) => page.items)
      .map((post) => ({
        ...post,
        likeCount: post.likeCount ?? 0,
        commentCount: post.commentCount ?? 0,
      })) ?? []

  // Xây dựng tiêu đề header ngữ cảnh theo mục 6.8
  const renderContextHeading = () => {
    if (locationId && topic) {
      return (
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Những bài viết thuộc chủ đề <span className="text-primary">#{topic}</span> tại{' '}
          <span className="text-primary">{displayLocation}</span>
        </h1>
      )
    }
    if (locationId) {
      return (
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Những bài viết ở địa điểm <span className="text-primary">{displayLocation}</span>
        </h1>
      )
    }
    if (topic) {
      return (
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Những bài viết thuộc chủ đề <span className="text-primary">#{topic}</span>
        </h1>
      )
    }
    return null
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 lg:py-8">
      <header className="mb-6">
        {hasContextFilter ? (
          <div className="flex flex-col gap-3">
            {/* Thanh công cụ: nút Quay lại bản đồ & chip Bỏ lọc */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBackToMap}
                className="gap-1.5 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer -ml-2"
              >
                <ArrowLeft className="size-4" />
                <span>Quay lại bản đồ</span>
              </Button>

              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="size-3.5" />
                <span>Bỏ lọc</span>
              </button>
            </div>

            {/* Tiêu đề H1 ngữ cảnh */}
            <div className="mt-1">{renderContextHeading()}</div>

            {/* Form tìm kiếm bổ sung */}
            <div className="mt-2">
              <PostSearchForm />
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Discover</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Search posts</h1>
            <div className="mt-4">
              <PostSearchForm />
            </div>
          </>
        )}
      </header>

      <PostSearchResults
        query={query}
        posts={posts}
        isPending={search.isPending}
        isError={search.isError}
        errorMessage={search.error?.message}
        hasData={!!search.data}
        hasNextPage={!!search.hasNextPage}
        isFetchingNextPage={search.isFetchingNextPage}
        isFetchNextPageError={search.isFetchNextPageError}
        onRetry={() => void search.refetch()}
        onFetchNextPage={() => void search.fetchNextPage()}
        hasFilter={hasContextFilter}
        emptyMessage="Chưa có bài viết ở địa điểm/chủ đề này"
      />

      <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />
    </div>
  )
}
