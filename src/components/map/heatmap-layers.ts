import { HeatmapLayer } from '@deck.gl/aggregation-layers'
import { cellToLatLng, isValidCell } from 'h3-js'
import { MAP_CONFIG } from '@/features/map/lib/map-config'
import type { DensityCell, HeatPoint } from '@/features/map/lib/types'

export type ColorRGBA = [number, number, number, number]

export type HeatmapLayerOptions = {
  id?: string
  radiusPixels: number
  intensity?: number
  threshold?: number
  colorRange?: ColorRGBA[]
  colorDomain?: [number, number] | null
  debounceTimeout?: number
}

/**
 * Tính toán bán kính nhiệt theo đơn vị pixel tại một mức zoom và vĩ độ xác định.
 * - Sử dụng công thức Web Mercator: metersPerPixel = 156543.03392 * cos(lat°) / 2^zoom
 * - Bán kính pixel = RADIUS_METERS / metersPerPixel
 * - Đảm bảo giá trị nằm trong khoảng [RADIUS_PX_MIN, RADIUS_PX_MAX]
 */
export function radiusPixelsForZoom(zoom: number, latitude: number): number {
  const latRad = (latitude * Math.PI) / 180
  const metersPerPixel = (156543.03392 * Math.cos(latRad)) / Math.pow(2, zoom)

  if (metersPerPixel <= 0) {
    return MAP_CONFIG.HEATMAP.RADIUS_PX_MIN
  }

  const rawPixels = MAP_CONFIG.HEATMAP.RADIUS_METERS / metersPerPixel

  return Math.min(
    MAP_CONFIG.HEATMAP.RADIUS_PX_MAX,
    Math.max(MAP_CONFIG.HEATMAP.RADIUS_PX_MIN, Math.round(rawPixels)),
  )
}

/**
 * Biến đổi trọng số bài viết (WEIGHT_TRANSFORM) để tránh hiện tượng một điểm quá nóng làm "cháy" bản đồ.
 * Mặc định sử dụng căn bậc hai (sqrt).
 */
export function transformWeight(count: number): number {
  if (count <= 0) return 0
  return Math.sqrt(count)
}

/**
 * Chuyển đổi danh sách ô lục giác H3 thành danh sách điểm nhiệt HeatPoint (phương án B).
 * Chú ý: cellToLatLng trả về [latitude, longitude], vị trí lưu thành GeoPoint chuẩn.
 */
export function cellsToHeatPoints(cells: DensityCell[]): HeatPoint[] {
  const points: HeatPoint[] = []

  for (const cell of cells) {
    if (!isValidCell(cell.h3Index)) {
      continue
    }

    try {
      const [lat, lng] = cellToLatLng(cell.h3Index)
      if (isNaN(lat) || isNaN(lng)) continue

      points.push({
        position: { latitude: lat, longitude: lng },
        weight: cell.count,
      })
    } catch {
      /* Bỏ qua nếu ô H3 không hợp lệ */
    }
  }

  return points
}

/**
 * Kiểm tra thiết bị có hỗ trợ WebGL/WebGL2 cần thiết cho HeatmapLayer hay không.
 * Nếu không hỗ trợ WebGL, hệ thống sẽ tự động dự phòng sang chế độ ô lục giác (HEX).
 */
export function supportsHeatmap(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return true
  }

  try {
    const canvas = document.createElement('canvas')
    // HeatmapLayer của deck.gl v9 (luma.gl v9) hỗ trợ cả WebGL2 và WebGL1 với các fallback tương ứng
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    return Boolean(gl)
  } catch {
    return false
  }
}

/**
 * Khởi tạo lớp HeatmapLayer của deck.gl cho chế độ hiển thị mật độ mượt (Pha 2B).
 * - id mặc định là 'density'
 * - getPosition trả về [longitude, latitude] theo chuẩn deck.gl
 * - getWeight áp dụng hàm transformWeight
 * - pickable: false vì người dùng tương tác thông qua chấm hotspot ở zoom thấp
 */
export function buildHeatmapLayer(
  points: HeatPoint[],
  opts: HeatmapLayerOptions,
): HeatmapLayer<HeatPoint> {
  return new HeatmapLayer<HeatPoint>({
    id: opts.id ?? 'density-heatmap',
    data: points,
    getPosition: (p: HeatPoint) => [p.position.longitude, p.position.latitude],
    getWeight: (p: HeatPoint) => transformWeight(p.weight),
    aggregation: 'SUM',
    radiusPixels: opts.radiusPixels,
    intensity: opts.intensity ?? MAP_CONFIG.HEATMAP.INTENSITY,
    threshold: opts.threshold ?? MAP_CONFIG.HEATMAP.THRESHOLD,
    colorRange: (opts.colorRange ?? MAP_CONFIG.HEATMAP.COLOR_RANGE) as any,
    debounceTimeout: opts.debounceTimeout ?? MAP_CONFIG.HEATMAP.DEBOUNCE_MS,
    colorDomain: opts.colorDomain ?? null,
    weightsTextureSize: 2048,
    pickable: false,
    updateTriggers: {
      radiusPixels: [opts.radiusPixels],
      getWeight: [points],
    },
  })
}
