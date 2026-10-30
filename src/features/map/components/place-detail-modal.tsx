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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { usePlacePostsQuery, usePlaceSummaryQuery } from '../api/map.queries'
import { formatLocationType } from '../lib/labels'
import { formatFullDateTimeVi, formatRelativeVi } from '../lib/relative-time'
import type { PostSort, TimeFilterValue } from '../lib/types'
import { PostCardCompact } from './post-card-compact'
import { TimeFilter } from './time-filter'
import { MapSidePanel } from './map-side-panel'

export type PlaceDetailModalProps = {
  /** ID địa điểm được chọn hoặc null khi đóng */
  placeId: string | null
  /** Trạng thái mở của panel */
  isOpen: boolean
  /** Callback khi đóng panel */
  onClose: () => void
}

/**
 * Panel hiển thị chi tiết địa điểm (PlaceDetailModal) theo mục 6.4 và 6.4b (PHA 3B / M17).
 * - Sử dụng khung MapSidePanel thuần Tailwind, không có overlay hay backdrop
 * - Bản đồ phía sau và bên cạnh vẫn thao tác kéo, phóng to/thu nhỏ, click marker bình thường
 * - Tên địa điểm là nút bấm điều hướng tới trang /search?locationId=...&locationName=...
 * - Chip chủ đề xu hướng điều hướng tới /search?topic=...&locationId=...&locationName=...
 * - Bảng 3 ô thống kê số bài (1 ngày · 7 ngày · 30 ngày) và mốc bài mới nhất
 * - Bộ lọc thời gian TimeFilter và chuyển đổi sắp xếp Xu hướng / Mới nhất
 * - Danh sách bài viết dạng PostCardCompact phân trang, tối ưu bố cục 1 cột không có thanh cuộn ngang
 */
