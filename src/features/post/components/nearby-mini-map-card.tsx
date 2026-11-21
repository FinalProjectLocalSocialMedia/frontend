import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, MapPin } from 'lucide-react'
import { latLngToCell } from 'h3-js'
import { latLngToPixel } from '@/components/map/geo'
import type { GeoPoint } from '@/components/map/map-types'
import { VITE_GOOGLE_MAPS_API_KEY, VITE_GOOGLE_MAPS_ID } from '@/config/env'
import { useMiniMapPreview } from '../api/post-queries'

const DEFAULT_PREVIEW_CENTER: GeoPoint = { latitude: 21.0285, longitude: 105.8542 }
const PREVIEW_ZOOM = 16
const MINI_MAP_H3_RES = 11
const MINI_MAP_CACHE_KEY = 'nearby_mini_map_h3_cache'
const CARD_WIDTH_PX = 300
const CARD_HEIGHT_PX = 190

type MiniMapCenterCache = {
  h3Index: string
  center: GeoPoint
}

function readMiniMapCache(): MiniMapCenterCache | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(MINI_MAP_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<MiniMapCenterCache>
    if (
      typeof parsed.h3Index === 'string' &&
      parsed.center &&
      typeof parsed.center.latitude === 'number' &&
      typeof parsed.center.longitude === 'number'
    ) {
      return { h3Index: parsed.h3Index, center: parsed.center }
    }
  } catch {
    // Bỏ qua nếu dữ liệu cache không hợp lệ hoặc localStorage bị chặn
  }
  return null
}

function resolveMiniMapCenter(gpsPosition: GeoPoint | null): {
  center: GeoPoint
  h3Index: string | null
  shouldPersist: boolean
} {
  const cached = readMiniMapCache()
  if (!gpsPosition) {
    return {
      center: cached?.center ?? DEFAULT_PREVIEW_CENTER,
      h3Index: cached?.h3Index ?? null,
      shouldPersist: false,
    }
  }

  try {
    const h3Index = latLngToCell(gpsPosition.latitude, gpsPosition.longitude, MINI_MAP_H3_RES)
    // Nếu vẫn thuộc cùng ô H3 res 11 (~25m), giữ nguyên toạ độ lat/lng thật đã cache để không gọi API ảnh mới
    if (cached && cached.h3Index === h3Index) {
      return {
        center: cached.center,
        h3Index,
        shouldPersist: false,
      }
    }
    return {
      center: gpsPosition,
      h3Index,
      shouldPersist: true,
    }
  } catch {
    return {
      center: gpsPosition,
      h3Index: null,
      shouldPersist: false,
    }
  }
}

export type NearbyMiniMapCardProps = {
  gpsPosition: GeoPoint | null
}

/**
 * Widget "Bản đồ quanh bạn" (Mini-Map Card) hiển thị ở cột phải trang Home.
 *   Google Maps Static API được cache theo ô H3 (res 11 ~25m), giữ nguyên toạ độ GPS thật
 *   khi chưa rời khỏi ô đó, kết hợp các chấm hotspot
 * - Có fallback nền đồ hoạ SVG tối giản nếu chưa có Static API key hoặc lỗi tải ảnh.
 * - Click vào card sẽ chuyển thẳng tới /explore với z=17.
 */
