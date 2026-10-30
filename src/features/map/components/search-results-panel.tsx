import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Users, MapPin, ChevronRight, Loader2, AlertCircle } from 'lucide-react'
import { MapSidePanel } from './map-side-panel'
import { TimeFilter } from './time-filter'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatRelativeVi } from '../lib/relative-time'
import { useMapSearchQuery } from '../api/map.queries'
import type { GeoPoint, MapPlace, RadiusKm, TimeFilterValue } from '../lib/types'

export type SearchResultsPanelProps = {
  isOpen: boolean
  onClose: () => void
  query: string
  placeId?: string | null
  placeName?: string | null
  areaCenter: GeoPoint
  radiusKm: RadiusKm
  onSelectPlace: (place: { id: string; name: string; center: GeoPoint }) => void
}

type TabKey = 'posts' | 'users' | 'places'

/**
 * Bảng hiển thị kết quả tìm kiếm trên bản đồ (SearchResultsPanel) theo mục 6.6 và 6.7.
 * - Dùng chung khung MapSidePanel (không overlay/backdrop, bản đồ vẫn thao tác được)
 * - 3 Tab: Bài viết (mặc định) · Người dùng · Địa điểm (Bước 4)
 * - Bộ lọc thời gian TimeFilter: preset (3h, 1d, 7d, 30d) hoặc chọn ngày cụ thể (Bước 5, 6)
 * - Điều hướng chi tiết theo mục 6.6 Bước 7:
 *   + Bài viết -> /posts/:id (post-detail có sẵn)
 *   + Người dùng -> /profile/:userId (ProfilePage có sẵn)
 *   + Địa điểm -> bay tới tâm địa điểm + mở PlaceDetailModal
 */
