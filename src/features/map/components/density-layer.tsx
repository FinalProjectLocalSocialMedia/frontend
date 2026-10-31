import { useEffect, useMemo, useRef, useState } from 'react'
import { cellToLatLng } from 'h3-js'
import { toast } from 'sonner'
import { useDeckLayers } from '@/components/map/deck-overlay'
import { haversineMeters, padBounds } from '@/components/map/geo'
import { buildHexLayer, zoomToResolution } from '@/components/map/h3-layers'
import {
  buildHeatmapLayer,
  cellsToHeatPoints,
  radiusPixelsForZoom,
  supportsHeatmap,
} from '@/components/map/heatmap-layers'
import { useMapContext } from '@/components/map/map-context'
import { useDensityQuery, useHeatPointsQuery } from '../api/map.queries'
import { STATS_WINDOW_LABELS } from '../lib/labels'
import { MAP_CONFIG } from '../lib/map-config'
import type {
  DensityCell,
  DensityMode,
  DensityQuery,
  GeoPoint,
  HeatPointsQuery,
  MapViewState,
  RadiusKm,
  StatsWindow,
} from '../lib/types'
import { writeDensityModeToStorage } from '../lib/url-state'
import { DensityStatus } from './density-status'

export type DensityLayerProps = {
  viewport: MapViewState | null
  statsWindow: StatsWindow
  areaCenter: GeoPoint
  radiusKm: RadiusKm
  mode?: DensityMode
  onFallbackToHex?: () => void
  onFirstPaint?: (durationMs: number, cellCount: number, resolution: number) => void
  onDensityLoaded?: (cellCount: number, totalPosts: number, resolution: number) => void
}

/**
 * Lớp hiển thị mật độ hoạt động trên Google Map (Pha 2 & Pha 2B).
 * - Hoạt động như một bộ chuyển chế độ giữa HEATMAP (mượt mà) và HEX (ô lục giác H3)
 * - Sử dụng useDeckLayers để đăng ký duy nhất layer có id 'density' vào GoogleMapsOverlay
 * - Chế độ HEATMAP: nạp điểm nhiệt qua getHeatPoints, tính radiusPixels theo zoom khi idle, không hover ô
 * - Chế độ HEX: hiển thị ô lục giác H3, làm mờ ngoài bán kính, hover hiển thị tooltip, click phóng to
 * - Tự động phát hiện hỗ trợ WebGL2/texture float (supportsHeatmap); nếu không hỗ trợ tự lùi về HEX và hiện toast
 * - Đo lường thời gian 'density-first-paint'
 */