export function NearbyMiniMapCard({ gpsPosition }: NearbyMiniMapCardProps) {
  const [imgFailed, setImgFailed] = useState(false)

  const resolvedCenter = useMemo(() => resolveMiniMapCenter(gpsPosition), [gpsPosition])
  const mapCenter = resolvedCenter.center

  useEffect(() => {
    if (resolvedCenter.shouldPersist && resolvedCenter.h3Index) {
      try {
        window.localStorage.setItem(
          MINI_MAP_CACHE_KEY,
          JSON.stringify({
            h3Index: resolvedCenter.h3Index,
            center: resolvedCenter.center,
          }),
        )
      } catch {
        // Bỏ qua nếu localStorage bị chặn
      }
    }
  }, [resolvedCenter])

  const { data: previewData } = useMiniMapPreview(gpsPosition ?? mapCenter)

  const staticMapUrl = useMemo(() => {
    if (!VITE_GOOGLE_MAPS_API_KEY || imgFailed) return null
    const params = new URLSearchParams({
      center: `${mapCenter.latitude.toFixed(8)},${mapCenter.longitude.toFixed(8)}`,
      zoom: String(PREVIEW_ZOOM),
      size: `${CARD_WIDTH_PX * 2}x${CARD_HEIGHT_PX * 2}`,
      scale: '2',
      language: 'vi',
      region: 'VN',
      key: VITE_GOOGLE_MAPS_API_KEY,
    })
    if (VITE_GOOGLE_MAPS_ID) {
      params.set('map_id', VITE_GOOGLE_MAPS_ID)
    }
    return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`
  }, [mapCenter.latitude, mapCenter.longitude, imgFailed])

  // Quy đổi các điểm hotspot sang toạ độ % tương đối trên khung ảnh Static Map
  const projectedHotspots = useMemo(() => {
    const places = previewData?.places ?? []
    if (places.length === 0) return []

    const centerPx = latLngToPixel(mapCenter, PREVIEW_ZOOM)
    return places
      .map((place) => {
        const px = latLngToPixel(place.center, PREVIEW_ZOOM)
        const leftPct = 50 + ((px.x - centerPx.x) / CARD_WIDTH_PX) * 100
        const topPct = 50 + ((px.y - centerPx.y) / CARD_HEIGHT_PX) * 100
        return {
          ...place,
          leftPct,
          topPct,
        }
      })
      .filter((p) => p.leftPct >= 10 && p.leftPct <= 90 && p.topPct >= 15 && p.topPct <= 82)
      .slice(0, 4)
  }, [previewData?.places, mapCenter])

  const totalNewPosts = previewData?.totalNewPosts ?? 0
  const badgeText =
    totalNewPosts > 0
      ? `🔥 ${totalNewPosts} bài mới ở gần bạn`
      : '🔥 Khám phá quanh bạn'

  const topHotspot = projectedHotspots[0]

  const exploreTo = useMemo(() => {
    const params = new URLSearchParams({ z: '17' })
    if (gpsPosition) {
      params.set('lat', gpsPosition.latitude.toFixed(5))
      params.set('lng', gpsPosition.longitude.toFixed(5))
      params.set('src', 'gps')
    }
    return `/explore?${params.toString()}`
  }, [gpsPosition])

  return (
    <Link
      to={exploreTo}
      aria-label="Mở bản đồ quanh bạn"
      data-testid="nearby-mini-map-card"
      className="group relative block h-[190px] w-full overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-all hover:border-primary/50 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {/* Nền bản đồ tĩnh (Google Maps Static API) hoặc nền lưới fallback */}
      {staticMapUrl ? (
        <img
          src={staticMapUrl}
          alt="Xem trước bản đồ quanh bạn"
          loading="lazy"
          decoding="async"
          onError={() => setImgFailed(true)}
          className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
      ) : (
        <div className="relative size-full bg-muted/60">
          <svg
            aria-hidden="true"
            className="size-full text-border/70"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="mini-map-grid" width="28" height="28" patternUnits="userSpaceOnUse">
                <path
                  d="M 28 0 L 0 0 0 28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#mini-map-grid)" />
            <path
              d="M 0 110 Q 95 75 180 120 T 300 85"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-primary/25"
            />
          </svg>
        </div>
      )}

      {/* Lớp phủ gradient nhẹ giúp chữ và chấm hotspot nổi bật */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/95 via-background/20 to-background/30" />

      {/* Các chấm hotspot tĩnh (không vòng lan toả nhấp nháy) */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {projectedHotspots.length > 0 ? (
          projectedHotspots.map((spot) => (
            <div
              key={spot.id}
              style={{ left: `${spot.leftPct}%`, top: `${spot.topPct}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
            >
              <span className="block size-2.5 rounded-full border border-background bg-amber-500 shadow-sm" />
            </div>
          ))
        ) : (
          /* Chấm vị trí mặc định ở tâm khi chưa tải xong hoặc chưa có hotspot */
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <span className="block size-3 rounded-full border-2 border-background bg-primary shadow-sm" />
          </div>
        )}
      </div>

      {/* Nhãn địa điểm nổi bật nhất nếu nằm trong khung nhìn */}
      {topHotspot && (
        <div
          style={{ left: `${topHotspot.leftPct}%`, top: `${topHotspot.topPct}%` }}
          className="pointer-events-none absolute -translate-x-1/2 translate-y-2.5 max-w-[140px] truncate rounded-full border border-border/70 bg-background/90 px-2 py-0.5 text-[10px] font-medium text-foreground shadow-xs backdrop-blur-xs"
        >
          {topHotspot.name}
        </div>
      )}

      {/* Badge nổi ở góc trên trái */}
      <div className="pointer-events-none absolute top-3 left-3 inline-flex max-w-[calc(100%-24px)] items-center gap-1 rounded-full border border-border/70 bg-background/90 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-sm backdrop-blur-sm">
        <span className="truncate">{badgeText}</span>
      </div>

      {/* Thanh tiêu đề đáy card */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between px-3.5 py-2.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <MapPin className="size-3.5 shrink-0 text-primary" />
          <span className="truncate text-sm font-semibold text-foreground">
            Bản đồ quanh bạn
          </span>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary transition-transform group-hover:translate-x-0.5">
          Mở
          <ArrowRight className="size-3.5" />
        </span>
      </div>
    </Link>
  )
}
