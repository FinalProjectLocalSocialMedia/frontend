import { useMemo } from 'react'
import { AdvancedMarker } from '@vis.gl/react-google-maps'
import { MapPin } from 'lucide-react'
import { padBounds } from '@/components/map/geo'
import { usePlaceMarkersQuery } from '../api/map.queries'
import { deduplicateMarkersByCollision } from '../lib/marker-collision'
import { MAP_CONFIG } from '../lib/map-config'
import type { MapPlace, MapViewState, StatsWindow } from '../lib/types'

export type PlaceMarkersProps = {
  viewport: MapViewState | null
  statsWindow: StatsWindow
  onSelectPlace: (placeId: string) => void
}

/**
 * Hiển thị danh sách marker địa điểm trên bản đồ khi mức zoom >= 13 (R2).
 * - Sử dụng AdvancedMarker của @vis.gl/react-google-maps
 * - Loại bỏ chồng lấn marker tham lam (deduplicateMarkersByCollision) theo toạ độ pixel
 * - Mỗi marker hiển thị tên rút gọn và số lượng bài viết trong cửa sổ thống kê
 * - Nhấp chuột vào marker để mở PlaceDetailModal (?place=<id>)
 */
export function PlaceMarkers({ viewport, statsWindow, onSelectPlace }: PlaceMarkersProps) {
  // Chỉ hiển thị marker địa điểm khi mức zoom >= 13
  const isZoomEligible = Boolean(viewport && viewport.zoom >= MAP_CONFIG.PLACE_MARKER_MIN_ZOOM)

  // Đệm thêm 25% bounds và làm tròn để cache TanStack Query ổn định
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

  // Lấy dữ liệu marker địa điểm
  const { data: rawPlaces } = usePlaceMarkersQuery(
    {
      bounds: queryBounds ?? { north: 0, south: 0, east: 0, west: 0 },
      limit: MAP_CONFIG.MAX_PLACE_MARKERS,
      window: statsWindow,
    },
    Boolean(queryBounds),
  )

  // Lọc chồng lấn các marker theo mức zoom hiện tại
  const visiblePlaces = useMemo(() => {
    if (!rawPlaces || rawPlaces.length === 0 || !viewport) return []

    // Sắp xếp ưu tiên địa điểm có trendScore cao hơn
    const sorted = [...rawPlaces].sort((a, b) => b.trendScore - a.trendScore)

    return deduplicateMarkersByCollision<MapPlace>(
      sorted,
      (p) => p.center,
      (p) => {
        const charWidth = 7
        const approxWidth = Math.min(p.name.length, 16) * charWidth + 50
        return { width: approxWidth, height: 32 }
      },
      viewport.zoom,
      8, // khoảng cách đệm an toàn giữa các marker
    )
  }, [rawPlaces, viewport?.zoom])

  if (!isZoomEligible || visiblePlaces.length === 0) {
    return null
  }

  return (
    <>
      {visiblePlaces.map((place) => {
        // Tên hiển thị rút gọn tối đa 16 ký tự
        const displayName = place.name.length > 16 ? `${place.name.slice(0, 15)}…` : place.name

        return (
          <AdvancedMarker
            key={place.id}
            position={{ lat: place.center.latitude, lng: place.center.longitude }}
            onClick={() => onSelectPlace(place.id)}
            zIndex={20}
          >
            <button
              type="button"
              className="group flex items-center gap-1.5 rounded-full border border-primary/30 bg-card/95 px-2.5 py-1 text-xs font-semibold text-foreground shadow-md backdrop-blur-xs transition-all hover:scale-105 hover:border-primary hover:bg-card active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={`Địa điểm ${place.name}, ${place.postCount} bài viết`}
              title={`${place.name} (${place.postCount} bài viết)`}
            >
              <MapPin className="size-3 text-primary shrink-0 transition-transform group-hover:translate-y-[-1px]" />
              <span className="truncate max-w-[120px]">{displayName}</span>
              {place.postCount > 0 && (
                <span className="flex items-center justify-center rounded-full bg-primary/10 px-1.5 py-0.2 text-[10px] font-bold text-primary">
                  {place.postCount}
                </span>
              )}
            </button>
          </AdvancedMarker>
        )
      })}
    </>
  )
}
