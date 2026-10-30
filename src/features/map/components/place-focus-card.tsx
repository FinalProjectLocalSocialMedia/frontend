import { MapPin, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { STATS_WINDOW_LABELS } from '../lib/labels'
import type { MapPlace, StatsWindow } from '../lib/types'

export type PlaceFocusCardProps = {
  place: MapPlace | null
  statsWindow: StatsWindow
  onSelectPlace: (place: MapPlace) => void
  onDismiss: () => void
}

/**
 * Thẻ tiêu điểm địa điểm (PlaceFocusCard) theo mục 6.6 (Bước 1 & Bước 2).
 * - Hiển thị khi người dùng phóng to (zoom >= 17) và tâm bản đồ cách một địa điểm <= 80 mét
 * - Dùng toàn bộ danh sách marker địa điểm đã nạp sẵn trong bộ nhớ, tuyệt đối không gọi thêm API mạng
 * - Nổi ở trung tâm dưới bản đồ, không chặn thao tác kéo thả bản đồ
 * - Nhấp vào tên địa điểm để mở SearchResultsPanel với q = tên địa điểm và scope.placeId = id địa điểm
 */
export function PlaceFocusCard({
  place,
  statsWindow,
  onSelectPlace,
  onDismiss,
}: PlaceFocusCardProps) {
  if (!place) return null

  const windowLabel = STATS_WINDOW_LABELS[statsWindow] || `${statsWindow}`

  return (
    <div
      data-testid="place-focus-card"
      className="pointer-events-none absolute bottom-6 inset-x-0 z-20 flex justify-center px-4"
    >
      <div className="pointer-events-auto flex items-center gap-2.5 rounded-2xl border border-border/80 bg-background/95 px-3.5 py-2.5 shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-sm sm:max-w-md ring-1 ring-black/5 dark:ring-white/10">
        {/* Biểu tượng địa điểm ghim */}
        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <MapPin className="size-4" />
        </div>

        {/* Thông tin địa điểm & số lượng bài viết */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSelectPlace(place)}
              className="truncate text-left text-xs sm:text-sm font-bold text-foreground hover:text-primary hover:underline transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary rounded-xs"
              title={`Tìm kiếm bài viết tại ${place.name}`}
            >
              {place.name}
            </button>
          </div>
          <span className="truncate text-[11px] text-muted-foreground">
            {place.postCount} bài trong {windowLabel.toLowerCase()}
          </span>
        </div>

        {/* Nút hành động tìm kiếm */}
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => onSelectPlace(place)}
          className="h-7 gap-1 rounded-lg px-2.5 text-xs font-semibold shrink-0 shadow-2xs hover:bg-primary hover:text-primary-foreground transition-all"
        >
          <Search className="size-3" />
          <span>Xem bài</span>
        </Button>

        {/* Nút đóng / bỏ qua thẻ tiêu điểm */}
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          onClick={onDismiss}
          aria-label="Đóng thẻ địa điểm"
          className="size-6 rounded-full text-muted-foreground hover:text-foreground shrink-0"
        >
          <X className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}
