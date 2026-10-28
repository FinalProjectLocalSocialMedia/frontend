import { useMemo } from 'react'
import { AdvancedMarker } from '@vis.gl/react-google-maps'
import { Hash } from 'lucide-react'
import { padBounds } from '@/components/map/geo'
import { useTopicMarkersQuery } from '../api/map.queries'
import { deduplicateMarkersByCollision } from '../lib/marker-collision'
import { MAP_CONFIG } from '../lib/map-config'
import type { MapViewState, StatsWindow, TopicMarker } from '../lib/types'

export type TopicMarkersProps = {
  /** Thông tin camera và khung nhìn bản đồ hiện tại */
  viewport: MapViewState | null
  /** Cửa sổ thời gian thống kê (1d, 7d, 30d) */
  statsWindow: StatsWindow
  /** Callback khi người dùng nhấp vào marker chủ đề xu hướng */
  onSelectTopic: (topic: string, placeId: string) => void
}

/**
 * Hiển thị marker chủ đề xu hướng (TopicMarkers) trên bản đồ theo mục 6.5 (R4) và 7.3:
 * - Chỉ xuất hiện khi mức zoom >= 15 (MAP_CONFIG.TOPIC_MARKER_MIN_ZOOM)
 * - Mỗi địa điểm trong khung nhìn hiển thị chủ đề hàng đầu dạng pill (#tênchủđề · sốbài)
 * - Tối đa 40 marker DOM (MAP_CONFIG.MAX_TOPIC_MARKERS) để đảm bảo ngân sách hiệu năng
 * - Áp dụng thuật toán loại bỏ chồng lấn tham lam (Greedy collision deduplication) sau khi camera idle
 * - Click vào marker mở panel TopicPostsModal (?topic=<t>&place=<id>)
 */
export function TopicMarkers({ viewport, statsWindow, onSelectTopic }: TopicMarkersProps) {
  const currentZoom = viewport?.zoom ?? 0
  const isZoomEligible = Boolean(viewport && currentZoom >= MAP_CONFIG.TOPIC_MARKER_MIN_ZOOM)

  // Đệm thêm 25% bounds và làm tròn 3 số thập phân để tái sử dụng cache TanStack Query
  const queryBounds = useMemo(() => {
    if (!viewport || !isZoomEligible) return null
    const padded = padBounds(viewport.bounds, MAP_CONFIG.VIEWPORT_PADDING)
    return {
      north: Number(padded.north.toFixed(3)),
      south: Number(padded.south.toFixed(3)),
      east: Number(padded.east.toFixed(3)),
      west: Number(padded.west.toFixed(3)),
    }
  }, [viewport, isZoomEligible])

  // Lấy dữ liệu marker chủ đề từ service
  const { data: rawMarkers } = useTopicMarkersQuery(
    {
      bounds: queryBounds ?? { north: 0, south: 0, east: 0, west: 0 },
      limit: MAP_CONFIG.MAX_TOPIC_MARKERS,
      window: statsWindow,
    },
    Boolean(queryBounds),
  )

  // Loại bỏ chồng lấn các marker theo toạ độ điểm ảnh ở mức zoom hiện tại
  const visibleMarkers = useMemo(() => {
    if (!rawMarkers || rawMarkers.length === 0 || !viewport) return []

    // Sắp xếp ưu tiên marker có điểm xu hướng (score) cao hơn
    const sorted = [...rawMarkers].sort((a, b) => b.score - a.score)

    return deduplicateMarkersByCollision<TopicMarker>(
      sorted,
      (m) => m.position,
      (m) => {
        const charWidth = 7.5
        const approxWidth = Math.min(m.topic.length, 14) * charWidth + 56
        return { width: approxWidth, height: 32 }
      },
      viewport.zoom,
      8, // Khoảng cách đệm an toàn giữa các pill
    ).slice(0, MAP_CONFIG.MAX_TOPIC_MARKERS)
  }, [rawMarkers, viewport?.zoom])

  if (!isZoomEligible || visibleMarkers.length === 0) {
    return null
  }

  return (
    <>
      {visibleMarkers.map((marker) => {
        const displayTopic = marker.topic.length > 14 ? `${marker.topic.slice(0, 13)}…` : marker.topic

        return (
          <AdvancedMarker
            key={marker.id}
            position={{ lat: marker.position.latitude, lng: marker.position.longitude }}
            onClick={() => onSelectTopic(marker.topic, marker.placeId)}
            zIndex={25}
          >
            <button
              type="button"
              className="group flex items-center gap-1.5 rounded-full border border-orange-500/40 bg-card/95 px-2.5 py-1 text-xs font-semibold text-foreground shadow-md backdrop-blur-xs transition-all hover:scale-105 hover:border-orange-500 hover:bg-orange-50/80 active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-orange-500 cursor-pointer"
              aria-label={`Chủ đề ${marker.topic} tại ${marker.placeName}, ${marker.postCount} bài viết`}
              title={`#${marker.topic} · ${marker.placeName} (${marker.postCount} bài viết - Nhấp để xem)`}
            >
              <Hash className="size-3 text-orange-600 shrink-0 transition-transform group-hover:scale-110" />
              <span className="truncate max-w-[110px] font-bold text-orange-950 dark:text-orange-200">
                {displayTopic}
              </span>
              <span className="flex items-center justify-center rounded-full bg-orange-500/15 px-1.5 py-0.2 text-[10px] font-bold text-orange-700 dark:text-orange-300">
                {marker.postCount}
              </span>
            </button>
          </AdvancedMarker>
        )
      })}
    </>
  )
}
