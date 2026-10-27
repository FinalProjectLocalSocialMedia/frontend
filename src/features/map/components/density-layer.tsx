import { useEffect, useMemo, useRef, useState } from 'react'
import { cellToLatLng } from 'h3-js'
import { useDeckLayers } from '@/components/map/deck-overlay'
import { haversineMeters, padBounds } from '@/components/map/geo'
import { buildHexLayer, zoomToResolution } from '@/components/map/h3-layers'
import { useMapContext } from '@/components/map/map-context'
import { useDensityQuery } from '../api/map.queries'
import { STATS_WINDOW_LABELS } from '../lib/labels'
import { MAP_CONFIG } from '../lib/map-config'
import type { DensityCell, DensityQuery, GeoPoint, MapViewState, RadiusKm, StatsWindow } from '../lib/types'
import { DensityStatus } from './density-status'

export type DensityLayerProps = {
  viewport: MapViewState | null
  statsWindow: StatsWindow
  areaCenter: GeoPoint
  radiusKm: RadiusKm
  onFirstPaint?: (durationMs: number, cellCount: number, resolution: number) => void
  onDensityLoaded?: (cellCount: number, totalPosts: number, resolution: number) => void
}

/**
 * Lớp hiển thị mật độ hoạt động H3HexagonLayer trên Google Map (R1).
 * - Sử dụng useDeckLayers để đăng ký layer vào duy nhất một instance GoogleMapsOverlay
 * - Tự động đệm bounds 25% và làm tròn toạ độ để tối ưu hoá bộ nhớ đệm TanStack Query
 * - Áp dụng debounce 250ms khi camera chuyển sang trạng thái 'idle'
 * - Làm mờ các ô lục giác nằm ngoài bán kính quan tâm (alpha ~35%)
 * - Nhấp chuột vào ô khi zoom < 13 để phóng to (zoom +2)
 * - Hiển thị tooltip trực tiếp qua thao tác DOM tránh re-render React khi hover
 * - Đo lường thời gian 'density-first-paint'
 */
