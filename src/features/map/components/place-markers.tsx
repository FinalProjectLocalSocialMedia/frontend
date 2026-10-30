import { useEffect, useMemo } from 'react'
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
  onPlacesLoaded?: (places: MapPlace[]) => void
}

/**
 * Hiển thị marker địa điểm trên bản đồ:
 * - Khi mức zoom 10-12 (Pha 2B): hiển thị CHẤM HOTSPOT không tên, kích thước theo trendScore, tối đa 20 chấm
 * - Khi mức zoom >= 13 (Pha 3): hiển thị marker dạng PILL đầy đủ tên rút gọn và số lượng bài viết
 * - Nhấp chuột vào bất kỳ chấm hoặc marker nào để mở PlaceDetailModal (?place=<id>)
 */
export function PlaceMarkers({ viewport, statsWindow, onSelectPlace, onPlacesLoaded }: PlaceMarkersProps) {
  const currentZoom = viewport?.zoom ?? 0
  const isHotspotZoom = currentZoom >= MAP_CONFIG.HOTSPOT_DOT_MIN_ZOOM && currentZoom < MAP_CONFIG.PLACE_MARKER_MIN_ZOOM
  const isPillZoom = currentZoom >= MAP_CONFIG.PLACE_MARKER_MIN_ZOOM
  const isZoomEligible = Boolean(viewport && (isHotspotZoom || isPillZoom))

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

  // Lấy dữ liệu marker địa điểm (giới hạn 20 ở zoom thấp, 60 ở zoom cao)
  const queryLimit = isHotspotZoom ? MAP_CONFIG.HOTSPOT_DOT_LIMIT : MAP_CONFIG.MAX_PLACE_MARKERS

  const { data: rawPlaces } = usePlaceMarkersQuery(
    {
      bounds: queryBounds ?? { north: 0, south: 0, east: 0, west: 0 },
      limit: queryLimit,
      window: statsWindow,
    },
    Boolean(queryBounds),
  )

  // Báo danh sách marker đã tải lên component cha (ExplorePage) để phục vụ PlaceFocusCard mà không cần gọi API thêm
  useEffect(() => {
    if (rawPlaces && onPlacesLoaded) {
      onPlacesLoaded(rawPlaces)
    }
  }, [rawPlaces, onPlacesLoaded])

  // Lọc chồng lấn các marker theo mức zoom hiện tại
  const visiblePlaces = useMemo(() => {
    if (!rawPlaces || rawPlaces.length === 0 || !viewport) return []

    // Sắp xếp ưu tiên địa điểm có trendScore cao hơn
    const sorted = [...rawPlaces].sort((a, b) => b.trendScore - a.trendScore)

    if (isHotspotZoom) {
      return deduplicateMarkersByCollision<MapPlace>(
        sorted,
        (p) => p.center,
        () => ({ width: 22, height: 22 }),
        viewport.zoom,
        6,
      )
    }

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
  }, [rawPlaces, viewport?.zoom, isHotspotZoom])

  if (!isZoomEligible || visiblePlaces.length === 0) {
    return null
  }

  return (
    <>
      {visiblePlaces.map((place) => {
        // Chế độ chấm hotspot ở zoom thấp (10-12): chấm tròn nhỏ không tên
        if (isHotspotZoom) {
          const dotSize = Math.min(16, Math.max(10, Math.round(10 + Math.min(1, place.trendScore / 100) * 6)))

          return (
            <AdvancedMarker
              key={place.id}
              position={{ lat: place.center.latitude, lng: place.center.longitude }}
              onClick={() => onSelectPlace(place.id)}
              zIndex={15}
            >
              <button
                type="button"
                className="group relative flex items-center justify-center rounded-full bg-rose-500 border-2 border-white shadow-md transition-all hover:scale-130 hover:bg-rose-600 active:scale-95 cursor-pointer focus-visible:outline-hidden"
                style={{ width: `${dotSize}px`, height: `${dotSize}px` }}
                aria-label={`Điểm nóng ${place.name}, ${place.postCount} bài viết`}
                title={`${place.name} (${place.postCount} bài viết - Nhấp để xem chi tiết)`}
              >
                <span className="sr-only">{place.name}</span>
                <span className="absolute -inset-1 rounded-full bg-rose-500/30 animate-ping pointer-events-none" />
              </button>
            </AdvancedMarker>
          )
        }

        // Chế độ marker dạng pill ở zoom >= 13: hiển thị tên rút gọn và số bài
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
              className="group flex items-center gap-1.5 rounded-full border border-primary/30 bg-card/95 px-2.5 py-1 text-xs font-semibold text-foreground shadow-md backdrop-blur-xs transition-all hover:scale-105 hover:border-primary hover:bg-card active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
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