export function PlaceDetailModal({ placeId, isOpen, onClose }: PlaceDetailModalProps) {
  const navigate = useNavigate()
  const [, startTransition] = useTransition()

  // State bộ lọc thời gian và thứ tự sắp xếp của bài viết
  const [timeFilter, setTimeFilter] = useState<TimeFilterValue>({ kind: 'all' })
  const [sort, setSort] = useState<PostSort>('TRENDING')
  const [page, setPage] = useState(1)

  // Truy vấn dữ liệu tóm tắt địa điểm
  const {
    data: summary,
    isLoading: isLoadingSummary,
    isError: isSummaryError,
    refetch: refetchSummary,
  } = usePlaceSummaryQuery(placeId, isOpen)

  // Truy vấn danh sách bài viết tại địa điểm
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

  // Xử lý điều hướng khi bấm vào tên địa điểm: tới /search?locationId=...&locationName=...
  const handlePlaceNameClick = (locId: string, locName: string) => {
    startTransition(() => {
      navigate(
        `/search?locationId=${encodeURIComponent(locId)}&locationName=${encodeURIComponent(locName)}`,
      )
    })
  }

  // Xử lý điều hướng khi bấm vào chủ đề xu hướng: tới /search?topic=...&locationId=...&locationName=...
  const handleSelectTopic = (topicName: string) => {
    if (!summary?.place) return
    const { place } = summary
    startTransition(() => {
      navigate(
        `/search?topic=${encodeURIComponent(topicName)}&locationId=${encodeURIComponent(place.id)}&locationName=${encodeURIComponent(place.name)}`,
      )
    })
  }

  // Hiển thị khung chờ Skeleton khi đang tải dữ liệu tóm tắt
  const renderLoadingSkeleton = () => (
    <div className="flex flex-col gap-4">
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

  // Hiển thị thông báo lỗi khi không thể tải dữ liệu địa điểm
  const renderError = () => (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <p className="text-sm font-medium text-destructive">
        Không thể tải thông tin địa điểm
      </p>
      <Button variant="outline" size="sm" onClick={() => refetchSummary()}>
        <RefreshCw className="size-3.5 mr-1.5" />
        Thử lại
      </Button>
    </div>
  )

  return (
    <MapSidePanel
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết địa điểm"
      ariaLabel="Chi tiết địa điểm"
    >
      {isLoadingSummary ? (
        renderLoadingSkeleton()
      ) : isSummaryError || !summary ? (
        renderError()
      ) : (
        <div className="flex flex-col gap-4 w-full min-w-0 overflow-x-hidden">
          {/* 1. Phần đầu: Tên địa điểm dạng nút bấm điều hướng và loại địa điểm */}
          <div className="flex flex-col gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => handlePlaceNameClick(summary.place.id, summary.place.name)}
              aria-label={`Xem tất cả bài viết ở ${summary.place.name}`}
              className="group flex items-start gap-2 text-left font-bold text-lg text-foreground hover:text-primary transition-colors cursor-pointer min-w-0"
            >
              <MapPin className="size-5 text-primary shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              <span className="break-words underline-offset-4 group-hover:underline leading-snug">
                {summary.place.name}
              </span>
            </button>

            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <Badge variant="secondary" className="text-[11px] font-medium shrink-0">
                {formatLocationType(summary.place.locationType)}
              </Badge>
              {summary.place.description && (
                <span className="text-xs text-muted-foreground line-clamp-1 break-words">
                  {summary.place.description}
                </span>
              )}
            </div>
          </div>

          {/* 2. Thống kê bài viết: 3 ô đếm (1 ngày · 7 ngày · 30 ngày) và mốc bài mới nhất */}
          <div className="min-w-0">
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/40 p-2.5 border border-border/60 min-w-0">
              <div className="flex flex-col items-center text-center">
                <span className="text-[10px] font-medium text-muted-foreground">Hôm nay</span>
                <span className="text-base font-bold text-foreground">{summary.counts.last1d}</span>
              </div>
              <div className="flex flex-col items-center text-center border-x border-border/50">
                <span className="text-[10px] font-medium text-muted-foreground">7 ngày</span>
                <span className="text-base font-bold text-primary">{summary.counts.last7d}</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="text-[10px] font-medium text-muted-foreground">30 ngày</span>
                <span className="text-base font-bold text-foreground">{summary.counts.last30d}</span>
              </div>
            </div>

            {summary.latestPostAt && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground min-w-0">
                <Clock className="size-3.5 text-primary shrink-0" />
                <span className="truncate">
                  Bài mới nhất:{' '}
                  <strong className="text-foreground font-semibold">
                    {formatRelativeVi(summary.latestPostAt)}
                  </strong>{' '}
                  ({formatFullDateTimeVi(summary.latestPostAt)})
                </span>
              </div>
            )}
          </div>

          {/* 3. Chủ đề xu hướng dạng chip có số lượng bài */}
          {summary.trendingTopics.length > 0 && (
            <div className="flex flex-col gap-1.5 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <TrendingUp className="size-3.5 text-primary shrink-0" />
                <span>Chủ đề nổi bật</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {summary.trendingTopics.map((topic) => (
                  <button
                    key={topic.name}
                    type="button"
                    onClick={() => handleSelectTopic(topic.name)}
                    className="group inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground shadow-2xs hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all active:scale-95 cursor-pointer max-w-full"
                  >
                    <Hash className="size-3 text-muted-foreground group-hover:text-primary shrink-0" />
                    <span className="truncate max-w-[120px]">{topic.name}</span>
                    <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-semibold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary shrink-0">
                      {topic.postCount}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. Thanh công cụ lọc thời gian và chuyển đổi sắp xếp bài viết */}
          <div className="border-t border-border/50 pt-3 flex flex-wrap items-center justify-between gap-2 min-w-0">
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

          {/* 5. Danh sách bài viết tại địa điểm (bố cục 1 cột, không cuộn ngang) */}
          <div className="flex flex-col gap-3 pb-6 w-full min-w-0">
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
            ) : (postsData?.items || []).length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 p-6 text-center text-xs text-muted-foreground">
                Chưa có bài viết trong khoảng thời gian này
              </div>
            ) : (
              <>
                {(postsData?.items || []).map((post) => (
                  <PostCardCompact
                    key={post.id}
                    post={post}
                    onClick={() => {
                      /* Giữ trạng thái URL để nút Back trình duyệt quay về đúng địa điểm */
                    }}
                  />
                ))}

                {(postsData?.items || []).length < (postsData?.total || 0) && (
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
                    Xem thêm bài viết ({(postsData?.items || []).length}/{postsData?.total || 0})
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </MapSidePanel>
  )
}
