import { useState, useTransition } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Clock,
  Flame,
  Hash,
  MapPin,
  RefreshCw,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react'
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetClose, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { usePlacePostsQuery, usePlaceSummaryQuery } from '../api/map.queries'
import { formatLocationType } from '../lib/labels'
import { formatFullDateTimeVi, formatRelativeVi } from '../lib/relative-time'
import type { PostSort, TimeFilterValue } from '../lib/types'
import { PostCardCompact } from './post-card-compact'
import { TimeFilter } from './time-filter'

export type PlaceDetailModalProps = {
  placeId: string | null
  isOpen: boolean
  onClose: () => void
}

/**
 * Modal hiển thị chi tiết địa điểm (PlaceDetailModal) theo mục 6.4 (R2).
 * - Sử dụng Dialog trên màn hình máy tính và Sheet bottom trên điện thoại di động
 * - Hiển thị tên địa điểm, nhãn loại địa điểm tiếng Việt, mô tả ngắn
 * - Bảng thống kê 3 ô số lượng bài viết (1 ngày · 7 ngày · 30 ngày) và mốc bài viết mới nhất
 * - Danh sách topic xu hướng dạng chip có số bài: click điều hướng tới /feed/topic/:topic?placeId=...
 * - Thanh công cụ lọc: TimeFilter và nút chuyển đổi sắp xếp Xu hướng / Mới nhất
 * - Danh sách bài viết dạng PostCardCompact phân trang 10 bài/lần có nút Xem thêm
 * - Đóng mở qua URL state (?place=), đóng modal không làm mất vị trí camera bản đồ
 * - Quản lý state độc lập không làm render lại cây bản đồ
 */