export function DensityLayer({
  viewport,
  statsWindow,
  areaCenter,
  radiusKm,
  onFirstPaint,
  onDensityLoaded,
}: DensityLayerProps) {
  const { flyTo } = useMapContext()
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasRecordedFirstPaintRef = useRef(false)
  const mountTimeRef = useRef(performance.now())

  // Trạng thái truy vấn mật độ đã qua xử lý debounce
  const [debouncedQuery, setDebouncedQuery] = useState<DensityQuery | null>(null)

  // Cập nhật tham số truy vấn có debounce 250ms khi viewport hoặc cửa sổ thời gian thay đổi
  useEffect(() => {
    if (!viewport) return

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      // Đệm thêm 25% cho mỗi cạnh của viewport
      const padded = padBounds(viewport.bounds, MAP_CONFIG.VIEWPORT_PADDING)
      const resolution = zoomToResolution(viewport.zoom)

      // Làm tròn 3 chữ số thập phân (~100m) để cache ổn định
      const stableBounds = {
        north: Number(padded.north.toFixed(3)),
        south: Number(padded.south.toFixed(3)),
        east: Number(padded.east.toFixed(3)),
        west: Number(padded.west.toFixed(3)),
      }

      setDebouncedQuery({
        bounds: stableBounds,
        resolution,
        window: statsWindow,
      })
    }, MAP_CONFIG.FETCH_DEBOUNCE_MS)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [viewport, statsWindow])

  // Kích hoạt TanStack Query hook lấy dữ liệu mật độ
  const {
    data: densityData,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useDensityQuery(
    debouncedQuery ?? {
      bounds: { north: 0, south: 0, east: 0, west: 0 },
      resolution: 8,
      window: statsWindow,
    },
    Boolean(debouncedQuery),
  )

  // Báo cáo số liệu khi dữ liệu mật độ tải thành công
  useEffect(() => {
    if (!densityData) return

    onDensityLoaded?.(densityData.cells.length, densityData.totalPosts, densityData.resolution)

    // Đo lường thời gian density-first-paint lần đầu tiên
    if (!hasRecordedFirstPaintRef.current && densityData.cells.length > 0) {
      hasRecordedFirstPaintRef.current = true
      performance.mark('map:density-first-paint')
      const durationMs = performance.now() - mountTimeRef.current
      onFirstPaint?.(durationMs, densityData.cells.length, densityData.resolution)
    }
  }, [densityData, onFirstPaint, onDensityLoaded])

  // Xử lý sự kiện hover hiển thị tooltip cập nhật DOM trực tiếp (không re-render React)
  const handleCellHover = (info: { object?: DensityCell; x: number; y: number }) => {
    const tooltipEl = tooltipRef.current
    if (!tooltipEl) return

    if (!info.object) {
      tooltipEl.style.display = 'none'
      return
    }

    const cell = info.object
    const windowLabel = STATS_WINDOW_LABELS[statsWindow] || statsWindow

    // Ô dưới ngưỡng riêng tư tối thiểu (MIN_POSTS_PER_CELL = 3)
    const text =
      cell.count < MAP_CONFIG.MIN_POSTS_PER_CELL
        ? 'Ít bài viết'
        : `≈ ${cell.count} bài viết trong ${windowLabel}`

    tooltipEl.textContent = text
    tooltipEl.style.left = `${info.x + 12}px`
    tooltipEl.style.top = `${info.y + 12}px`
    tooltipEl.style.display = 'block'
  }

  // Xử lý sự kiện click ô lục giác để phóng to (zoom +2) khi mức zoom < 13
  const handleCellClick = (info: { object?: DensityCell }) => {
    if (!info.object || !viewport) return

    if (viewport.zoom < MAP_CONFIG.PLACE_MARKER_MIN_ZOOM) {
      try {
        const [lat, lng] = cellToLatLng(info.object.h3Index)
        flyTo({ latitude: lat, longitude: lng }, Math.min(MAP_CONFIG.MAX_ZOOM, viewport.zoom + 2))
      } catch {
        /* Bỏ qua nếu lỗi chuyển đổi h3 */
      }
    }
  }

  // Kiểm tra ô lục giác nằm ngoài bán kính quan tâm để làm mờ
  const isCellDimmed = (cell: DensityCell): boolean => {
    try {
      const [lat, lng] = cellToLatLng(cell.h3Index)
      const distanceMeters = haversineMeters(areaCenter, { latitude: lat, longitude: lng })
      return distanceMeters > radiusKm * 1000
    } catch {
      return false
    }
  }

  // Khởi tạo deck.gl H3HexagonLayer
  const hexLayer = useMemo(() => {
    if (!densityData || densityData.cells.length === 0) {
      return null
    }

    return buildHexLayer<DensityCell>({
      id: 'h3-density-layer',
      data: densityData.cells,
      maxCount: Math.max(1, densityData.maxCount),
      isDimmed: isCellDimmed,
      pickable: true,
      coverage: 0.95,
      onHover: handleCellHover,
      onClick: handleCellClick,
    })
  }, [densityData, areaCenter, radiusKm, viewport?.zoom])

  // Đăng ký layer vào registry DeckOverlay duy nhất
  useDeckLayers('density', hexLayer ? [hexLayer] : [])

  return (
    <>
      {/* Tooltip hiển thị thông tin ô mật độ cập nhật trực tiếp qua DOM */}
      <div
        ref={tooltipRef}
        style={{ display: 'none' }}
        className="pointer-events-none fixed z-50 rounded-md border border-border/80 bg-popover/95 px-2.5 py-1 text-xs font-semibold text-popover-foreground shadow-md backdrop-blur-sm transition-opacity duration-75"
      />

      {/* Thông báo trạng thái tải, rỗng và lỗi của lớp mật độ */}
      <DensityStatus
        isFetching={isFetching || isLoading}
        isError={isError}
        isEmpty={Boolean(densityData && densityData.cells.length === 0)}
        onRetry={() => refetch()}
      />
    </>
  )
}