export function SearchResultsPanel({
  isOpen,
  onClose,
  query,
  placeId,
  placeName,
  areaCenter,
  radiusKm,
  onSelectPlace,
}: SearchResultsPanelProps) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabKey>('posts')
  const [timeFilter, setTimeFilter] = useState<TimeFilterValue>({ kind: 'all' })
  const [page, setPage] = useState(1)
  const pageSize = 10

  // Thực hiện tìm kiếm thông qua hook useMapSearchQuery
  const searchQueryArg = {
    q: query,
    scope: placeId
      ? { placeId }
      : { center: areaCenter, radiusKm },
    time: timeFilter,
    kinds: ['POST', 'USER', 'PLACE'] as const,
    page,
    pageSize,
  }

  const {
    data: searchData,
    isLoading,
    isError,
    refetch,
  } = useMapSearchQuery(searchQueryArg, isOpen && Boolean(query.trim()))

  const posts = searchData?.posts?.items ?? []
  const totalPosts = searchData?.posts?.total ?? 0
  const users = searchData?.users ?? []
  const places = searchData?.places ?? []

  // Định dạng hiển thị thời gian đăng bài theo Bước 4 và Bước 6
  const formatPostTime = (createdAt: string) => {
    if (timeFilter.kind === 'date') {
      const d = new Date(createdAt)
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = d.getFullYear()
      return `đăng ngày ${day}/${month}/${year}`
    }
    return `đăng ${formatRelativeVi(createdAt)}`
  }

  return (
    <MapSidePanel
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel="Bảng kết quả tìm kiếm"
      title={
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-foreground truncate">
            Kết quả tìm kiếm
          </span>
          <span className="text-xs text-muted-foreground truncate">
            {placeName ? `Tại ${placeName}` : `Từ khoá: "${query}"`}
          </span>
        </div>
      }
    >
      <div className="flex flex-col gap-3 p-3 sm:p-4 min-w-0">
        {/* Bộ lọc thời gian (TimeFilter) theo mục 6.7 */}
        <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
          <span className="text-xs font-semibold text-muted-foreground">
            Lọc bài viết theo:
          </span>
          <TimeFilter
            value={timeFilter}
            onChange={(val) => {
              setTimeFilter(val)
              setPage(1)
            }}
          />
        </div>

        {/* Danh sách 3 Tab: Bài viết · Người dùng · Địa điểm (Bước 4) */}
        <div className="flex items-center rounded-xl bg-muted/70 p-1 text-xs font-semibold">
          <button
            type="button"
            data-testid="search-tab-posts"
            onClick={() => setActiveTab('posts')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 transition-all ${
              activeTab === 'posts'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="size-3.5" />
            <span>Bài viết</span>
            <span className="text-[10px] opacity-70">({totalPosts})</span>
          </button>

          <button
            type="button"
            data-testid="search-tab-users"
            onClick={() => setActiveTab('users')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 transition-all ${
              activeTab === 'users'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="size-3.5" />
            <span>Người dùng</span>
            <span className="text-[10px] opacity-70">({users.length})</span>
          </button>

          <button
            type="button"
            data-testid="search-tab-places"
            onClick={() => setActiveTab('places')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 transition-all ${
              activeTab === 'places'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <MapPin className="size-3.5" />
            <span>Địa điểm</span>
            <span className="text-[10px] opacity-70">({places.length})</span>
          </button>
        </div>

        {/* Trạng thái Đang tải (Loading) */}
        {isLoading && (
          <div className="flex flex-col gap-2.5 py-2">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        )}

        {/* Trạng thái Lỗi (Error) */}
        {isError && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-center">
            <AlertCircle className="size-5 text-destructive" />
            <p className="text-xs text-destructive">Không thể tải kết quả tìm kiếm.</p>
            <Button size="sm" variant="outline" onClick={() => refetch()} className="h-7 text-xs">
              Thử lại
            </Button>
          </div>
        )}

        {/* Nội dung kết quả theo Tab */}
        {!isLoading && !isError && (
          <div className="flex flex-col gap-2 min-w-0">
            {/* TAB 1: BÀI VIẾT (Mục 6.6 Bước 4 & Bước 7) */}
            {activeTab === 'posts' && (
              <>
                {posts.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Không tìm thấy bài viết nào phù hợp trong khoảng thời gian này.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5 min-w-0">
                    {posts.map((post) => (
                      <div
                        key={post.id}
                        data-testid="search-post-item"
                        onClick={() => navigate(`/posts/${post.id}`)}
                        className="group flex flex-col gap-1.5 rounded-xl border border-border/70 bg-card p-3 shadow-2xs transition-all hover:border-primary/40 hover:shadow-xs cursor-pointer min-w-0"
                      >
                        {/* Tác giả & Thời gian đăng bài */}
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar className="size-5 shrink-0 ring-1 ring-border">
                              {post.author.avatarUrl && (
                                <AvatarImage src={post.author.avatarUrl} alt={post.author.displayName} />
                              )}
                              <AvatarFallback className="text-[9px] font-semibold">
                                {post.author.displayName.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                              {post.author.displayName}
                            </span>
                          </div>
                          {/* Thời gian hiển thị theo Bước 4: "(đăng 1 ngày trước)" */}
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            ({formatPostTime(post.createdAt)})
                          </span>
                        </div>

                        {/* Dòng đầu nội dung bài viết */}
                        <p className="line-clamp-2 text-xs text-foreground/90 leading-relaxed break-words">
                          {post.excerpt}
                        </p>

                        {/* Tên địa điểm */}
                        <div className="flex items-center gap-1 text-[11px] text-primary truncate pt-0.5">
                          <MapPin className="size-3 shrink-0" />
                          <span className="truncate font-medium">{post.place.name}</span>
                        </div>
                      </div>
                    ))}

                    {/* Phân trang / Xem thêm bài viết */}
                    {totalPosts > posts.length && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPage((prev) => prev + 1)}
                        className="mt-1 h-8 text-xs font-medium text-muted-foreground hover:text-foreground"
                      >
                        <span>Xem thêm bài viết ({posts.length}/{totalPosts})</span>
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}

            {/* TAB 2: NGƯỜI DÙNG (Mục 6.6 Bước 7 -> /profile/:userId) */}
            {activeTab === 'users' && (
              <>
                {users.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Không tìm thấy người dùng nào phù hợp.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 min-w-0">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        data-testid="search-user-item"
                        onClick={() => navigate(`/profile/${user.id}`)}
                        className="group flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card p-2.5 shadow-2xs transition-all hover:border-primary/40 hover:shadow-xs cursor-pointer min-w-0"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar className="size-8 shrink-0 ring-1 ring-border">
                            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.displayName} />}
                            <AvatarFallback className="text-xs font-bold">
                              {user.displayName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className="truncate text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                              {user.displayName}
                            </span>
                            {user.bio && (
                              <span className="truncate text-[11px] text-muted-foreground">
                                {user.bio}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* TAB 3: ĐỊA ĐIỂM (Mục 6.6 Bước 7 -> bay tới toạ độ và mở PlaceDetailModal) */}
            {activeTab === 'places' && (
              <>
                {places.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Không tìm thấy địa điểm nào phù hợp.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 min-w-0">
                    {places.map((place) => (
                      <div
                        key={place.id}
                        data-testid="search-place-item"
                        onClick={() => onSelectPlace(place)}
                        className="group flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card p-2.5 shadow-2xs transition-all hover:border-primary/40 hover:shadow-xs cursor-pointer min-w-0"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <MapPin className="size-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="truncate text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                              {place.name}
                            </span>
                            <span className="truncate text-[11px] text-muted-foreground">
                              {place.locationType} · {place.postCount} bài viết
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </MapSidePanel>
  )
}