export function PlaceDetailModal({ placeId, isOpen, onClose }: PlaceDetailModalProps) {
  const navigate = useNavigate()
  const [, startTransition] = useTransition()

  // State bộ lọc nội bộ của modal
  const [timeFilter, setTimeFilter] = useState<TimeFilterValue>({ kind: 'all' })
  const [sort, setSort] = useState<PostSort>('TRENDING')
  const [page, setPage] = useState(1)

  // Kiểm tra kích thước màn hình di động (< 768px)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  // Lấy dữ liệu tóm tắt địa điểm
  const {
    data: summary,
    isLoading: isLoadingSummary,
    isError: isSummaryError,
    refetch: refetchSummary,
  } = usePlaceSummaryQuery(placeId, isOpen)

  // Lấy danh sách bài viết tại địa điểm
  const {
    data: postsData,
    isLoading: isLoadingPosts,
    isFetching: isFetchingPosts,
    isError: isPostsError,
    refetch: refetchPosts,
  } = usePlacePostsQuery(
    {
      placeId: placeId || '',
      time: timeFilter,
      sort,
      page: 1,
      pageSize: page * 10,
    },
    Boolean(placeId && isOpen),
  )

  // Xử lý click chọn topic xu hướng
  const handleSelectTopic = (topic: string) => {
    if (!placeId) return
    startTransition(() => {
      navigate(`/feed/topic/${encodeURIComponent(topic)}?placeId=${encodeURIComponent(placeId)}`)
    })
  }

  // Nội dung chính bên trong modal
  const renderModalContent = () => {
    if (isLoadingSummary) {
      return (
        <div className="flex flex-col gap-4 p-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4 rounded-md" />
            <Skeleton className="h-4 w-1/3 rounded-md" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
          <div className="space-y-3 pt-3">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
        </div>
      )
    }

    if (isSummaryError || !summary) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="text-sm text-destructive font-medium">
            Không thể tải thông tin địa điểm
          </p>
          <Button variant="outline" size="sm" onClick={() => refetchSummary()}>
            <RefreshCw className="size-3.5 mr-1.5" />
            Thử lại
          </Button>
        </div>
      )
    }

    const { place, counts, latestPostAt, trendingTopics } = summary
    const friendlyType = formatLocationType(place.locationType)
    const posts = postsData?.items || []
    const totalPosts = postsData?.total || 0
    const hasMorePosts = posts.length < totalPosts

    return (
      <div className="flex flex-col gap-4 w-full overflow-x-hidden">
        {/* 1. Phần đầu: Tên, loại địa điểm, mô tả */}
        <div className="flex flex-col gap-1.5 pt-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-primary shrink-0" />
                <h2 className="text-lg font-bold text-foreground leading-snug break-words">
                  {place.name}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-[11px] font-medium shrink-0">
                  {friendlyType}
                </Badge>
                {place.description && (
                  <span className="text-xs text-muted-foreground line-clamp-1 break-words">
                    {place.description}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Thống kê bài viết: 3 ô đếm (1d · 7d · 30d) + Mốc bài mới nhất */}
        <div>
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/40 p-2.5 border border-border/60">
            <div className="flex flex-col items-center text-center">
              <span className="text-[10px] font-medium text-muted-foreground">Hôm nay</span>
              <span className="text-base font-bold text-foreground">{counts.last1d}</span>
            </div>
            <div className="flex flex-col items-center text-center border-x border-border/50">
              <span className="text-[10px] font-medium text-muted-foreground">7 ngày</span>
              <span className="text-base font-bold text-primary">{counts.last7d}</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="text-[10px] font-medium text-muted-foreground">30 ngày</span>
              <span className="text-base font-bold text-foreground">{counts.last30d}</span>
            </div>
          </div>

          {latestPostAt && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <Clock className="size-3.5 text-primary shrink-0" />
              <span className="truncate">
                Bài mới nhất:{' '}
                <strong className="text-foreground font-semibold">
                  {formatRelativeVi(latestPostAt)}
                </strong>{' '}
                ({formatFullDateTimeVi(latestPostAt)})
              </span>
            </div>
          )}
        </div>

        {/* 3. Chủ đề xu hướng dạng chip */}
        {trendingTopics.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <TrendingUp className="size-3.5 text-primary shrink-0" />
              <span>Chủ đề nổi bật</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {trendingTopics.map((topic) => (
                <button
                  key={topic.name}
                  type="button"
                  onClick={() => handleSelectTopic(topic.name)}
                  className="group inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground shadow-2xs hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all active:scale-95 cursor-pointer"
                >
                  <Hash className="size-3 text-muted-foreground group-hover:text-primary shrink-0" />
                  <span>{topic.name}</span>
                  <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-semibold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary">
                    {topic.postCount}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 4. Thanh công cụ lọc thời gian & chuyển đổi sắp xếp */}
        <div className="border-t border-border/50 pt-3 flex flex-wrap items-center justify-between gap-2.5">
          <TimeFilter
            value={timeFilter}
            onChange={(val) => {
              setTimeFilter(val)
              setPage(1)
            }}
          />

          <div className="flex items-center gap-1 rounded-lg border border-border/70 p-0.5 bg-muted/30">
            <Button
              variant={sort === 'TRENDING' ? 'default' : 'ghost'}
              size="xs"
              onClick={() => {
                setSort('TRENDING')
                setPage(1)
              }}
              className="h-7 gap-1 px-2 text-xs font-medium cursor-pointer"
            >
              <Flame className="size-3" />
              Xu hướng
            </Button>
            <Button
              variant={sort === 'NEWEST' ? 'default' : 'ghost'}
              size="xs"
              onClick={() => {
                setSort('NEWEST')
                setPage(1)
              }}
              className="h-7 gap-1 px-2 text-xs font-medium cursor-pointer"
            >
              <Sparkles className="size-3" />
              Mới nhất
            </Button>
          </div>
        </div>

        {/* 5. Danh sách bài viết tại địa điểm */}
        <div className="flex flex-col gap-3 pb-8 w-full">
          {isLoadingPosts ? (
            <div className="space-y-3">
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
            </div>
          ) : isPostsError ? (
            <div className="py-6 text-center text-xs text-destructive">
              Không thể tải danh sách bài viết.
              <Button
                variant="link"
                size="xs"
                onClick={() => refetchPosts()}
                className="ml-1 text-xs cursor-pointer"
              >
                Thử lại
              </Button>
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 p-6 text-center text-xs text-muted-foreground">
              Chưa có bài viết trong khoảng thời gian này
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <PostCardCompact
                  key={post.id}
                  post={post}
                  onClick={() => {
                    /* Giữ modal trong lịch sử để nút Back trình duyệt quay về đúng chỗ */
                  }}
                />
              ))}

              {hasMorePosts && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={isFetchingPosts}
                  className="w-full mt-2 text-xs font-medium cursor-pointer"
                >
                  {isFetchingPosts ? (
                    <RefreshCw className="size-3.5 animate-spin mr-1.5" />
                  ) : null}
                  Xem thêm bài viết ({posts.length}/{totalPosts})
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  // Render responsive: Sheet cho mobile, Dialog cho desktop
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="h-[88dvh] max-h-[88dvh] flex flex-col rounded-t-2xl p-0 overflow-hidden focus:outline-hidden"
        >
          <div className="flex items-center justify-between border-b border-border/50 px-4 py-3 shrink-0 bg-popover z-10">
            <SheetTitle className="text-sm font-semibold">Chi tiết địa điểm</SheetTitle>
            <SheetClose
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={onClose}
                  className="rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="Đóng chi tiết địa điểm"
                />
              }
            >
              <X className="size-4" />
            </SheetClose>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3">
            {renderModalContent()}
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-[94vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl h-[88dvh] max-h-[88dvh] flex flex-col p-0 overflow-hidden focus:outline-hidden"
      >
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-3.5 shrink-0 bg-popover z-10">
          <DialogTitle className="text-base font-semibold">Chi tiết địa điểm</DialogTitle>
          <DialogClose
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={onClose}
                className="rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Đóng chi tiết địa điểm"
              />
            }
          >
            <X className="size-4" />
          </DialogClose>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4">
          {renderModalContent()}
        </div>
      </DialogContent>
    </Dialog>
  )
}
