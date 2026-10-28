import { useState, useTransition } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Flame, Hash, MapPin, RefreshCw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { usePlaceSummaryQuery, useTopicFeedQuery } from '../api/map.queries'
import type { GeoPoint, PostSort, RadiusKm, TimeFilterValue } from '../lib/types'
import { MapSidePanel } from './map-side-panel'
import { PostCardCompact } from './post-card-compact'
import { TimeFilter } from './time-filter'

export type TopicPostsModalProps = {
  /** Chủ đề xu hướng được chọn hoặc null khi đóng */
  topic: string | null
  /** ID địa điểm tương ứng nếu marker gắn với địa điểm cụ thể */
  placeId?: string | null
  /** Tâm khu vực hiện tại để làm phạm vi tìm kiếm bài nếu không có địa điểm */
  areaCenter: GeoPoint
  /** Bán kính khu vực hiện tại */
  radiusKm: RadiusKm
  /** Trạng thái mở của panel */
  isOpen: boolean
  /** Callback đóng panel */
  onClose: () => void
}

/**
 * Panel hiển thị bài viết theo chủ đề xu hướng (TopicPostsModal) theo mục 6.5 (R4) và Pha 4:
 * - Sử dụng khung MapSidePanel (panel trái không overlay trên desktop, bottom sheet không backdrop trên mobile)
 * - Bản đồ phía sau và bên cạnh hoàn toàn thao tác được (zoom, pan, click marker khác)
 * - Tiêu đề dạng: #{topic} · {tên địa điểm}
 * - Nút "Xem tất cả bài về #{topic}" điều hướng tới trang /search?topic=<topic>
 * - Bộ lọc thời gian TimeFilter và chuyển đổi sắp xếp Xu hướng / Mới nhất
 * - Danh sách bài viết dạng PostCardCompact bố cục 1 cột, không có thanh cuộn ngang
 */
export function TopicPostsModal({
  topic,
  placeId,
  areaCenter,
  radiusKm,
  isOpen,
  onClose,
}: TopicPostsModalProps) {
  const navigate = useNavigate()
  const [, startTransition] = useTransition()

  // State bộ lọc thời gian và cách sắp xếp bài viết
  const [timeFilter, setTimeFilter] = useState<TimeFilterValue>({ kind: 'all' })
  const [sort, setSort] = useState<PostSort>('TRENDING')
  const [page, setPage] = useState(1)

  // Truy vấn thông tin địa điểm (nếu có placeId) để hiển thị tên trong tiêu đề
  const { data: placeSummary } = usePlaceSummaryQuery(placeId, Boolean(placeId && isOpen))

  // Xác định phạm vi lấy bài viết (theo địa điểm cụ thể hoặc theo khu vực bán kính quanh tâm)
  const feedScope = placeId
    ? ({ kind: 'place', placeId } as const)
    : ({ kind: 'area', center: areaCenter, radiusKm } as const)

  // Truy vấn danh sách bài viết thuộc chủ đề
  const {
    data: feedData,
    isLoading: isLoadingFeed,
    isFetching: isFetchingFeed,
    isError: isFeedError,
    refetch: refetchFeed,
  } = useTopicFeedQuery(
    {
      topic: topic || '',
      scope: feedScope,
      time: timeFilter,
      sort,
      page: 1,
      pageSize: page * 10,
    },
    Boolean(topic && isOpen),
  )

  // Xử lý điều hướng khi bấm nút "Xem tất cả bài về #{topic}"
  const handleViewAllTopicPosts = () => {
    if (!topic) return
    startTransition(() => {
      navigate(`/search?topic=${encodeURIComponent(topic)}`)
    })
  }

  const posts = feedData?.items || []
  const totalPosts = feedData?.total || 0
  const hasMorePosts = posts.length < totalPosts
  const placeName = placeSummary?.place.name

  // Tiêu đề thanh header của panel
  const panelTitle = (
    <div className="flex items-center gap-1.5 min-w-0 font-bold text-sm text-foreground">
      <Hash className="size-4 text-orange-600 shrink-0" />
      <span className="text-orange-950 dark:text-orange-200 truncate">
        {topic ? `#${topic}` : 'Chủ đề'}
      </span>
      {placeName && (
        <>
          <span className="text-muted-foreground font-normal">·</span>
          <span className="truncate text-xs font-medium text-muted-foreground max-w-[120px]">
            {placeName}
          </span>
        </>
      )}
    </div>
  )

  return (
    <MapSidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={panelTitle}
      ariaLabel={`Danh sách bài viết chủ đề ${topic || ''}`}
    >
      <div className="flex flex-col gap-4 w-full min-w-0 overflow-x-hidden">
        {/* 1. Phần giới thiệu chủ đề & nút Xem tất cả bài */}
        <div className="flex flex-col gap-2 rounded-xl bg-orange-500/10 p-3 border border-orange-500/20 min-w-0">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-base font-extrabold text-orange-950 dark:text-orange-200 truncate">
                #{topic}
              </span>
              {placeName && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                  <MapPin className="size-3 text-primary shrink-0" />
                  <span className="truncate max-w-[140px]">{placeName}</span>
                </div>
              )}
            </div>
            <span className="shrink-0 rounded-full bg-orange-500/20 px-2 py-0.5 text-xs font-bold text-orange-700 dark:text-orange-300">
              {totalPosts} bài
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={handleViewAllTopicPosts}
            className="w-full justify-between text-xs font-semibold text-orange-700 dark:text-orange-300 border-orange-500/30 bg-background/80 hover:bg-orange-500/15 cursor-pointer mt-1"
          >
            <span>Xem tất cả bài về #{topic}</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </div>

        {/* 2. Thanh công cụ lọc thời gian và chọn sắp xếp */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3 min-w-0">
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

        {/* 3. Danh sách bài viết dạng PostCardCompact (bố cục 1 cột, không cuộn ngang) */}
        <div className="flex flex-col gap-3 pb-6 w-full min-w-0">
          {isLoadingFeed ? (
            <div className="space-y-3">
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
            </div>
          ) : isFeedError ? (
            <div className="py-6 text-center text-xs text-destructive">
              Không thể tải danh sách bài viết của chủ đề.
              <Button
                variant="link"
                size="xs"
                onClick={() => refetchFeed()}
                className="ml-1 text-xs cursor-pointer"
              >
                Thử lại
              </Button>
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 p-6 text-center text-xs text-muted-foreground">
              Chưa có bài viết nào thuộc chủ đề này trong khoảng thời gian đã chọn
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <PostCardCompact
                  key={post.id}
                  post={post}
                  onClick={() => {
                    /* Giữ trạng thái URL để nút Back trình duyệt quay về đúng vị trí */
                  }}
                />
              ))}

              {hasMorePosts && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={isFetchingFeed}
                  className="w-full mt-2 text-xs font-medium cursor-pointer"
                >
                  {isFetchingFeed ? (
                    <RefreshCw className="size-3.5 animate-spin mr-1.5" />
                  ) : null}
                  Xem thêm bài viết ({posts.length}/{totalPosts})
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </MapSidePanel>
  )
}