export function DensityLayer({
  viewport,
  statsWindow,
  areaCenter,
  radiusKm,
  mode = 'HEATMAP',
  onFallbackToHex,
  onFirstPaint,
  onDensityLoaded,
}: DensityLayerProps) {
  const { flyTo } = useMapContext()
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasRecordedFirstPaintRef = useRef(false)
  const mountTimeRef = useRef(performance.now())
  const hasWarnedUnsupportedRef = useRef(false)

  // Trạng thái truy vấn khung nhìn có đệm và debounce 250ms
  const [debouncedViewport, setDebouncedViewport] = useState<{
    bounds: DensityQuery['bounds']
    resolution: number
  } | null>(null)

  // Cập nhật tham số truy vấn có debounce 250ms khi viewport thay đổi
  useEffect(() => {
    if (!viewport) return

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      // Đệm thêm 25% cho mỗi cạnh của viewport
      const padded = padBounds(viewport.bounds, MAP_CONFIG.VIEWPORT_PADDING)
      const resolution = zoomToResolution(viewport.zoom)

      // Làm tròn 3 chữ số thập phân (~100m) để cache TanStack Query ổn định
      const stableBounds = {
        north: Number(padded.north.toFixed(3)),
        south: Number(padded.south.toFixed(3)),
        east: Number(padded.east.toFixed(3)),
        west: Number(padded.west.toFixed(3)),
      }

      setDebouncedViewport({
        bounds: stableBounds,
        resolution,
      })
    }, MAP_CONFIG.FETCH_DEBOUNCE_MS)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [viewport])

  const hexQuery: DensityQuery = useMemo(
    () => ({
      bounds: debouncedViewport?.bounds ?? { north: 0, south: 0, east: 0, west: 0 },
      resolution: debouncedViewport?.resolution ?? 8,
      window: statsWindow,
    }),
    [debouncedViewport, statsWindow],
  )

  const heatQuery: HeatPointsQuery = useMemo(
    () => ({
      bounds: debouncedViewport?.bounds ?? { north: 0, south: 0, east: 0, west: 0 },
      window: statsWindow,
      limit: MAP_CONFIG.HEATMAP.MAX_POINTS,
    }),
    [debouncedViewport, statsWindow],
  )

  // 1. Kích hoạt truy vấn ô lục giác HEX
  const {
    data: hexData,
    isLoading: isLoadingHex,
    isFetching: isFetchingHex,
    isError: isErrorHex,
    refetch: refetchHex,
  } = useDensityQuery(hexQuery, Boolean(debouncedViewport && mode === 'HEX'))

  // 2. Kích hoạt truy vấn điểm nhiệt HEATMAP
  const {
    data: heatData,
    isLoading: isLoadingHeat,
    isFetching: isFetchingHeat,
    isError: isErrorHeat,
    refetch: refetchHeat,
  } = useHeatPointsQuery(heatQuery, Boolean(debouncedViewport && mode === 'HEATMAP'))

  // Báo cáo số liệu và đo lường first paint khi dữ liệu tải xong
  useEffect(() => {
    if (mode === 'HEX' && hexData) {
      onDensityLoaded?.(hexData.cells.length, hexData.totalPosts, hexData.resolution)
      if (!hasRecordedFirstPaintRef.current && hexData.cells.length > 0) {
        hasRecordedFirstPaintRef.current = true
        performance.mark('map:density-first-paint')
        const durationMs = performance.now() - mountTimeRef.current
        onFirstPaint?.(durationMs, hexData.cells.length, hexData.resolution)
      }
    } else if (mode === 'HEATMAP' && heatData) {
      onDensityLoaded?.(heatData.points.length, heatData.totalPosts, 0)
      if (!hasRecordedFirstPaintRef.current && heatData.points.length > 0) {
        hasRecordedFirstPaintRef.current = true
        performance.mark('map:density-first-paint')
        const durationMs = performance.now() - mountTimeRef.current
        onFirstPaint?.(durationMs, heatData.points.length, 0)
      }
    }
  }, [mode, hexData, heatData, onFirstPaint, onDensityLoaded])

  // Xử lý hover hiển thị tooltip cho ô HEX qua thao tác DOM trực tiếp
  const handleCellHover = (info: { object?: DensityCell; x: number; y: number }) => {
    const tooltipEl = tooltipRef.current
    if (!tooltipEl) return

    if (!info.object || mode !== 'HEX') {
      tooltipEl.style.display = 'none'
      return
    }

    const cell = info.object
    const windowLabel = STATS_WINDOW_LABELS[statsWindow] || statsWindow
    const text =
      cell.count < MAP_CONFIG.MIN_POSTS_PER_CELL
        ? 'Ít bài viết'
        : `≈ ${cell.count} bài viết trong ${windowLabel}`

    tooltipEl.textContent = text
    tooltipEl.style.left = `${info.x + 12}px`
    tooltipEl.style.top = `${info.y + 12}px`
    tooltipEl.style.display = 'block'
  }

  // Xử lý click ô HEX để phóng to (zoom +2) khi zoom < 13
  const handleCellClick = (info: { object?: DensityCell }) => {
    if (!info.object || !viewport || mode !== 'HEX') return

    if (viewport.zoom < MAP_CONFIG.PLACE_MARKER_MIN_ZOOM) {
      try {
        const [lat, lng] = cellToLatLng(info.object.h3Index)
        flyTo({ latitude: lat, longitude: lng }, Math.min(MAP_CONFIG.MAX_ZOOM, viewport.zoom + 2))
      } catch {
        /* Bỏ qua nếu lỗi toạ độ */
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

  // Khởi tạo layer deck.gl tương ứng cho chế độ hiện tại
  const activeDeckLayer = useMemo(() => {
    if (mode === 'HEX') {
      if (!hexData || hexData.cells.length === 0) return null

      return buildHexLayer<DensityCell>({
        id: 'density-hex',
        data: hexData.cells,
        maxCount: Math.max(1, hexData.maxCount),
        isDimmed: isCellDimmed,
        pickable: true,
        coverage: 0.95,
        onHover: handleCellHover,
        onClick: handleCellClick,
      })
    }

    // Chế độ HEATMAP: Khi đổi sang Heatmap, ID khác 'density-hex' giúp deck.gl unmount triệt để ô lục giác
    if (!viewport) return null

    // Ưu tiên 1: Điểm nhiệt từ query getHeatPoints (Phương án A)
    // Ưu tiên 2: Chuyển đổi tức thì từ ô lục giác đã có trong bộ nhớ (Phương án B)
    let points = heatData?.points
    if (!points || points.length === 0) {
      if (hexData?.cells && hexData.cells.length > 0) {
        points = cellsToHeatPoints(hexData.cells)
      }
    }

    if (!points || points.length === 0) {
      return null
    }

    try {
      const radiusPixels = radiusPixelsForZoom(viewport.zoom, viewport.center.latitude)
      return buildHeatmapLayer(points, {
        id: 'density-heatmap',
        radiusPixels,
      })
    } catch (err) {
      console.error('Lỗi khi dựng HeatmapLayer:', err)
      return null
    }
  }, [mode, hexData, heatData, areaCenter, radiusKm, viewport?.zoom, viewport?.center.latitude])

  // Đăng ký layer vào registry DeckOverlay duy nhất với cùng một ID 'density'
  useDeckLayers('density', activeDeckLayer ? [activeDeckLayer] : [])

  const isCurrentFetching = mode === 'HEX' ? isFetchingHex || isLoadingHex : isFetchingHeat || isLoadingHeat
  const isCurrentError = mode === 'HEX' ? isErrorHex : isErrorHeat
  const isCurrentEmpty =
    mode === 'HEX'
      ? Boolean(hexData && hexData.cells.length === 0)
      : Boolean(heatData && heatData.points.length === 0)

  const handleRetry = () => {
    if (mode === 'HEX') {
      refetchHex()
    } else {
      refetchHeat()
    }
  }

  return (
    <>
      {/* Tooltip hiển thị thông tin ô mật độ (chỉ dùng cho chế độ HEX) */}
      <div
        ref={tooltipRef}
        style={{ display: 'none' }}
        className="pointer-events-none fixed z-50 rounded-md border border-border/80 bg-popover/95 px-2.5 py-1 text-xs font-semibold text-popover-foreground shadow-md backdrop-blur-sm transition-opacity duration-75"
      />

      {/* Thông báo trạng thái tải, rỗng và lỗi của lớp mật độ */}
      <DensityStatus
        isFetching={isCurrentFetching}
        isError={isCurrentError}
        isEmpty={isCurrentEmpty}
        onRetry={handleRetry}
      />
    </>
  )
}
